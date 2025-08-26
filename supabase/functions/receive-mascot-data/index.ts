import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
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
      throw new Error('API key is required');
    }

    // Verify API key
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      throw new Error('Invalid API key');
    }

    // Update last used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id);

    // Get webhook configuration for field mappings
    const { data: webhookConfig } = await supabase
      .from('webhook_configurations')
      .select('field_mappings')
      .eq('workflow_type', 'mascot_generation')
      .single();

    const mappings = webhookConfig?.field_mappings || {};

    // Parse request body
    const body = await req.json();
    
    // Extract fields using mappings
    const companyProfileId = body[mappings.companyProfileId] || body.companyProfileId;
    const mascotData = body.mascotData || {
      description: body.mascotDescription,
      referenceImage: body.mascotRefImage,
      style: body.mascotStyle || 'modern',
      colors: body.mascotColors || [],
      personality: body.mascotPersonality || 'friendly'
    };

    if (!companyProfileId) {
      throw new Error('Company profile ID is required');
    }

    // Update company profile with mascot data
    const { data: updatedProfile, error: updateError } = await supabase
      .from('company_profiles')
      .update({
        mascot_data: mascotData,
        updated_at: new Date().toISOString()
      })
      .eq('id', companyProfileId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Mascot data received and saved successfully',
        mascot: mascotData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in receive-mascot-data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});