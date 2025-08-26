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

    const { companyName, website, linkedinCompanyUrl, linkedinPersonalUrl, socialUrls } = await req.json();

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    console.log('Starting brand voice analysis for user:', user.id);

    // Create or update company profile
    const { data: profile, error: profileError } = await supabase
      .from('company_profiles')
      .upsert({
        user_id: user.id,
        company_name: companyName,
        website_url: website,
        social_urls: {
          linkedin_company: linkedinCompanyUrl,
          linkedin_personal: linkedinPersonalUrl,
          ...socialUrls
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating/updating company profile:', profileError);
      throw profileError;
    }

    // Create brand voice session
    const { data: session, error: sessionError } = await supabase
      .from('brand_voice_sessions')
      .insert({
        user_id: user.id,
        company_profile_id: profile.id,
        status: 'processing'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating brand voice session:', sessionError);
      throw sessionError;
    }

    // Get webhook configuration from admin settings
    const { data: webhookSettings, error: webhookError } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'n8n_webhook_url')
      .maybeSingle();

    if (webhookError) {
      console.error('Error fetching webhook settings:', webhookError);
      throw new Error('Failed to fetch webhook configuration');
    }

    if (!webhookSettings?.setting_value?.url) {
      console.error('No n8n webhook URL configured');
      throw new Error('N8N webhook URL not configured in admin settings');
    }

    const webhookUrl = webhookSettings.setting_value.url;
    console.log('Triggering n8n webhook for brand voice analysis:', webhookUrl);

    // Prepare payload for n8n webhook
    const webhookPayload = {
      user_id: user.id,
      session_id: session.id,
      company_profile_id: profile.id,
      company_data: {
        company_name: companyName,
        website_url: website,
        social_urls: {
          linkedin_company: linkedinCompanyUrl,
          linkedin_personal: linkedinPersonalUrl,
          ...socialUrls
        }
      },
      workflow_type: 'brand_voice_analysis',
      timestamp: new Date().toISOString()
    };

    // Call n8n webhook
    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook failed with status: ${webhookResponse.status}`);
      }

      console.log('N8N webhook triggered successfully for session:', session.id);

      // Log the workflow execution
      await supabase
        .from('workflow_logs')
        .insert({
          user_id: user.id,
          workflow_type: 'brand_voice_analysis',
          status: 'triggered',
          input_params: webhookPayload,
          n8n_execution_id: null // Will be updated when n8n responds
        });

    } catch (webhookCallError) {
      console.error('Error calling n8n webhook:', webhookCallError);
      
      // Update session status to error
      await supabase
        .from('brand_voice_sessions')
        .update({
          status: 'error',
          error_message: `Webhook call failed: ${webhookCallError.message}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      throw new Error(`Failed to trigger analysis workflow: ${webhookCallError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sessionId: session.id,
        message: 'Brand voice analysis started' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in trigger-brand-voice-analysis:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});