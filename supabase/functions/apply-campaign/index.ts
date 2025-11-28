import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CampaignProduct {
  id: string;
  woocommerce_product_id: number;
  product_name: string;
  product_type: string | null;
  status: string;
  new_regular_price: number | null;
  new_sale_price: number | null;
  original_regular_price: number | null;
  original_sale_price: number | null;
}

interface WooCommerceProduct {
  id: number;
  on_sale: boolean;
  sale_price: string;
  regular_price: string;
  type: string;
}

interface WooCommerceVariation {
  id: number;
  sale_price: string;
  regular_price: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { campaign_id } = await req.json();

    if (!campaign_id) {
      return new Response(
        JSON.stringify({ error: 'campaign_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting campaign processing:', campaign_id);

    // Update campaign status to processing
    await supabase
      .from('ecommerce_campaigns')
      .update({
        processing_status: 'processing',
        started_at: new Date().toISOString(),
      })
      .eq('id', campaign_id);

    // Start background processing
    EdgeRuntime.waitUntil(processCampaign(campaign_id, supabase));

    return new Response(
      JSON.stringify({ started: true, campaign_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error starting campaign:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processCampaign(campaignId: string, supabase: any) {
  const BATCH_SIZE = 20;
  
  try {
    console.log(`Processing campaign: ${campaignId}`);

    // Check if campaign was cancelled
    const { data: campaign } = await supabase
      .from('ecommerce_campaigns')
      .select('processing_status')
      .eq('id', campaignId)
      .single();

    if (campaign?.processing_status === 'cancelled') {
      console.log('Campaign was cancelled');
      return;
    }

    // Reset stuck items (processing for more than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await supabase
      .from('ecommerce_campaign_products')
      .update({ status: 'pending' })
      .eq('campaign_id', campaignId)
      .eq('status', 'processing')
      .lt('applied_at', fiveMinutesAgo);

    // Get pending products
    const { data: products, error: productsError } = await supabase
      .from('ecommerce_campaign_products')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')
      .limit(BATCH_SIZE);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw productsError;
    }

    if (!products || products.length === 0) {
      console.log('No more products to process, marking campaign as completed');
      await markCampaignCompleted(campaignId, supabase);
      return;
    }

    console.log(`Processing batch of ${products.length} products`);

    // Process each product
    for (const product of products) {
      // Check if campaign was cancelled before each product
      const { data: currentCampaign } = await supabase
        .from('ecommerce_campaigns')
        .select('processing_status')
        .eq('id', campaignId)
        .single();

      if (currentCampaign?.processing_status === 'cancelled') {
        console.log('Campaign cancelled, stopping processing');
        // Reset current item back to pending
        await supabase
          .from('ecommerce_campaign_products')
          .update({ status: 'pending' })
          .eq('id', product.id);
        return;
      }

      await processProduct(product, supabase);
    }

    // Update campaign progress
    await updateCampaignProgress(campaignId, supabase);

    // Check if there are more products to process
    const { count } = await supabase
      .from('ecommerce_campaign_products')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');

    if (count && count > 0) {
      console.log(`${count} products remaining, invoking next batch`);
      // Invoke next batch
      await supabase.functions.invoke('apply-campaign', {
        body: { campaign_id: campaignId },
      });
    } else {
      console.log('All products processed, marking campaign as completed');
      await markCampaignCompleted(campaignId, supabase);
    }
  } catch (error) {
    console.error('Error processing campaign:', error);
    await supabase
      .from('ecommerce_campaigns')
      .update({ processing_status: 'failed' })
      .eq('id', campaignId);
  }
}

async function processProduct(product: CampaignProduct, supabase: any) {
  console.log(`Processing product: ${product.product_name} (${product.woocommerce_product_id})`);

  try {
    // Mark as processing
    await supabase
      .from('ecommerce_campaign_products')
      .update({ 
        status: 'processing',
        applied_at: new Date().toISOString()
      })
      .eq('id', product.id);

    // Get current product from WooCommerce
    const wooResponse = await supabase.functions.invoke('woocommerce-products', {
      body: {
        endpoint: `/products/${product.woocommerce_product_id}`,
        method: 'GET',
      },
    });

    if (wooResponse.error) {
      throw new Error(`WooCommerce API error: ${wooResponse.error.message}`);
    }

    const currentProduct: WooCommerceProduct = wooResponse.data;

    // Process based on product type
    if (currentProduct.type === 'simple') {
      await processSimpleProduct(product, currentProduct, supabase);
    } else if (currentProduct.type === 'variable') {
      await processVariableProduct(product, currentProduct, supabase);
    } else {
      await supabase
        .from('ecommerce_campaign_products')
        .update({ 
          status: 'skipped',
          error_message: `Tipo de producto no soportado: ${currentProduct.type}`,
          applied_at: new Date().toISOString()
        })
        .eq('id', product.id);
    }
  } catch (error) {
    console.error(`Error processing product ${product.product_name}:`, error);
    await supabase
      .from('ecommerce_campaign_products')
      .update({ 
        status: 'error',
        error_message: error.message,
        applied_at: new Date().toISOString()
      })
      .eq('id', product.id);
  }
}

async function processSimpleProduct(
  product: CampaignProduct,
  currentProduct: WooCommerceProduct,
  supabase: any
) {
  // Check if already on sale
  if (currentProduct.on_sale || (currentProduct.sale_price && parseFloat(currentProduct.sale_price) > 0)) {
    console.log(`Product ${product.product_name} is already on sale, skipping`);
    await supabase
      .from('ecommerce_campaign_products')
      .update({ 
        status: 'skipped',
        error_message: 'Producto ya está en oferta',
        applied_at: new Date().toISOString()
      })
      .eq('id', product.id);
    return;
  }

  // Update prices in WooCommerce
  const updateResponse = await supabase.functions.invoke('woocommerce-products', {
    body: {
      endpoint: `/products/${product.woocommerce_product_id}`,
      method: 'PUT',
      data: {
        regular_price: product.new_regular_price?.toString(),
        sale_price: product.new_sale_price?.toString(),
      },
    },
  });

  if (updateResponse.error) {
    throw new Error(`Failed to update WooCommerce product: ${updateResponse.error.message}`);
  }

  // Mark as applied
  await supabase
    .from('ecommerce_campaign_products')
    .update({ 
      status: 'applied',
      applied_at: new Date().toISOString()
    })
    .eq('id', product.id);

  console.log(`Successfully applied campaign to ${product.product_name}`);
}

async function processVariableProduct(
  product: CampaignProduct,
  currentProduct: WooCommerceProduct,
  supabase: any
) {
  // Get variations
  const variationsResponse = await supabase.functions.invoke('woocommerce-products', {
    body: {
      endpoint: `/products/${product.woocommerce_product_id}/variations`,
      method: 'GET',
      params: { per_page: 100 },
    },
  });

  if (variationsResponse.error) {
    throw new Error(`Failed to get variations: ${variationsResponse.error.message}`);
  }

  const variations: WooCommerceVariation[] = variationsResponse.data;

  // Filter variations not on sale
  const variationsToUpdate = variations.filter(v => 
    !v.sale_price || parseFloat(v.sale_price) === 0
  );

  if (variationsToUpdate.length === 0) {
    console.log(`All variations of ${product.product_name} are already on sale, skipping`);
    await supabase
      .from('ecommerce_campaign_products')
      .update({ 
        status: 'skipped',
        error_message: 'Todas las variaciones ya están en oferta',
        applied_at: new Date().toISOString()
      })
      .eq('id', product.id);
    return;
  }

  // Get campaign to get markup percentage
  const { data: campaign } = await supabase
    .from('ecommerce_campaigns')
    .select('markup_percentage')
    .eq('id', product.campaign_id)
    .single();

  const markupPercentage = campaign?.markup_percentage || 0;

  // Process each variation
  for (const variation of variationsToUpdate) {
    const currentPrice = parseFloat(variation.regular_price || '0');
    const newRegularPrice = currentPrice * (1 + markupPercentage / 100);
    const newSalePrice = currentPrice;

    // Save original prices
    await supabase
      .from('ecommerce_campaign_variations')
      .insert({
        campaign_product_id: product.id,
        woocommerce_variation_id: variation.id,
        original_regular_price: currentPrice,
        original_sale_price: parseFloat(variation.sale_price || '0'),
        new_regular_price: newRegularPrice,
        new_sale_price: newSalePrice,
        status: 'pending',
      });

    // Update variation in WooCommerce
    const updateResponse = await supabase.functions.invoke('woocommerce-products', {
      body: {
        endpoint: `/products/${product.woocommerce_product_id}/variations/${variation.id}`,
        method: 'PUT',
        data: {
          regular_price: newRegularPrice.toString(),
          sale_price: newSalePrice.toString(),
        },
      },
    });

    if (updateResponse.error) {
      console.error(`Failed to update variation ${variation.id}:`, updateResponse.error);
      await supabase
        .from('ecommerce_campaign_variations')
        .update({ 
          status: 'error',
          error_message: updateResponse.error.message,
          applied_at: new Date().toISOString()
        })
        .eq('campaign_product_id', product.id)
        .eq('woocommerce_variation_id', variation.id);
    } else {
      await supabase
        .from('ecommerce_campaign_variations')
        .update({ 
          status: 'applied',
          applied_at: new Date().toISOString()
        })
        .eq('campaign_product_id', product.id)
        .eq('woocommerce_variation_id', variation.id);
    }
  }

  // Mark product as applied
  await supabase
    .from('ecommerce_campaign_products')
    .update({ 
      status: 'applied',
      applied_at: new Date().toISOString()
    })
    .eq('id', product.id);

  console.log(`Successfully applied campaign to variable product ${product.product_name}`);
}

async function updateCampaignProgress(campaignId: string, supabase: any) {
  const { data: statusCounts } = await supabase
    .from('ecommerce_campaign_products')
    .select('status')
    .eq('campaign_id', campaignId);

  const completed = statusCounts?.filter(p => p.status === 'applied').length || 0;
  const failed = statusCounts?.filter(p => p.status === 'error').length || 0;
  const skipped = statusCounts?.filter(p => p.status === 'skipped').length || 0;

  await supabase
    .from('ecommerce_campaigns')
    .update({
      completed_products: completed,
      failed_products: failed,
      skipped_products: skipped,
    })
    .eq('id', campaignId);
}

async function markCampaignCompleted(campaignId: string, supabase: any) {
  await updateCampaignProgress(campaignId, supabase);

  await supabase
    .from('ecommerce_campaigns')
    .update({
      processing_status: 'completed',
      status: 'active',
      applied_at: new Date().toISOString(),
    })
    .eq('id', campaignId);
}
