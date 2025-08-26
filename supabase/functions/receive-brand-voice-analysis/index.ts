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

    const payload = await req.json();
    console.log('Received brand voice analysis result:', payload);

    const { 
      session_id, 
      company_profile_id, 
      user_id,
      analysis_result,
      execution_id,
      status = 'completed'
    } = payload;

    if (!session_id || !company_profile_id || !user_id) {
      throw new Error('Missing required fields: session_id, company_profile_id, or user_id');
    }

    // Update company profile with analysis results
    if (analysis_result && status === 'completed') {
      const { error: profileUpdateError } = await supabase
        .from('company_profiles')
        .update({
          business_overview: analysis_result.business_overview,
          ideal_customer_profile: analysis_result.ideal_customer_profile,
          value_proposition: analysis_result.value_proposition,
          brand_voice_analysis: analysis_result,
          updated_at: new Date().toISOString()
        })
        .eq('id', company_profile_id);

      if (profileUpdateError) {
        console.error('Error updating company profile:', profileUpdateError);
        throw profileUpdateError;
      }
    }

    // Update brand voice session status
    const { error: sessionUpdateError } = await supabase
      .from('brand_voice_sessions')
      .update({
        status: status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        error_message: status === 'error' ? analysis_result?.error_message : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', session_id);

    if (sessionUpdateError) {
      console.error('Error updating brand voice session:', sessionUpdateError);
      throw sessionUpdateError;
    }

    // Update workflow log
    const { error: logUpdateError } = await supabase
      .from('workflow_logs')
      .update({
        status: status,
        output_data: analysis_result,
        n8n_execution_id: execution_id,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)
      .eq('workflow_type', 'brand_voice_analysis')
      .order('created_at', { ascending: false })
      .limit(1);

    if (logUpdateError) {
      console.error('Error updating workflow log:', logUpdateError);
      // Don't throw here as this is not critical
    }

    console.log('Brand voice analysis result processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Analysis result processed successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in receive-brand-voice-analysis:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});