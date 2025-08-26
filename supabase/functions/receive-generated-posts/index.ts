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
    console.log('Received generated posts data:', requestData);

    // Get field mappings for post generation workflow
    const { data: config, error: configError } = await supabase
      .from('webhook_configurations')
      .select('field_mappings')
      .eq('workflow_type', 'post_generation')
      .single();

    if (configError || !config) {
      console.error('Error fetching webhook configuration:', configError);
      return new Response(JSON.stringify({ error: 'Configuration not found' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { output_mapping } = config.field_mappings;

    // Extract user context
    const userId = requestData.userId || requestData.user_id;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Map the incoming data to database fields
    const postData: any = { user_id: userId };
    for (const [incomingField, dbField] of Object.entries(output_mapping)) {
      if (requestData[incomingField] !== undefined) {
        postData[dbField] = requestData[incomingField];
      }
    }

    // Set default values
    postData.platform = postData.platform || 'linkedin';
    postData.status = 'draft';
    postData.ai_generated = true;

    // Insert the new post
    const { data: newPost, error: insertError } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting post:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create post' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully created post:', newPost);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Post created successfully',
      post: newPost
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in receive-generated-posts function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});