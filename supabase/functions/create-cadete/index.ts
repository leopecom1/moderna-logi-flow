import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Starting cadete creation process...')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const body = await req.json()
    console.log('📋 Request body received:', Object.keys(body))
    
    const { cadeteData } = body

    if (!cadeteData) {
      console.error('❌ Missing cadeteData in request body')
      throw new Error('Missing cadeteData in request body')
    }

    console.log('👤 Creating auth user for email:', cadeteData.email)

    // Create auth user
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: cadeteData.email,
      password: cadeteData.password,
      user_metadata: {
        full_name: cadeteData.full_name,
        role: 'cadete'
      }
    })

    if (authError) {
      console.error('❌ Auth error:', authError)
      
      // Handle specific error cases
      if (authError.message?.includes('already been registered')) {
        throw new Error('Este email ya está registrado. Por favor usa otro email.')
      } else if (authError.message?.includes('Password should be at least')) {
        throw new Error('La contraseña debe tener al menos 6 caracteres.')
      } else if (authError.message?.includes('Invalid email')) {
        throw new Error('El formato del email no es válido.')
      }
      
      throw new Error(`Error al crear usuario: ${authError.message}`)
    }

    if (!authData.user) {
      console.error('❌ No user returned from auth creation')
      throw new Error('Failed to create user')
    }

    const userId = authData.user.id
    console.log('✅ User created with ID:', userId)

    // Update the profile created by the trigger
    console.log('📝 Updating profile...')
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        full_name: cadeteData.full_name,
        phone: cadeteData.phone,
        role: 'cadete'
      })
      .eq('user_id', userId)

    if (profileError) {
      console.error('❌ Profile update error:', profileError)
      throw profileError
    }

    console.log('✅ Profile updated successfully')

    // Create extended cadete profile
    console.log('👷 Creating cadete profile...')
    const { error: cadeteProfileError } = await supabaseClient
      .from('cadete_profiles')
      .insert([{
        cadete_id: userId,
        driver_license_number: cadeteData.driver_license_number,
        driver_license_category: cadeteData.driver_license_category,
        driver_license_expiry: cadeteData.driver_license_expiry || null,
        emergency_contact_name: cadeteData.emergency_contact_name,
        emergency_contact_phone: cadeteData.emergency_contact_phone,
        emergency_contact_relation: cadeteData.emergency_contact_relation,
        health_insurance_company: cadeteData.health_insurance_company,
        health_insurance_number: cadeteData.health_insurance_number,
        address: cadeteData.address,
        neighborhood: cadeteData.neighborhood,
        city: cadeteData.city,
        departamento: cadeteData.departamento,
        bank_account_number: cadeteData.bank_account_number,
        bank_name: cadeteData.bank_name,
        date_of_birth: cadeteData.date_of_birth || null,
        identification_number: cadeteData.identification_number,
        marital_status: cadeteData.marital_status,
      }])

    if (cadeteProfileError) {
      console.error('❌ Cadete profile creation error:', cadeteProfileError)
      throw cadeteProfileError
    }

    console.log('✅ Cadete profile created successfully')

    return new Response(
      JSON.stringify({ success: true, userId }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Error creating cadete:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 400 
      }
    )
  }
})