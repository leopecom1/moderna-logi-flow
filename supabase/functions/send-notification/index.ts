import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phoneNumber, message, type = 'whatsapp' } = await req.json()
    
    if (!phoneNumber || !message) {
      return new Response(
        JSON.stringify({ error: 'Phone number and message are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Simular envío de mensaje
    // En producción, aquí se integraría con APIs como:
    // - WhatsApp Business API
    // - Twilio
    // - MessageBird
    
    console.log(`Sending ${type} message to ${phoneNumber}: ${message}`)
    
    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simular respuesta exitosa (95% de éxito)
    const success = Math.random() > 0.05
    
    if (success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          messageId: `msg_${Date.now()}`,
          status: 'sent',
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to send message',
          code: 'DELIVERY_FAILED'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
  } catch (error) {
    console.error('Error in send-notification function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})