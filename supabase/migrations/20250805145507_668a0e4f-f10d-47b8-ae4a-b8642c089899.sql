-- Fix infinite recursion in admin_users RLS policy
-- Drop the existing recursive policy
DROP POLICY IF EXISTS "Only admins can view admin users" ON public.admin_users;

-- Create a security definer function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = user_uuid AND role = 'admin'
  );
$$;

-- Create new non-recursive policy using the security definer function
CREATE POLICY "Only admins can view admin users" 
ON public.admin_users 
FOR SELECT 
USING (public.is_admin());

-- Create error_logs table for tech support
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  error_code text NOT NULL,
  error_message text NOT NULL,
  component_name text,
  stack_trace text,
  user_agent text,
  url text,
  severity text DEFAULT 'error',
  context jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on error_logs
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for error_logs
CREATE POLICY "Users can insert their own error logs" 
ON public.error_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all error logs" 
ON public.error_logs 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Users can view their own error logs" 
ON public.error_logs 
FOR SELECT 
USING (auth.uid() = user_id);