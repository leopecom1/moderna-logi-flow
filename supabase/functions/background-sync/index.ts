import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncJobItem {
  id: string;
  job_id: string;
  woocommerce_product_id: number;
  woocommerce_product_name: string;
  shopify_product_id: number;
  shopify_product_name: string;
  status: string;
}

interface CopyOptions {
  copyImages: boolean;
  copyDescription: boolean;
  copyPrice: boolean;
  copyVariants: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { job_id } = await req.json();

    if (!job_id) {
      return new Response(
        JSON.stringify({ error: 'job_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Start background processing
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    EdgeRuntime.waitUntil(processJob(job_id, supabaseClient));

    return new Response(
      JSON.stringify({ started: true, job_id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error starting background sync:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processJob(jobId: string, supabase: any) {
  console.log(`Starting background processing for job ${jobId}`);

  try {
    // Update job status to processing
    await supabase
      .from('sync_jobs')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', jobId);

    // Get job details
    const { data: job } = await supabase
      .from('sync_jobs')
      .select('copy_options')
      .eq('id', jobId)
      .single();

    const copyOptions: CopyOptions = job.copy_options;

    // Get pending items
    const { data: items } = await supabase
      .from('sync_job_items')
      .select('*')
      .eq('job_id', jobId)
      .eq('status', 'pending');

    if (!items || items.length === 0) {
      await markJobCompleted(jobId, supabase);
      return;
    }

    console.log(`Processing ${items.length} products for job ${jobId}`);

    // Process each item
    for (const item of items) {
      try {
        await markItemProcessing(item.id, supabase);
        await syncProduct(item, copyOptions, supabase);
        await markItemCompleted(item.id, supabase);
      } catch (error) {
        console.error(`Error syncing product ${item.woocommerce_product_id}:`, error);
        await markItemError(item.id, error.message, supabase);
      }

      // Update job progress
      await updateJobProgress(jobId, supabase);
    }

    await markJobCompleted(jobId, supabase);
    console.log(`Job ${jobId} completed`);
  } catch (error) {
    console.error(`Fatal error processing job ${jobId}:`, error);
    await supabase
      .from('sync_jobs')
      .update({ status: 'failed', completed_at: new Date().toISOString() })
      .eq('id', jobId);
  }
}

async function syncProduct(item: SyncJobItem, copyOptions: CopyOptions, supabase: any) {
  // Get Shopify config
  const { data: shopifyConfig, error: configError } = await supabase
    .from('shopify_config')
    .select('*')
    .eq('is_active', true)
    .single();

  if (configError || !shopifyConfig) {
    throw new Error('Shopify not configured');
  }

  // Fetch Shopify product details directly via REST API
  const shopifyUrl = `https://${shopifyConfig.store_domain}/admin/api/2024-10/products/${item.shopify_product_id}.json`;
  const shopifyResponse = await fetch(shopifyUrl, {
    method: 'GET',
    headers: {
      'X-Shopify-Access-Token': shopifyConfig.access_token,
      'Content-Type': 'application/json',
    },
  });

  if (!shopifyResponse.ok) {
    const errorText = await shopifyResponse.text();
    throw new Error(`Failed to fetch Shopify product: ${shopifyResponse.status} - ${errorText}`);
  }

  const shopifyData = await shopifyResponse.json();
  const shopify = shopifyData.product;

  if (!shopify) {
    throw new Error('Shopify product not found');
  }
  const updateData: any = {};

  // Copy description
  if (copyOptions.copyDescription && shopify.body_html) {
    updateData.description = shopify.body_html;
  }

  // Copy images
  if (copyOptions.copyImages && shopify.images && shopify.images.length > 0) {
    updateData.images = shopify.images.map((img: any) => ({ src: img.src, alt: img.alt || '' }));
  }

  // Check if product has variants
  const hasMultipleVariants = shopify.variants && shopify.variants.length > 1;

  if (hasMultipleVariants && copyOptions.copyVariants) {
    // Variable product - update attributes and variations
    const attributes = extractAttributesFromShopify(shopify);
    updateData.type = 'variable';
    updateData.attributes = attributes;

    // Get WooCommerce config
    const { data: wooConfig, error: wooConfigError } = await supabase
      .from('woocommerce_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (wooConfigError || !wooConfig) {
      throw new Error('WooCommerce not configured');
    }

    // Update product via WooCommerce API
    const wooUpdateUrl = `${wooConfig.store_url}/wp-json/wc/v3/products/${item.woocommerce_product_id}`;
    const auth = btoa(`${wooConfig.consumer_key}:${wooConfig.consumer_secret}`);
    
    const wooUpdateResponse = await fetch(wooUpdateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!wooUpdateResponse.ok) {
      const errorText = await wooUpdateResponse.text();
      throw new Error(`Failed to update WooCommerce product: ${wooUpdateResponse.status} - ${errorText}`);
    }

    // Delete existing variations
    const wooVariationsUrl = `${wooConfig.store_url}/wp-json/wc/v3/products/${item.woocommerce_product_id}/variations`;
    const variationsResponse = await fetch(wooVariationsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (variationsResponse.ok) {
      const existingVariations = await variationsResponse.json();
      
      if (existingVariations && existingVariations.length > 0) {
        // Batch delete variations
        const batchDeleteUrl = `${wooConfig.store_url}/wp-json/wc/v3/products/${item.woocommerce_product_id}/variations/batch`;
        await fetch(batchDeleteUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            delete: existingVariations.map((v: any) => v.id),
          }),
        });
      }
    }

    // Create new variations
    const variationsToCreate = shopify.variants.map((variant: any) => {
      const attributes: any[] = [];
      if (variant.option1) attributes.push({ name: shopify.options[0]?.name || 'Opción 1', option: variant.option1 });
      if (variant.option2) attributes.push({ name: shopify.options[1]?.name || 'Opción 2', option: variant.option2 });
      if (variant.option3) attributes.push({ name: shopify.options[2]?.name || 'Opción 3', option: variant.option3 });

      return {
        regular_price: copyOptions.copyPrice ? variant.price : undefined,
        sku: variant.sku || undefined,
        manage_stock: variant.inventory_quantity === 0,
        stock_quantity: variant.inventory_quantity === 0 ? 0 : undefined,
        stock_status: variant.inventory_quantity > 0 ? 'instock' : 'outofstock',
        attributes,
      };
    });

    // Batch create variations
    const batchCreateUrl = `${wooConfig.store_url}/wp-json/wc/v3/products/${item.woocommerce_product_id}/variations/batch`;
    const createResponse = await fetch(batchCreateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        create: variationsToCreate,
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create variations: ${createResponse.status} - ${errorText}`);
    }
  } else {
    // Simple product
    if (copyOptions.copyPrice && shopify.variants?.[0]?.price) {
      updateData.regular_price = shopify.variants[0].price;
    }

    // Get WooCommerce config
    const { data: wooConfig, error: wooConfigError } = await supabase
      .from('woocommerce_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (wooConfigError || !wooConfig) {
      throw new Error('WooCommerce not configured');
    }

    // Update product via WooCommerce API
    const wooUpdateUrl = `${wooConfig.store_url}/wp-json/wc/v3/products/${item.woocommerce_product_id}`;
    const auth = btoa(`${wooConfig.consumer_key}:${wooConfig.consumer_secret}`);
    
    const wooUpdateResponse = await fetch(wooUpdateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!wooUpdateResponse.ok) {
      const errorText = await wooUpdateResponse.text();
      throw new Error(`Failed to update WooCommerce product: ${wooUpdateResponse.status} - ${errorText}`);
    }
  }

  // Create mapping and history
  await Promise.all([
    supabase.from('product_mappings').upsert({
      woocommerce_product_id: item.woocommerce_product_id,
      woocommerce_product_name: item.woocommerce_product_name,
      shopify_product_id: item.shopify_product_id,
      shopify_product_name: item.shopify_product_name,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: 'woocommerce_product_id,shopify_product_id' }),
    supabase.from('product_sync_history').insert({
      woocommerce_product_id: item.woocommerce_product_id,
      woocommerce_product_name: item.woocommerce_product_name,
      shopify_product_id: item.shopify_product_id,
      shopify_product_name: item.shopify_product_name,
      sync_date: new Date().toISOString(),
    }),
  ]);
}

function extractAttributesFromShopify(shopify: any) {
  const attributes: any[] = [];

  if (shopify.options && shopify.options.length > 0) {
    shopify.options.forEach((option: any) => {
      attributes.push({
        name: option.name,
        visible: true,
        variation: true,
        options: option.values,
      });
    });
  } else if (shopify.variants && shopify.variants.length > 0) {
    const uniqueOptions: any = { option1: new Set(), option2: new Set(), option3: new Set() };
    
    shopify.variants.forEach((variant: any) => {
      if (variant.option1) uniqueOptions.option1.add(variant.option1);
      if (variant.option2) uniqueOptions.option2.add(variant.option2);
      if (variant.option3) uniqueOptions.option3.add(variant.option3);
    });

    if (uniqueOptions.option1.size > 0) {
      attributes.push({ name: 'Opción 1', visible: true, variation: true, options: Array.from(uniqueOptions.option1) });
    }
    if (uniqueOptions.option2.size > 0) {
      attributes.push({ name: 'Opción 2', visible: true, variation: true, options: Array.from(uniqueOptions.option2) });
    }
    if (uniqueOptions.option3.size > 0) {
      attributes.push({ name: 'Opción 3', visible: true, variation: true, options: Array.from(uniqueOptions.option3) });
    }
  }

  return attributes;
}

async function markItemProcessing(itemId: string, supabase: any) {
  await supabase
    .from('sync_job_items')
    .update({ status: 'processing' })
    .eq('id', itemId);
}

async function markItemCompleted(itemId: string, supabase: any) {
  await supabase
    .from('sync_job_items')
    .update({ status: 'completed', processed_at: new Date().toISOString() })
    .eq('id', itemId);
}

async function markItemError(itemId: string, errorMessage: string, supabase: any) {
  await supabase
    .from('sync_job_items')
    .update({
      status: 'error',
      error_message: errorMessage,
      processed_at: new Date().toISOString(),
    })
    .eq('id', itemId);
}

async function updateJobProgress(jobId: string, supabase: any) {
  const { data: stats } = await supabase
    .from('sync_job_items')
    .select('status')
    .eq('job_id', jobId);

  if (!stats) return;

  const completed = stats.filter((s: any) => s.status === 'completed').length;
  const failed = stats.filter((s: any) => s.status === 'error').length;

  await supabase
    .from('sync_jobs')
    .update({
      completed_products: completed,
      failed_products: failed,
    })
    .eq('id', jobId);
}

async function markJobCompleted(jobId: string, supabase: any) {
  await supabase
    .from('sync_jobs')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', jobId);
}
