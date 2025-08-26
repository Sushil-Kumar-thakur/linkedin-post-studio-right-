import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the user from the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Invalid token or user not found:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const requestBody = await req.json();
    console.log('Received webhook trigger request:', {
      user: user.id,
      platforms: requestBody.platforms,
      topic: requestBody.topic
    });

    // Fetch admin settings to get webhook URL and parameters
    const { data: webhookSettings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['n8n_webhook_url', 'n8n_webhook_params']);

    if (settingsError) {
      console.error('Error fetching webhook settings:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch webhook configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse webhook settings
    let webhookUrl = '';
    let webhookParams = {};

    for (const setting of webhookSettings || []) {
      if (setting.setting_key === 'n8n_webhook_url') {
        webhookUrl = setting.setting_value?.url || '';
      } else if (setting.setting_key === 'n8n_webhook_params') {
        webhookParams = setting.setting_value?.params || {};
      }
    }

    if (!webhookUrl) {
      console.error('No webhook URL configured');
      return new Response(
        JSON.stringify({ 
          error: 'N8N webhook URL not configured',
          message: 'Please configure the webhook URL in the admin panel'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare webhook payload
    const webhookPayload = {
      ...webhookParams,
      user_id: user.id,
      timestamp: new Date().toISOString(),
      generation_data: {
        platforms: requestBody.platforms,
        topic: requestBody.topic,
        keywords: requestBody.keywords,
        tone: requestBody.tone,
        length: requestBody.length,
        includeHashtags: requestBody.includeHashtags,
        includeEmojis: requestBody.includeEmojis,
        customInstructions: requestBody.customInstructions,
        companyProfile: requestBody.companyProfile
      }
    };

    console.log('Triggering N8N webhook:', {
      url: webhookUrl,
      payload: webhookPayload
    });

    // Call N8N webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!webhookResponse.ok) {
      console.error('N8N webhook failed:', {
        status: webhookResponse.status,
        statusText: webhookResponse.statusText
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Webhook call failed',
          status: webhookResponse.status,
          statusText: webhookResponse.statusText
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const webhookResult = await webhookResponse.json();
    console.log('N8N webhook response:', webhookResult);

    // Log the workflow execution
    await supabase
      .from('workflow_logs')
      .insert({
        user_id: user.id,
        workflow_type: 'post_generation',
        status: 'success',
        input_params: webhookPayload,
        output_data: webhookResult
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook triggered successfully',
        webhook_response: webhookResult
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in trigger-n8n-webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});