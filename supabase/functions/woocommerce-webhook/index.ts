import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wc-webhook-signature',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get webhook data
    const webhookData = await req.json();
    console.log('📦 Received WooCommerce webhook:', JSON.stringify(webhookData, null, 2));

    // Extract order data
    const wcOrder = webhookData;
    
    // Get active WooCommerce config with branch and warehouse data
    const { data: config } = await supabaseClient
      .from('woocommerce_config')
      .select(`
        *,
        branches:default_branch_id(id, name),
        warehouses:default_warehouse_id(id, name)
      `)
      .eq('is_active', true)
      .single();

    if (!config) {
      throw new Error('No active WooCommerce configuration found');
    }

    if (!config.default_branch_id || !config.default_warehouse_id) {
      throw new Error('WooCommerce config requires default branch and warehouse');
    }

    // Find or create customer
    let customerId: string;
    const customerEmail = wcOrder.billing?.email || `wc-${wcOrder.id}@temp.com`;
    const customerName = `${wcOrder.billing?.first_name || ''} ${wcOrder.billing?.last_name || ''}`.trim() || 'Cliente WooCommerce';
    
    const { data: existingCustomer } = await supabaseClient
      .from('customers')
      .select('id')
      .eq('email', customerEmail)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabaseClient
        .from('customers')
        .insert({
          name: customerName,
          email: customerEmail,
          phone: wcOrder.billing?.phone || '',
          address: `${wcOrder.billing?.address_1 || ''} ${wcOrder.billing?.address_2 || ''}`.trim(),
          city: wcOrder.billing?.city || 'Santa Fe',
          departamento: wcOrder.billing?.state || '',
          neighborhood: '',
          notes: `Cliente importado desde WooCommerce - Order #${wcOrder.id}`,
        })
        .select('id')
        .single();

      if (customerError) throw customerError;
      customerId = newCustomer.id;
    }

    // Transform WooCommerce line items to our products format with warehouse info
    const products = wcOrder.line_items?.map((item: any) => ({
      product_id: item.product_id.toString(),
      product_name: item.name,
      warehouse_id: config.default_warehouse_id,
      warehouse_name: config.warehouses?.name || 'Depósito Principal',
      quantity: item.quantity,
      unit_price: parseFloat(item.price),
      currency: wcOrder.currency || 'UYU',
      sku: item.sku || '',
      variation_id: item.variation_id || null,
    })) || [];

    // Detect pickup at branch (retiro en sucursal)
    const isPickup = wcOrder.shipping_lines?.some((line: any) => 
      line.method_id === 'local_pickup' || 
      line.method_title?.toLowerCase().includes('retiro') ||
      line.method_title?.toLowerCase().includes('pickup')
    ) || false;

    // Read custom metadata for assembly and delivery info
    const getMetaValue = (key: string): string | null => {
      const meta = wcOrder.meta_data?.find((m: any) => m.key === key);
      return meta?.value || null;
    };

    const requiereArmado = getMetaValue('requiere_armado') === 'si' || config.default_requiere_armado;
    const entregarAhora = getMetaValue('entregar_ahora') === 'si' || 
                          wcOrder.customer_note?.toLowerCase().includes('urgente') ||
                          wcOrder.customer_note?.toLowerCase().includes('hoy');
    
    // Assembly contact information
    const armadoContactoNombre = getMetaValue('armado_contacto_nombre') || 
                                  `${wcOrder.billing?.first_name || ''} ${wcOrder.billing?.last_name || ''}`.trim();
    const armadoContactoTelefono = getMetaValue('armado_contacto_telefono') || wcOrder.billing?.phone || '';
    const armadoFecha = getMetaValue('armado_fecha') || null;
    const armadoHorario = getMetaValue('armado_horario') || null;

    // Map WooCommerce payment method to our enum
    const paymentMethodMap: { [key: string]: string } = {
      'bacs': 'transferencia',
      'cheque': 'otro',
      'cod': 'efectivo',
      'stripe': 'tarjeta_credito',
      'paypal': 'otro',
    };
    const paymentMethod = paymentMethodMap[wcOrder.payment_method] || 'efectivo';

    // Map WooCommerce status to our order status
    const statusMap: { [key: string]: string } = {
      'pending': 'pendiente',
      'processing': 'pendiente_envio',
      'on-hold': 'pendiente',
      'completed': 'entregado',
      'cancelled': 'cancelado',
      'refunded': 'cancelado',
      'failed': 'cancelado',
    };
    const orderStatus = statusMap[wcOrder.status] || 'pendiente';

    // Prepare delivery address
    const deliveryAddress = [
      wcOrder.shipping?.address_1,
      wcOrder.shipping?.address_2,
      wcOrder.shipping?.city,
      wcOrder.shipping?.state,
      wcOrder.shipping?.postcode,
      wcOrder.shipping?.country,
    ].filter(Boolean).join(', ') || 
    [
      wcOrder.billing?.address_1,
      wcOrder.billing?.address_2,
      wcOrder.billing?.city,
      wcOrder.billing?.state,
      wcOrder.billing?.postcode,
      wcOrder.billing?.country,
    ].filter(Boolean).join(', ');

    // Check if order already exists (avoid duplicates)
    const { data: existingOrder } = await supabaseClient
      .from('orders')
      .select('id')
      .eq('notes', `WooCommerce Order #${wcOrder.id}`)
      .maybeSingle();

    if (existingOrder) {
      // Update existing order
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({
          status: orderStatus,
          total_amount: parseFloat(wcOrder.total),
          products: JSON.stringify(products),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingOrder.id);

      if (updateError) throw updateError;

      console.log(`✅ Updated existing order: ${existingOrder.id}`);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Order updated', order_id: existingOrder.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get a default seller (first gerencia user) or use service account
    const { data: seller } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('role', 'gerencia')
      .limit(1)
      .maybeSingle();

    const sellerId = seller?.user_id || config.created_by;

    // Create new order with complete operational data
    const { data: newOrder, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        order_number: `WC-${wcOrder.id}`,
        customer_id: customerId,
        seller_id: sellerId,
        branch_id: config.default_branch_id,
        delivery_address: deliveryAddress,
        delivery_neighborhood: wcOrder.shipping?.city || wcOrder.billing?.city || '',
        delivery_departamento: wcOrder.shipping?.state || wcOrder.billing?.state || '',
        products: JSON.stringify(products),
        total_amount: parseFloat(wcOrder.total),
        payment_method: paymentMethod,
        status: orderStatus,
        delivery_date: wcOrder.date_created ? new Date(wcOrder.date_created).toISOString().split('T')[0] : null,
        notes: `WooCommerce Order #${wcOrder.id}${wcOrder.customer_note ? `\n\nNota del cliente: ${wcOrder.customer_note}` : ''}`,
        retiro_en_sucursal: isPickup,
        entregar_ahora: entregarAhora,
        requiere_armado: requiereArmado,
        armado_fecha: armadoFecha,
        armado_horario: armadoHorario,
        armado_contacto_nombre: armadoContactoNombre,
        armado_contacto_telefono: armadoContactoTelefono,
        armado_estado: requiereArmado ? 'pendiente' : null,
      })
      .select('id')
      .single();

    if (orderError) throw orderError;

    console.log(`✅ Created new order from WooCommerce: ${newOrder.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Order synced successfully', 
        order_id: newOrder.id,
        wc_order_id: wcOrder.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ Error processing WooCommerce webhook:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
