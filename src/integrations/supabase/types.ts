export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          can_delete_accounts: boolean | null
          can_manage_admins: boolean | null
          can_manage_stripe: boolean | null
          can_manage_users: boolean | null
          can_view_error_logs: boolean | null
          created_at: string | null
          id: string
          permission_level: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_delete_accounts?: boolean | null
          can_manage_admins?: boolean | null
          can_manage_stripe?: boolean | null
          can_manage_users?: boolean | null
          can_view_error_logs?: boolean | null
          created_at?: string | null
          id?: string
          permission_level: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_delete_accounts?: boolean | null
          can_manage_admins?: boolean | null
          can_manage_stripe?: boolean | null
          can_manage_users?: boolean | null
          can_view_error_logs?: boolean | null
          created_at?: string | null
          id?: string
          permission_level?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          id: string
          permissions: Json | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          api_key: string
          created_at: string
          id: string
          is_active: boolean | null
          key_name: string
          last_used_at: string | null
          permissions: Json | null
          updated_at: string
          workflow_type: string | null
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          key_name: string
          last_used_at?: string | null
          permissions?: Json | null
          updated_at?: string
          workflow_type?: string | null
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          key_name?: string
          last_used_at?: string | null
          permissions?: Json | null
          updated_at?: string
          workflow_type?: string | null
        }
        Relationships: []
      }
      brand_voice_sessions: {
        Row: {
          company_profile_id: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          session_data: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_profile_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          session_data?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_profile_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          session_data?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_voice_sessions_company_profile_id_fkey"
            columns: ["company_profile_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profiles: {
        Row: {
          ai_analysis: Json | null
          brand_guidelines: string | null
          brand_voice_analysis: Json | null
          business_overview: string | null
          company_name: string
          created_at: string | null
          description: string | null
          id: string
          ideal_customer_profile: string | null
          industry: string | null
          mascot_data: Json | null
          past_posts: Json | null
          social_urls: Json | null
          updated_at: string | null
          user_id: string
          value_proposition: string | null
          voice_tone: string | null
          website_url: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          brand_guidelines?: string | null
          brand_voice_analysis?: Json | null
          business_overview?: string | null
          company_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          ideal_customer_profile?: string | null
          industry?: string | null
          mascot_data?: Json | null
          past_posts?: Json | null
          social_urls?: Json | null
          updated_at?: string | null
          user_id: string
          value_proposition?: string | null
          voice_tone?: string | null
          website_url?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          brand_guidelines?: string | null
          brand_voice_analysis?: Json | null
          business_overview?: string | null
          company_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          ideal_customer_profile?: string | null
          industry?: string | null
          mascot_data?: Json | null
          past_posts?: Json | null
          social_urls?: Json | null
          updated_at?: string | null
          user_id?: string
          value_proposition?: string | null
          voice_tone?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          component_name: string | null
          context: Json | null
          created_at: string | null
          error_code: string
          error_message: string
          id: string
          severity: string | null
          stack_trace: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component_name?: string | null
          context?: Json | null
          created_at?: string | null
          error_code: string
          error_message: string
          id?: string
          severity?: string | null
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component_name?: string | null
          context?: Json | null
          created_at?: string | null
          error_code?: string
          error_message?: string
          id?: string
          severity?: string | null
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          plan_type: string
          post_expansion_count: number | null
          status: string | null
          stripe_payment_intent_id: string | null
          transaction_date: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          plan_type: string
          post_expansion_count?: number | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          transaction_date?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          plan_type?: string
          post_expansion_count?: number | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          transaction_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          ai_generated: boolean | null
          content: string
          created_at: string | null
          engagement_stats: Json | null
          generation_params: Json | null
          id: string
          image_url: string | null
          platform: string
          scheduled_for: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_generated?: boolean | null
          content: string
          created_at?: string | null
          engagement_stats?: Json | null
          generation_params?: Json | null
          id?: string
          image_url?: string | null
          platform: string
          scheduled_for?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_generated?: boolean | null
          content?: string
          created_at?: string | null
          engagement_stats?: Json | null
          generation_params?: Json | null
          id?: string
          image_url?: string | null
          platform?: string
          scheduled_for?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          billing_cycle_day: number | null
          company_name: string | null
          created_at: string | null
          email: string
          full_name: string | null
          generations_limit: number | null
          generations_used: number | null
          id: string
          is_trial_user: boolean | null
          linkedin_company_url: string | null
          linkedin_personal_url: string | null
          onboarding_completed: boolean | null
          platform_plan: string | null
          post_expansions: number | null
          stripe_customer_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_posts_remaining: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_cycle_day?: number | null
          company_name?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          generations_limit?: number | null
          generations_used?: number | null
          id?: string
          is_trial_user?: boolean | null
          linkedin_company_url?: string | null
          linkedin_personal_url?: string | null
          onboarding_completed?: boolean | null
          platform_plan?: string | null
          post_expansions?: number | null
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_posts_remaining?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_cycle_day?: number | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          generations_limit?: number | null
          generations_used?: number | null
          id?: string
          is_trial_user?: boolean | null
          linkedin_company_url?: string | null
          linkedin_personal_url?: string | null
          onboarding_completed?: boolean | null
          platform_plan?: string | null
          post_expansions?: number | null
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_posts_remaining?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      social_posts_collection: {
        Row: {
          collection_status: string
          created_at: string
          date_range_end: string
          date_range_start: string
          id: string
          platform: string
          posts_data: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          collection_status?: string
          created_at?: string
          date_range_end: string
          date_range_start: string
          id?: string
          platform: string
          posts_data?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          collection_status?: string
          created_at?: string
          date_range_end?: string
          date_range_start?: string
          id?: string
          platform?: string
          posts_data?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_history: {
        Row: {
          change_reason: string | null
          created_at: string | null
          effective_date: string | null
          from_plan: string | null
          id: string
          to_plan: string
          user_id: string
        }
        Insert: {
          change_reason?: string | null
          created_at?: string | null
          effective_date?: string | null
          from_plan?: string | null
          id?: string
          to_plan: string
          user_id: string
        }
        Update: {
          change_reason?: string | null
          created_at?: string | null
          effective_date?: string | null
          from_plan?: string | null
          id?: string
          to_plan?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          billing_cycle_start: string | null
          created_at: string | null
          id: string
          last_reset_date: string | null
          platform_access: Json | null
          posts_limit: number | null
          posts_used_this_month: number | null
          trial_posts_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_cycle_start?: string | null
          created_at?: string | null
          id?: string
          last_reset_date?: string | null
          platform_access?: Json | null
          posts_limit?: number | null
          posts_used_this_month?: number | null
          trial_posts_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_cycle_start?: string | null
          created_at?: string | null
          id?: string
          last_reset_date?: string | null
          platform_access?: Json | null
          posts_limit?: number | null
          posts_used_this_month?: number | null
          trial_posts_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      webhook_configurations: {
        Row: {
          authentication_config: Json | null
          created_at: string
          documentation: string | null
          expected_payload: Json | null
          field_mappings: Json | null
          id: string
          inbound_endpoint: string
          is_active: boolean | null
          outbound_webhook_url: string | null
          required_headers: Json | null
          response_format: Json | null
          updated_at: string
          webhook_description: string | null
          workflow_type: string
        }
        Insert: {
          authentication_config?: Json | null
          created_at?: string
          documentation?: string | null
          expected_payload?: Json | null
          field_mappings?: Json | null
          id?: string
          inbound_endpoint: string
          is_active?: boolean | null
          outbound_webhook_url?: string | null
          required_headers?: Json | null
          response_format?: Json | null
          updated_at?: string
          webhook_description?: string | null
          workflow_type: string
        }
        Update: {
          authentication_config?: Json | null
          created_at?: string
          documentation?: string | null
          expected_payload?: Json | null
          field_mappings?: Json | null
          id?: string
          inbound_endpoint?: string
          is_active?: boolean | null
          outbound_webhook_url?: string | null
          required_headers?: Json | null
          response_format?: Json | null
          updated_at?: string
          webhook_description?: string | null
          workflow_type?: string
        }
        Relationships: []
      }
      workflow_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          input_params: Json | null
          n8n_execution_id: string | null
          output_data: Json | null
          status: string
          updated_at: string | null
          user_id: string
          workflow_type: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_params?: Json | null
          n8n_execution_id?: string | null
          output_data?: Json | null
          status: string
          updated_at?: string | null
          user_id: string
          workflow_type: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_params?: Json | null
          n8n_execution_id?: string | null
          output_data?: Json | null
          status?: string
          updated_at?: string | null
          user_id?: string
          workflow_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_admin_permission: {
        Args: { permission_type: string }
        Returns: boolean
      }
      is_admin: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      reset_monthly_usage: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
