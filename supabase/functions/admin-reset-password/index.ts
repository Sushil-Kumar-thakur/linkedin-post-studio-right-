import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword) {
      throw new Error("User ID and new password are required");
    }

    // Create admin client to verify permissions
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify admin has permission to reset passwords
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authentication required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !userData.user) {
      throw new Error("Invalid authentication");
    }

    // Check if user has admin permissions
    const { data: permissions, error: permError } = await supabaseAdmin
      .from("admin_permissions")
      .select("permission_level")
      .eq("user_id", userData.user.id)
      .single();

    if (permError || !permissions) {
      throw new Error("Access denied: Admin permissions required");
    }

    if (
      !["SuperAdmin", "Admin", "User Management"].includes(
        permissions.permission_level
      )
    ) {
      throw new Error("Access denied: Insufficient permissions");
    }

    // Reset the user's password
    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: newPassword,
      }
    );

    if (resetError) {
      throw resetError;
    }

    // Log the admin action
    await supabaseAdmin.from("error_logs").insert({
      error_code: "ADMIN_PASSWORD_RESET",
      error_message: `Admin ${userData.user.email} reset password for user ${userId}`,
      severity: "info",
      user_id: userData.user.id,
      context: {
        target_user_id: userId,
        admin_permission_level: permissions.permission_level,
      },
    });

    return new Response(
      JSON.stringify({ message: "Password reset successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
