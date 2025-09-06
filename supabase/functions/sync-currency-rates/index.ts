import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting currency rates synchronization...');

    // Fetch USD exchange rate from DolarAPI Uruguay
    const response = await fetch('https://uy.dolarapi.com/v1/cotizaciones/usd');
    
    if (!response.ok) {
      throw new Error(`DolarAPI request failed: ${response.status} ${response.statusText}`);
    }

    const currencyData = await response.json();
    console.log('Fetched currency data:', currencyData);

    // Update or insert USD rate in database
    const { data, error } = await supabase
      .from('currency_rates')
      .upsert({
        currency_code: 'USD',
        currency_name: currencyData.nombre || 'Dólar Estadounidense',
        buy_rate: currencyData.compra || 0,
        sell_rate: currencyData.venta || 0,
        last_updated: new Date().toISOString(),
        is_active: true
      }, {
        onConflict: 'currency_code'
      });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Currency rates updated successfully:', data);

    return new Response(JSON.stringify({
      success: true,
      data: {
        currency_code: 'USD',
        currency_name: currencyData.nombre || 'Dólar Estadounidense',
        buy_rate: currencyData.compra || 0,
        sell_rate: currencyData.venta || 0,
        last_updated: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-currency-rates function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});