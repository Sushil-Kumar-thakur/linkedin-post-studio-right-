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

    const { startDate, endDate, platforms, linkedinCompanyUrl } = await req.json();

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    console.log('Starting posts collection for user:', user.id);

    // Create posts collection record
    const { data: collection, error: collectionError } = await supabase
      .from('social_posts_collection')
      .insert({
        user_id: user.id,
        platform: platforms.join(','),
        date_range_start: startDate,
        date_range_end: endDate,
        collection_status: 'processing'
      })
      .select()
      .single();

    if (collectionError) {
      console.error('Error creating posts collection:', collectionError);
      throw collectionError;
    }

    // Here you would trigger your n8n workflow for posts collection
    // For now, we'll simulate the process
    console.log('Posts collection triggered for collection:', collection.id);

    // Mock posts collection (replace with actual n8n workflow)
    setTimeout(async () => {
      try {
        const mockPosts = [
          {
            id: '1',
            title: 'Exciting Product Launch',
            content: 'We are thrilled to announce the launch of our latest innovation that will revolutionize the industry.',
            platform: 'linkedin',
            thumbnail: 'https://via.placeholder.com/300x200/007BFF/FFFFFF?text=Product+Launch',
            likes: 245,
            comments: 23,
            shares: 18,
            post_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            author: 'Company CEO',
            external_link: 'https://linkedin.com/posts/example-1',
            engagement_stats: { likes: 245, comments: 23, shares: 18, views: 1200 }
          },
          {
            id: '2',
            title: 'Team Achievement Recognition',
            content: 'Congratulations to our amazing team for achieving this incredible milestone.',
            platform: 'linkedin',
            thumbnail: 'https://via.placeholder.com/300x200/28A745/FFFFFF?text=Team+Achievement',
            likes: 189,
            comments: 15,
            shares: 12,
            post_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            author: 'HR Manager',
            external_link: 'https://linkedin.com/posts/example-2',
            engagement_stats: { likes: 189, comments: 15, shares: 12, views: 890 }
          },
          {
            id: '3',
            title: 'Industry Insights',
            content: 'Here are our thoughts on the latest trends shaping our industry and what it means for the future.',
            platform: 'facebook',
            thumbnail: 'https://via.placeholder.com/300x200/FFC107/000000?text=Industry+Insights',
            likes: 156,
            comments: 31,
            shares: 8,
            post_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
            author: 'Marketing Team',
            external_link: 'https://facebook.com/posts/example-3',
            engagement_stats: { likes: 156, comments: 31, shares: 8, views: 742 }
          }
        ];

        await supabase
          .from('social_posts_collection')
          .update({
            posts_data: mockPosts,
            collection_status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', collection.id);

        console.log('Posts collection completed for collection:', collection.id);

        // Trigger webhook if configured
        const { data: webhookConfig } = await supabase
          .from('webhook_configurations')
          .select('outbound_webhook_url, is_active')
          .eq('workflow_type', 'posts_collection_completed')
          .eq('is_active', true)
          .single();

        if (webhookConfig?.outbound_webhook_url) {
          console.log('Triggering webhook for posts collection completion');
          
          // Get user profile data for company name and LinkedIn URL
          const { data: profile } = await supabase
            .from('profiles')
            .select('company_name, linkedin_company_url')
            .eq('user_id', user.id)
            .single();
          
          const webhookPayload = {
            user_id: user.id,
            collection_id: collection.id,
            company_name: profile?.company_name || 'Unknown Company',
            company_linkedin_url: linkedinCompanyUrl || profile?.linkedin_company_url || '',
            platform_type: 'linkedin',
            status: 'completed',
            platform: platforms.join(','),
            date_range_start: startDate,
            date_range_end: endDate,
            posts_count: mockPosts.length,
            completed_at: new Date().toISOString()
          };

          try {
            const webhookResponse = await fetch(webhookConfig.outbound_webhook_url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(webhookPayload)
            });

            if (webhookResponse.ok) {
              console.log('Webhook triggered successfully');
            } else {
              console.error('Webhook trigger failed:', webhookResponse.status, webhookResponse.statusText);
            }
          } catch (webhookError) {
            console.error('Error triggering webhook:', webhookError);
          }
        } else {
          console.log('No active webhook configured for posts_collection_completed');
        }
      } catch (error) {
        console.error('Error completing posts collection:', error);
        await supabase
          .from('social_posts_collection')
          .update({
            collection_status: 'error',
            updated_at: new Date().toISOString()
          })
          .eq('id', collection.id);
      }
    }, 4000); // 4 second delay for simulation

    return new Response(
      JSON.stringify({ 
        success: true, 
        collectionId: collection.id,
        message: 'Posts collection started' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in trigger-posts-collection:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});