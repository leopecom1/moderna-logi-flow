import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WooCommerceConfig {
  store_url: string;
  consumer_key: string;
  consumer_secret: string;
}

async function getWooCommerceConfig(supabase: any): Promise<WooCommerceConfig | null> {
  const { data, error } = await supabase
    .from('woocommerce_config')
    .select('store_url, consumer_key, consumer_secret, is_active')
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.error('Error fetching WooCommerce config:', error);
    return null;
  }

  return data;
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&`;

  const hmac = createHmac('sha256', signingKey);
  hmac.update(baseString);
  return hmac.digest('base64');
}

async function makeWooCommerceRequest(
  config: WooCommerceConfig,
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  const url = `${config.store_url}/wp-json/wc/v3${endpoint}`;
  
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: config.consumer_key,
    oauth_nonce: Math.random().toString(36).substring(7),
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
  };

  const signature = generateOAuthSignature(method, url, oauthParams, config.consumer_secret);
  oauthParams.oauth_signature = signature;

  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ');

  const options: RequestInit = {
    method,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  console.log(`Making ${method} request to WooCommerce:`, url);
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('WooCommerce API error:', errorText);
    throw new Error(`WooCommerce API error: ${response.status} ${errorText}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    console.log('Auth header present:', !!authHeader);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Rely on platform JWT verification. Do not block if getUser fails in this context.
    // We only log for debugging purposes.
    try {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      console.log('User auth result (non-blocking):', { user: !!user, error: userError?.message });
    } catch (e) {
      console.warn('auth.getUser() failed (non-blocking):', e);
    }


    const config = await getWooCommerceConfig(supabaseClient);
    console.log('WooCommerce config loaded:', !!config);
    
    if (!config) {
      console.error('No active WooCommerce configuration found');
      return new Response(JSON.stringify({ error: 'WooCommerce not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace('/woocommerce-products', '');
    const method = req.method;

    let body = null;
    if (method !== 'GET' && method !== 'DELETE') {
      body = await req.json();
    }

    let endpoint = '';
    let wooMethod = method;

    // Products endpoints
    if (path.startsWith('/products')) {
      if (path === '/products' && method === 'GET') {
        const page = url.searchParams.get('page') || '1';
        const perPage = url.searchParams.get('per_page') || '20';
        const search = url.searchParams.get('search') || '';
        const category = url.searchParams.get('category') || '';
        const status = url.searchParams.get('status') || '';
        
        endpoint = `/products?page=${page}&per_page=${perPage}`;
        if (search) endpoint += `&search=${encodeURIComponent(search)}`;
        if (category) endpoint += `&category=${category}`;
        if (status) endpoint += `&status=${status}`;
      } else if (path === '/products' && method === 'POST') {
        endpoint = '/products';
      } else if (path.match(/^\/products\/\d+$/)) {
        const productId = path.split('/')[2];
        endpoint = `/products/${productId}`;
      }
    }
    // Categories endpoints
    else if (path.startsWith('/categories')) {
      if (path === '/categories' && method === 'GET') {
        const perPage = url.searchParams.get('per_page') || '100';
        endpoint = `/products/categories?per_page=${perPage}&orderby=name&order=asc`;
      } else if (path === '/categories' && method === 'POST') {
        endpoint = '/products/categories';
      } else if (path.match(/^\/categories\/\d+$/)) {
        const categoryId = path.split('/')[2];
        endpoint = `/products/categories/${categoryId}`;
      }
    }
    // Media upload endpoint
    else if (path === '/media' && method === 'POST') {
      // Upload to WordPress media library
      const formData = body;
      const mediaUrl = `${config.store_url}/wp-json/wp/v2/media`;
      
      const oauthParams: Record<string, string> = {
        oauth_consumer_key: config.consumer_key,
        oauth_nonce: Math.random().toString(36).substring(7),
        oauth_signature_method: 'HMAC-SHA256',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_version: '1.0',
      };

      const signature = generateOAuthSignature('POST', mediaUrl, oauthParams, config.consumer_secret);
      oauthParams.oauth_signature = signature;

      const authHeader = 'OAuth ' + Object.keys(oauthParams)
        .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
        .join(', ');

      const response = await fetch(mediaUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Media upload error: ${response.status}`);
      }

      const result = await response.json();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!endpoint) {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await makeWooCommerceRequest(config, endpoint, wooMethod, body);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in woocommerce-products function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
