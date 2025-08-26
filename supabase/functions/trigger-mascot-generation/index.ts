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

    const { imageUrl, description } = await req.json();

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    console.log('Starting mascot generation for user:', user.id);

    // Get or create company profile
    const { data: profile, error: profileError } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    if (!profile) {
      throw new Error('Company profile not found. Please complete company information first.');
    }

    // Update brand voice session
    const { data: session, error: sessionError } = await supabase
      .from('brand_voice_sessions')
      .upsert({
        user_id: user.id,
        company_profile_id: profile.id,
        status: 'processing'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error updating brand voice session:', sessionError);
      throw sessionError;
    }

    // Here you would trigger your n8n workflow for mascot generation
    // For now, we'll simulate the process
    console.log('Mascot generation triggered for session:', session.id);

    // Mock mascot generation (replace with actual n8n workflow)
    setTimeout(async () => {
      try {
        const mockMascotData = {
          mascot_image_url: `https://via.placeholder.com/400x400/007BFF/FFFFFF?text=${encodeURIComponent(profile.company_name + ' Mascot')}`,
          mascot_personality: `Meet ${profile.company_name}'s friendly mascot! ${description} This character embodies the brand's values of innovation, reliability, and customer focus. With a warm and approachable personality, this mascot serves as the perfect ambassador for the company's mission and values.`
        };

        await supabase
          .from('company_profiles')
          .update({
            mascot_image_url: mockMascotData.mascot_image_url,
            mascot_personality: mockMascotData.mascot_personality,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);

        await supabase
          .from('brand_voice_sessions')
          .update({
            mascot_image_url: mockMascotData.mascot_image_url,
            mascot_personality: mockMascotData.mascot_personality,
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', session.id);

        console.log('Mascot generation completed for session:', session.id);
      } catch (error) {
        console.error('Error completing mascot generation:', error);
        await supabase
          .from('brand_voice_sessions')
          .update({
            status: 'error',
            updated_at: new Date().toISOString()
          })
          .eq('id', session.id);
      }
    }, 3000); // 3 second delay for simulation

    return new Response(
      JSON.stringify({ 
        success: true, 
        sessionId: session.id,
        message: 'Mascot generation started' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in trigger-mascot-generation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});