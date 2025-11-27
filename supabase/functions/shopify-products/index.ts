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

    // Construct Shopify API URL with query parameters
    const shopifyUrl = new URL(`https://${config.store_domain}/admin/api/2024-01/products.json`);
    shopifyUrl.searchParams.set('limit', limit);
    if (pageInfo) shopifyUrl.searchParams.set('page_info', pageInfo);
    if (title) shopifyUrl.searchParams.set('title', title);
    if (status && status !== 'all') shopifyUrl.searchParams.set('status', status);
    
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

    const data = await shopifyResponse.json();

    // Parse Link header for pagination cursors
    const linkHeader = shopifyResponse.headers.get('Link');
    let nextCursor = null;
    let prevCursor = null;

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

    return new Response(
      JSON.stringify({
        products: data.products,
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
