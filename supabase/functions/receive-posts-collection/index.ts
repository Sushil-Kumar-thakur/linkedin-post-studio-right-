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
    console.log('Received posts collection data:', requestData);

    // Get field mappings for posts collection workflow
    const { data: config, error: configError } = await supabase
      .from('webhook_configurations')
      .select('field_mappings')
      .eq('workflow_type', 'posts_collection')
      .single();

    if (configError || !config) {
      console.error('Error fetching webhook configuration:', configError);
      return new Response(JSON.stringify({ error: 'Configuration not found' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { input_mapping } = config.field_mappings;

    // Extract collection context
    const collectionId = requestData[input_mapping.collection_id] || requestData.collection_id;
    const postsData = requestData[input_mapping.posts] || requestData.posts_data || [];

    if (!collectionId) {
      return new Response(JSON.stringify({ error: 'Collection ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update the social posts collection with the received data
    const { data: updatedCollection, error: updateError } = await supabase
      .from('social_posts_collection')
      .update({
        posts_data: postsData,
        collection_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', collectionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating posts collection:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update collection' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully updated posts collection:', updatedCollection);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Posts collection updated successfully',
      collection: updatedCollection
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in receive-posts-collection function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});