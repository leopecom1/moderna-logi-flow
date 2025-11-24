import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
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
  // Use query string auth (recommended over OAuth header for HTTPS)
  const baseUrl = `${config.store_url.replace(/\/$/, '')}/wp-json/wc/v3`;
  const urlObj = new URL(baseUrl + endpoint);
  // Append WooCommerce credentials
  urlObj.searchParams.set('consumer_key', config.consumer_key);
  urlObj.searchParams.set('consumer_secret', config.consumer_secret);

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET' && method !== 'DELETE') {
    options.body = JSON.stringify(body);
  }

  const url = urlObj.toString();
  console.log(`Making ${method} request to WooCommerce:`, url);
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('WooCommerce API error:', errorText);
    throw new Error(`WooCommerce API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  
  // Return both data and pagination headers
  return {
    data,
    headers: {
      'X-WP-Total': response.headers.get('X-WP-Total') || '0',
      'X-WP-TotalPages': response.headers.get('X-WP-TotalPages') || '1',
    }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[Request] ${req.method} ${req.url}`);
    
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
    console.log('[URL] Full URL:', req.url);
    console.log('[URL] Pathname:', url.pathname);
    
    const path = url.pathname.replace('/woocommerce-products', '');
    console.log('[URL] Extracted path:', path);
    
    const method = req.method;

    let body = null;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await req.json();
        console.log('[Body]', JSON.stringify(body));
      } catch (e) {
        console.error('[Body] Failed to parse JSON:', e);
      }
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
      // Variations endpoints
      else if (path.match(/^\/products\/\d+\/variations$/)) {
        const productId = path.split('/')[2];
        if (method === 'GET') {
          endpoint = `/products/${productId}/variations?per_page=100`;
        } else if (method === 'POST') {
          endpoint = `/products/${productId}/variations`;
        }
      } else if (path.match(/^\/products\/\d+\/variations\/batch$/)) {
        const productId = path.split('/')[2];
        endpoint = `/products/${productId}/variations/batch`;
      } else if (path.match(/^\/products\/\d+\/variations\/\d+$/)) {
        const parts = path.split('/');
        const productId = parts[2];
        const variationId = parts[4];
        endpoint = `/products/${productId}/variations/${variationId}`;
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
      console.error('[Endpoint] No valid endpoint found for path:', path);
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[WooCommerce] Calling ${wooMethod} ${endpoint}`);
    const result = await makeWooCommerceRequest(config, endpoint, wooMethod, body);
    console.log('[Success] Request completed');

    // For GET /products requests, include pagination metadata
    if (wooMethod === 'GET' && endpoint.includes('/products?')) {
      const responseBody = {
        products: result.data,
        total: parseInt(result.headers['X-WP-Total'] || '0'),
        totalPages: parseInt(result.headers['X-WP-TotalPages'] || '1'),
      };
      
      return new Response(JSON.stringify(responseBody), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For other requests, return data directly
    return new Response(JSON.stringify(result.data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[Error] Function failed:', error);
    console.error('[Error] Stack:', error.stack);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      {
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
