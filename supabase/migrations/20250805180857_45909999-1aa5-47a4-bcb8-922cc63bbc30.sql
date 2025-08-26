-- Create admin permissions table for granular role management
CREATE TABLE public.admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('SuperAdmin', 'Admin', 'User Management', 'Technician')),
  can_delete_accounts BOOLEAN DEFAULT false,
  can_manage_admins BOOLEAN DEFAULT false,
  can_manage_users BOOLEAN DEFAULT false,
  can_view_error_logs BOOLEAN DEFAULT false,
  can_manage_stripe BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create subscription history table
CREATE TABLE public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_plan TEXT,
  to_plan TEXT NOT NULL,
  change_reason TEXT,
  effective_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payment transactions table
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  plan_type TEXT NOT NULL,
  post_expansion_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create usage tracking table
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  posts_used_this_month INTEGER DEFAULT 0,
  posts_limit INTEGER DEFAULT 3,
  trial_posts_used INTEGER DEFAULT 0,
  billing_cycle_start DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE),
  last_reset_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE),
  platform_access JSONB DEFAULT '{"linkedin": true, "facebook": false, "instagram": false, "twitter": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_trial_user BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS trial_posts_remaining INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS billing_cycle_day INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS post_expansions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_plan TEXT DEFAULT 'free' CHECK (platform_plan IN ('free', 'single', 'multi', 'all'));

-- Enable RLS on new tables
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_permissions
CREATE POLICY "SuperAdmins can view all admin permissions" ON public.admin_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_permissions ap 
      WHERE ap.user_id = auth.uid() AND ap.permission_level = 'SuperAdmin'
    )
  );

CREATE POLICY "Admins can view non-SuperAdmin permissions" ON public.admin_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_permissions ap 
      WHERE ap.user_id = auth.uid() AND ap.permission_level IN ('SuperAdmin', 'Admin')
    ) AND permission_level != 'SuperAdmin'
  );

CREATE POLICY "SuperAdmins can manage all admin permissions" ON public.admin_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_permissions ap 
      WHERE ap.user_id = auth.uid() AND ap.permission_level = 'SuperAdmin'
    )
  );

-- RLS Policies for subscription_history
CREATE POLICY "Users can view own subscription history" ON public.subscription_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscription history" ON public.subscription_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_permissions ap 
      WHERE ap.user_id = auth.uid() AND ap.permission_level IN ('SuperAdmin', 'Admin', 'User Management')
    )
  );

CREATE POLICY "System can insert subscription history" ON public.subscription_history
  FOR INSERT WITH CHECK (true);

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view own payment transactions" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment transactions" ON public.payment_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_permissions ap 
      WHERE ap.user_id = auth.uid() AND ap.permission_level IN ('SuperAdmin', 'Admin')
    )
  );

CREATE POLICY "System can insert payment transactions" ON public.payment_transactions
  FOR INSERT WITH CHECK (true);

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view own usage tracking" ON public.usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage tracking" ON public.usage_tracking
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage tracking" ON public.usage_tracking
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all usage tracking" ON public.usage_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_permissions ap 
      WHERE ap.user_id = auth.uid() AND ap.permission_level IN ('SuperAdmin', 'Admin', 'User Management')
    )
  );

-- Create enhanced admin check function
CREATE OR REPLACE FUNCTION public.has_admin_permission(permission_type TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_permissions ap
    WHERE ap.user_id = auth.uid() 
    AND (
      ap.permission_level = 'SuperAdmin' OR
      (permission_type = 'manage_users' AND ap.permission_level IN ('Admin', 'User Management')) OR
      (permission_type = 'view_errors' AND ap.permission_level = 'Technician') OR
      (permission_type = 'manage_stripe' AND ap.permission_level IN ('SuperAdmin', 'Admin'))
    )
  );
$$;

-- Create function to initialize user usage tracking
CREATE OR REPLACE FUNCTION public.initialize_user_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.usage_tracking (user_id, posts_used_this_month, posts_limit, trial_posts_used)
  VALUES (NEW.user_id, 0, 3, 0);
  RETURN NEW;
END;
$$;

-- Create trigger to initialize usage tracking when profile is created
CREATE TRIGGER initialize_usage_tracking_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_usage();

-- Create function to reset monthly usage on the 1st of each month
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.usage_tracking 
  SET 
    posts_used_this_month = 0,
    billing_cycle_start = DATE_TRUNC('month', CURRENT_DATE),
    last_reset_date = DATE_TRUNC('month', CURRENT_DATE),
    updated_at = now()
  WHERE last_reset_date < DATE_TRUNC('month', CURRENT_DATE);
END;
$$;