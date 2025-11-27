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
  // Fetch Shopify product details
  const { data: shopifyProduct, error: shopifyError } = await supabase.functions.invoke('shopify-products', {
    body: { action: 'get', productId: item.shopify_product_id },
  });

  if (shopifyError) throw new Error(`Failed to fetch Shopify product: ${shopifyError.message}`);

  const shopify = shopifyProduct.product;
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

    // Update product
    const { error: updateError } = await supabase.functions.invoke('woocommerce-products', {
      body: {
        action: 'update',
        productId: item.woocommerce_product_id,
        data: updateData,
      },
    });

    if (updateError) throw new Error(`Failed to update WooCommerce product: ${updateError.message}`);

    // Delete existing variations
    const { data: existingVariations } = await supabase.functions.invoke('woocommerce-products', {
      body: {
        action: 'getVariations',
        productId: item.woocommerce_product_id,
      },
    });

    if (existingVariations && existingVariations.length > 0) {
      await supabase.functions.invoke('woocommerce-products', {
        body: {
          action: 'batchDeleteVariations',
          productId: item.woocommerce_product_id,
          variationIds: existingVariations.map((v: any) => v.id),
        },
      });
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

    await supabase.functions.invoke('woocommerce-products', {
      body: {
        action: 'batchCreateVariations',
        productId: item.woocommerce_product_id,
        variations: variationsToCreate,
      },
    });
  } else {
    // Simple product
    if (copyOptions.copyPrice && shopify.variants?.[0]?.price) {
      updateData.regular_price = shopify.variants[0].price;
    }

    const { error: updateError } = await supabase.functions.invoke('woocommerce-products', {
      body: {
        action: 'update',
        productId: item.woocommerce_product_id,
        data: updateData,
      },
    });

    if (updateError) throw new Error(`Failed to update WooCommerce product: ${updateError.message}`);
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
