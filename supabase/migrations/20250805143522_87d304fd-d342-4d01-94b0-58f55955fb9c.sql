z-- Add current user as admin (you'll need to replace this with your actual user ID after signing up)
-- For now, creating the structure and you can add yourself via the admin panel later

-- Create admin_settings table for system-wide configuration
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_settings (only admins can read/write)
CREATE POLICY "Only admins can view admin settings" 
ON public.admin_settings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Only admins can insert admin settings" 
ON public.admin_settings 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Only admins can update admin settings" 
ON public.admin_settings 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Only admins can delete admin settings" 
ON public.admin_settings 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Add trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default n8n webhook settings
INSERT INTO public.admin_settings (setting_key, setting_value, description) VALUES 
('n8n_webhook_url', '{"url": ""}', 'N8N webhook URL for post generation'),
('n8n_webhook_params', '{"params": {}}', 'Default parameters to send with n8n webhook requests');