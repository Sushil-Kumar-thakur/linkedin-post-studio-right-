import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planType, postExpansions = 0 } = await req.json();
    
    if (!planType) {
      throw new Error("Plan type is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authentication required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !userData.user) {
      throw new Error("Invalid authentication");
    }

    // Calculate pricing
    const basePrices = {
      single: 3900, // $39.00 in cents
      multi: 10000, // $100.00 in cents
      all: 29900    // $299.00 in cents
    };

    const basePrice = basePrices[planType];
    if (!basePrice) {
      throw new Error("Invalid plan type");
    }

    // Calculate expansion cost (25% of base price per 10 posts)
    const expansionCost = Math.floor(basePrice * 0.25) * postExpansions;
    const totalAmount = basePrice + expansionCost;

    // For now, return a mock checkout URL since Stripe isn't fully configured
    // This will be replaced with actual Stripe integration once keys are provided
    const mockCheckoutUrl = `${req.headers.get("origin")}/payment-success?session_id=mock_session_${Date.now()}`;

    // Log the subscription change
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabaseAdmin.from("subscription_history").insert({
      user_id: userData.user.id,
      from_plan: "free",
      to_plan: planType,
      change_reason: "upgrade_request"
    });

    return new Response(
      JSON.stringify({ 
        url: mockCheckoutUrl,
        amount: totalAmount,
        planType,
        postExpansions,
        message: "Checkout session created (demo mode - Stripe integration needed)"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});