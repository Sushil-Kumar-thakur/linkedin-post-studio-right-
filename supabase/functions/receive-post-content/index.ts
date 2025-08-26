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
      .eq('workflow_type', 'post_content_creation')
      .single();

    const mappings = webhookConfig?.field_mappings || {};

    // Parse request body
    const body = await req.json();
    
    // Extract fields using mappings
    const companyProfileId = body[mappings.companyProfileId] || body.companyProfileId;
    const userId = body.userId || body.user_id;
    const generatedContent = body.generatedContent;
    const platform = body.platform || 'linkedin';

    if (!companyProfileId && !userId) {
      throw new Error('Company profile ID or user ID is required');
    }

    if (!generatedContent) {
      throw new Error('Generated content is required');
    }

    // Get user ID from company profile if not provided
    let finalUserId = userId;
    if (!finalUserId && companyProfileId) {
      const { data: profile } = await supabase
        .from('company_profiles')
        .select('user_id')
        .eq('id', companyProfileId)
        .single();
      
      if (profile) {
        finalUserId = profile.user_id;
      }
    }

    if (!finalUserId) {
      throw new Error('Unable to determine user ID');
    }

    // Create new post with generated content
    const { data: newPost, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: finalUserId,
        content: generatedContent,
        platform: platform,
        status: 'draft',
        ai_generated: true,
        generation_params: {
          companyProfileId,
          generatedAt: new Date().toISOString(),
          source: 'ai_content_creation'
        }
      })
      .select()
      .single();

    if (postError) {
      throw postError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Post content received and saved successfully',
        post: newPost
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in receive-post-content:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});