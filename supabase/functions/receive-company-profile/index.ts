import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate API key
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify API key
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update last used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id);

    const requestData = await req.json();
    console.log('Received company profile data:', requestData);

    // Get field mappings for company profile workflow
    const { data: config, error: configError } = await supabase
      .from('webhook_configurations')
      .select('field_mappings')
      .eq('workflow_type', 'company_profile')
      .single();

    if (configError || !config) {
      console.error('Error fetching webhook configuration:', configError);
      return new Response(JSON.stringify({ error: 'Configuration not found' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { output_mapping } = config.field_mappings;

    // Extract user context (company name to identify the profile)
    const companyName = requestData.companyName || requestData.company_name;
    const companyProfileId = requestData.company_profile_id;
    
    if (!companyName) {
      return new Response(JSON.stringify({ error: 'Company name required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find the company profile to update - use ID if provided, otherwise fall back to company name
    let profileQuery = supabase.from('company_profiles').select('*');
    
    if (companyProfileId) {
      profileQuery = profileQuery.eq('id', companyProfileId);
    } else {
      profileQuery = profileQuery.eq('company_name', companyName);
    }
    
    const { data: profile, error: profileError } = await profileQuery.single();

    if (profileError || !profile) {
      console.error('Error finding company profile:', profileError);
      return new Response(JSON.stringify({ error: 'Company profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Map the incoming data to database fields
    const updateData: any = {};
    
    // Map configured fields from webhook configuration
    for (const [incomingField, dbField] of Object.entries(output_mapping)) {
      if (requestData[incomingField] !== undefined) {
        updateData[dbField] = requestData[incomingField];
      }
    }
    
    // Add specific N8N fields for business overview, value proposition, and ideal customer profile
    if (requestData.businessOverview !== undefined) {
      updateData.business_overview = requestData.businessOverview;
    }
    if (requestData.valueProposition !== undefined) {
      updateData.value_proposition = requestData.valueProposition;
    }
    if (requestData.idealCustomerProfile !== undefined) {
      updateData.ideal_customer_profile = requestData.idealCustomerProfile;
    }

    // Update the company profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('company_profiles')
      .update(updateData)
      .eq('id', profile.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating company profile:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully updated company profile:', updatedProfile);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Company profile updated successfully',
      profile: updatedProfile
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in receive-company-profile function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});