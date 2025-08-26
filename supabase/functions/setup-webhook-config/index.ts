import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: isAdminResult } = await supabase.rpc('is_admin', { user_uuid: user.id });
    if (!isAdminResult) {
      throw new Error('Admin access required');
    }

    const { webhookUrl, webhookType = 'brand_voice_analysis' } = await req.json();

    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    console.log('Setting up webhook configuration for:', webhookType, webhookUrl);

    // Upsert the webhook configuration in admin_settings
    const { error: settingsError } = await supabase
      .from('admin_settings')
      .upsert({
        setting_key: 'n8n_webhook_url',
        setting_value: { url: webhookUrl, workflow_type: webhookType },
        description: 'N8N webhook URL for brand voice analysis workflow',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      });

    if (settingsError) {
      console.error('Error updating webhook settings:', settingsError);
      throw settingsError;
    }

    // Also create/update the webhook configuration entry
    const { error: configError } = await supabase
      .from('webhook_configurations')
      .upsert({
        workflow_type: webhookType,
        inbound_endpoint: `/functions/v1/receive-${webhookType.replace('_', '-')}`,
        outbound_webhook_url: webhookUrl,
        is_active: true,
        field_mappings: {
          user_id: 'user_id',
          session_id: 'session_id',
          company_profile_id: 'company_profile_id',
          analysis_result: 'analysis_result'
        },
        updated_at: new Date().toISOString()
      });

    if (configError) {
      console.error('Error updating webhook configuration:', configError);
      throw configError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook configuration updated successfully',
        webhookUrl,
        webhookType
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in setup-webhook-config:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});