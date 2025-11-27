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
      // Use the store_domain exactly as configured; it must be a *.myshopify.com domain
      const rawDomain = (config.store_domain || '').trim().toLowerCase();
      if (!rawDomain.endsWith('.myshopify.com')) {
        const msg = `Invalid Shopify store_domain in config. Expected *.myshopify.com, got: ${rawDomain || 'empty'}`;
        console.error(msg);
        return new Response(JSON.stringify({ error: msg }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const storeDomain = rawDomain;
      console.log(`Using Shopify domain (GraphQL search): ${storeDomain}`);
      const graphQLEndpoint = `https://${storeDomain}/admin/api/2024-10/graphql.json`;

      // Build search query. Use simple full-text search for title
      const searchQuery = title; // Shopify GraphQL full-text search

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
                options {
                  id
                  name
                  position
                  values
                }
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
                      selectedOptions {
                        name
                        value
                      }
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
        
        let errorMessage = 'Failed to fetch products from Shopify GraphQL';
        if (graphQLResponse.status === 404) {
          errorMessage = `Shopify store not found. Verify your store domain is correct (should be *.myshopify.com). Current domain: ${storeDomain}`;
        } else if (graphQLResponse.status === 401) {
          errorMessage = 'Invalid Shopify access token. Please check your credentials.';
        }
        
        return new Response(
          JSON.stringify({ 
            error: errorMessage, 
            details: errorText,
            domain_used: storeDomain 
          }),
          { status: graphQLResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const graphQLData = await graphQLResponse.json();

      // Log GraphQL response details
      console.log('GraphQL response status:', graphQLResponse.status);
      console.log('GraphQL response has errors:', !!graphQLData.errors);
      
      // Check for GraphQL errors in the response body (status 200 but with errors)
      if (graphQLData.errors) {
        console.error('GraphQL returned errors:', JSON.stringify(graphQLData.errors));
        return new Response(
          JSON.stringify({ 
            error: 'GraphQL query error', 
            details: graphQLData.errors 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const productEdges = graphQLData?.data?.products?.edges || [];
      const pageInfo = graphQLData?.data?.products?.pageInfo || {};
      
      console.log('GraphQL products found:', productEdges.length);

      products = productEdges.map((edge: any) => {
        const node = edge.node;
        // Convert Shopify GID to numeric ID
        const numericId = Number(node.id.split('/').pop());

        const options = (node.options || []).map((opt: any, index: number) => ({
          id: opt.id ? Number(opt.id.split('/').pop()) : index + 1,
          name: opt.name,
          position: opt.position ?? index + 1,
          values: opt.values || [],
        }));

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
          const selectedOptions = v.selectedOptions || [];
          return {
            id: Number(v.id.split('/').pop()),
            title: v.title,
            price: v.price,
            compare_at_price: v.compareAtPrice ?? null,
            sku: v.sku,
            inventory_quantity: v.inventoryQuantity,
            option1: selectedOptions[0]?.value ?? null,
            option2: selectedOptions[1]?.value ?? null,
            option3: selectedOptions[2]?.value ?? null,
            image_id: v.image ? Number(v.image.id.split('/').pop()) : null,
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
          options,
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
      // Use the store_domain exactly as configured; it must be a *.myshopify.com domain
      const rawDomain = (config.store_domain || '').trim().toLowerCase();
      if (!rawDomain.endsWith('.myshopify.com')) {
        const msg = `Invalid Shopify store_domain in config. Expected *.myshopify.com, got: ${rawDomain || 'empty'}`;
        console.error(msg);
        return new Response(JSON.stringify({ error: msg }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const storeDomain = rawDomain;
      console.log(`Using Shopify domain (REST): ${storeDomain}`);
      const shopifyUrl = new URL(`https://${storeDomain}/admin/api/2024-10/products.json`);
      shopifyUrl.searchParams.set('limit', limit);
      if (pageInfo) {
        shopifyUrl.searchParams.set('page_info', pageInfo);
      }
      if (status && status !== 'all') {
        shopifyUrl.searchParams.set('status', status);
      }
      
      console.log('Calling Shopify API:', shopifyUrl.toString());
  
      // Make request to Shopify REST API first
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

        // If the REST API returns 404 (e.g. version/path not found), fall back to GraphQL listing
        if (shopifyResponse.status === 404) {
          console.log(`REST API returned 404, falling back to GraphQL products listing. Domain used: ${storeDomain}`);

          const graphQLEndpoint = `https://${storeDomain}/admin/api/2024-10/graphql.json`;

          // Build GraphQL query for listing products with optional status filter
          const searchParts: string[] = [];
          if (status && status !== 'all') {
            // Shopify status filter: active | draft | archived
            searchParts.push(`status:${status}`);
          }
          const searchQuery = searchParts.join(' ');

          const graphqlQuery = `
            query ListProducts($limit: Int!, $query: String) {
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
                    options {
                      id
                      name
                      position
                      values
                    }
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
                          selectedOptions {
                            name
                            value
                          }
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
                query: searchQuery || null,
              },
            }),
          });

          if (!graphQLResponse.ok) {
            const gqlErrorText = await graphQLResponse.text();
            console.error('Shopify GraphQL fallback API error:', gqlErrorText);
            
            let errorMessage = 'Failed to fetch products from Shopify GraphQL';
            if (graphQLResponse.status === 404) {
              errorMessage = `Shopify store not found. Verify your store domain is correct (should be *.myshopify.com). Current domain: ${storeDomain}`;
            } else if (graphQLResponse.status === 401) {
              errorMessage = 'Invalid Shopify access token. Please check your credentials.';
            }
            
            return new Response(
              JSON.stringify({ 
                error: errorMessage, 
                details: gqlErrorText,
                domain_used: storeDomain 
              }),
              { status: graphQLResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const graphQLData = await graphQLResponse.json();
          const productEdges = graphQLData?.data?.products?.edges || [];
          const pageInfoGql = graphQLData?.data?.products?.pageInfo || {};

          products = productEdges.map((edge: any) => {
            const node = edge.node;
            const numericId = Number(node.id.split('/').pop());

            const options = (node.options || []).map((opt: any, index: number) => ({
              id: opt.id ? Number(opt.id.split('/').pop()) : index + 1,
              name: opt.name,
              position: opt.position ?? index + 1,
              values: opt.values || [],
            }));

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
              const selectedOptions = v.selectedOptions || [];
              return {
                id: Number(v.id.split('/').pop()),
                title: v.title,
                price: v.price,
                compare_at_price: v.compareAtPrice ?? null,
                sku: v.sku,
                inventory_quantity: v.inventoryQuantity,
                option1: selectedOptions[0]?.value ?? null,
                option2: selectedOptions[1]?.value ?? null,
                option3: selectedOptions[2]?.value ?? null,
                image_id: v.image ? Number(v.image.id.split('/').pop()) : null,
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
              options,
              tags: Array.isArray(node.tags) ? node.tags.join(', ') : (node.tags ?? ''),
              handle: node.handle ?? '',
              created_at: node.createdAt ?? new Date().toISOString(),
              updated_at: node.updatedAt ?? new Date().toISOString(),
            };
          });

          nextCursor = pageInfoGql.hasNextPage ? pageInfoGql.endCursor ?? null : null;
          prevCursor = pageInfoGql.hasPreviousPage ? pageInfoGql.startCursor ?? null : null;
        } else {
          let errorMessage = 'Failed to fetch products from Shopify';
          if (shopifyResponse.status === 404) {
            errorMessage = `Shopify store not found. Verify your store domain is correct (should be *.myshopify.com). Current domain: ${storeDomain}`;
          } else if (shopifyResponse.status === 401) {
            errorMessage = 'Invalid Shopify access token. Please check your credentials.';
          }
          
          return new Response(
            JSON.stringify({ 
              error: errorMessage, 
              details: errorText,
              domain_used: storeDomain 
            }),
            { status: shopifyResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        const restData = await shopifyResponse.json();
        products = restData.products;
        
        // Log REST API response details
        console.log('REST products received:', products?.length || 0);
  
        // Parse Link header for pagination cursors
        const linkHeader = shopifyResponse.headers.get('Link');
        console.log('Link header:', linkHeader);
  
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
        
        console.log('Pagination cursors - next:', nextCursor, 'prev:', prevCursor);
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
