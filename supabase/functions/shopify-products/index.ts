import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse URL parameters (works for both GET and POST)
    const url = new URL(req.url);
    const limit = url.searchParams.get('limit') || '20';
    const pageInfo = url.searchParams.get('page_info'); // Shopify cursor
    const title = url.searchParams.get('title'); // Search by title
    const status = url.searchParams.get('status'); // Filter by status
    
    console.log('Request params:', { limit, pageInfo, title, status });

    // Get Shopify config
    const { data: config, error: configError } = await supabaseClient
      .from('shopify_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: 'Shopify not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct Shopify API URL or GraphQL query with query parameters
    const useGraphQLSearch = !!title;

    let products: any[] = [];
    let nextCursor: string | null = null;
    let prevCursor: string | null = null;

    if (useGraphQLSearch) {
      // Use Shopify GraphQL API for more powerful, catalog-wide search
      // Ensure we use the myshopify.com domain for API access
      const storeDomain = config.store_domain.includes('.myshopify.com') 
        ? config.store_domain 
        : config.store_domain.replace(/\.(com|net|org|io)$/, '') + '.myshopify.com';
      const graphQLEndpoint = `https://${storeDomain}/admin/api/2024-01/graphql.json`;

      // Build search query. We use wildcard search on title and optionally filter by status
      const searchParts = [`title:*${title}*`];
      if (status && status !== 'all') {
        // Shopify status filter: active | draft | archived
        searchParts.push(`status:${status}`);
      }
      const searchQuery = searchParts.join(' ');

      const graphqlQuery = `
        query SearchProducts($limit: Int!, $query: String!) {
          products(first: $limit, query: $query) {
            edges {
              cursor
              node {
                id
                title
                handle
                status
                productType
                vendor
                tags
                createdAt
                updatedAt
                images(first: 10) {
                  edges {
                    node {
                      id
                      url
                      altText
                      width
                      height
                    }
                  }
                }
                variants(first: 100) {
                  edges {
                    node {
                      id
                      title
                      price
                      compareAtPrice
                      sku
                      inventoryQuantity
                      weight
                      weightUnit
                      image {
                        id
                      }
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      `;

      console.log('Calling Shopify GraphQL search with query:', searchQuery);

      const graphQLResponse = await fetch(graphQLEndpoint, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': config.access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: {
            limit: Number(limit) || 20,
            query: searchQuery,
          },
        }),
      });

      if (!graphQLResponse.ok) {
        const errorText = await graphQLResponse.text();
        console.error('Shopify GraphQL API error:', errorText);
        return new Response(
          JSON.stringify({ error: `Shopify GraphQL API error: ${graphQLResponse.status}` }),
          { status: graphQLResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const graphQLData = await graphQLResponse.json();

      const productEdges = graphQLData?.data?.products?.edges || [];
      const pageInfo = graphQLData?.data?.products?.pageInfo || {};

      products = productEdges.map((edge: any) => {
        const node = edge.node;
        // Convert Shopify GID to numeric ID
        const numericId = Number(node.id.split('/').pop());

        const images = (node.images?.edges || []).map((imgEdge: any, index: number) => ({
          id: Number(imgEdge.node.id?.split('/').pop() ?? index + 1),
          src: imgEdge.node.url,
          alt: imgEdge.node.altText ?? null,
          position: index + 1,
          width: imgEdge.node.width ?? undefined,
          height: imgEdge.node.height ?? undefined,
        }));

        const variants = (node.variants?.edges || []).map((variantEdge: any) => {
          const v = variantEdge.node;
          return {
            id: Number(v.id.split('/').pop()),
            title: v.title,
            price: v.price,
            compare_at_price: v.compareAtPrice ?? null,
            sku: v.sku,
            inventory_quantity: v.inventoryQuantity,
            option1: null,
            option2: null,
            option3: null,
            image_id: v.image ? Number(v.image.id.split('/').pop()) : null,
            weight: v.weight ?? undefined,
            weight_unit: v.weightUnit ?? undefined,
          };
        });

        return {
          id: numericId,
          title: node.title,
          body_html: '',
          vendor: node.vendor ?? '',
          product_type: node.productType ?? '',
          status: (node.status || 'active').toLowerCase(),
          images,
          variants,
          options: [],
          tags: Array.isArray(node.tags) ? node.tags.join(', ') : (node.tags ?? ''),
          handle: node.handle ?? '',
          created_at: node.createdAt ?? new Date().toISOString(),
          updated_at: node.updatedAt ?? new Date().toISOString(),
        };
      });

      nextCursor = pageInfo.hasNextPage ? pageInfo.endCursor ?? null : null;
      prevCursor = pageInfo.hasPreviousPage ? pageInfo.startCursor ?? null : null;
    } else {
      // Fallback to REST API for standard listing & cursor-based pagination
      // Ensure we use the myshopify.com domain for API access
      const storeDomain = config.store_domain.includes('.myshopify.com') 
        ? config.store_domain 
        : config.store_domain.replace(/\.(com|net|org|io)$/, '') + '.myshopify.com';
      const shopifyUrl = new URL(`https://${storeDomain}/admin/api/2024-01/products.json`);
      shopifyUrl.searchParams.set('limit', limit);
      if (pageInfo) {
        shopifyUrl.searchParams.set('page_info', pageInfo);
      }
      if (status && status !== 'all') {
        shopifyUrl.searchParams.set('status', status);
      }
      
      console.log('Calling Shopify API:', shopifyUrl.toString());
  
      // Make request to Shopify
      const shopifyResponse = await fetch(shopifyUrl.toString(), {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': config.access_token,
          'Content-Type': 'application/json',
        },
      });
  
      if (!shopifyResponse.ok) {
        const errorText = await shopifyResponse.text();
        console.error('Shopify API error:', errorText);
        return new Response(
          JSON.stringify({ error: `Shopify API error: ${shopifyResponse.status}` }),
          { status: shopifyResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
  
      const restData = await shopifyResponse.json();
      products = restData.products;
  
      // Parse Link header for pagination cursors
      const linkHeader = shopifyResponse.headers.get('Link');
  
      if (linkHeader) {
        const links = linkHeader.split(',');
        for (const link of links) {
          const match = link.match(/<[^>]*[?&]page_info=([^&>]+)[^>]*>;\s*rel="([^"]+)"/);
          if (match) {
            const cursor = match[1];
            const rel = match[2];
            if (rel === 'next') nextCursor = cursor;
            if (rel === 'previous') prevCursor = cursor;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        products,
        pagination: {
          nextCursor,
          prevCursor,
          hasNext: !!nextCursor,
          hasPrev: !!prevCursor,
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in shopify-products function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
