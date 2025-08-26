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

    // Parse request body
    const body = await req.json();
    
    const postId = body.postId;
    const updatedImage = body.updatedImage;
    const revisionComments = body.postImageRevisionComments;

    if (!postId) {
      throw new Error('Post ID is required');
    }

    if (!updatedImage) {
      throw new Error('Updated image URL is required');
    }

    // Update the post with revised image
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({
        image_url: updatedImage,
        updated_at: new Date().toISOString(),
        generation_params: {
          ...body.generation_params,
          image_revision_comments: revisionComments,
          image_revised_at: new Date().toISOString()
        }
      })
      .eq('id', postId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Post image updated successfully',
        post: updatedPost,
        image: {
          url: updatedImage,
          revised_at: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in receive-post-image-update:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});