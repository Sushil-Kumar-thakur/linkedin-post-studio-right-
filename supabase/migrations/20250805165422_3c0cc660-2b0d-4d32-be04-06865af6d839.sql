-- Add missing fields to company_profiles table
ALTER TABLE public.company_profiles 
ADD COLUMN IF NOT EXISTS business_overview TEXT,
ADD COLUMN IF NOT EXISTS ideal_customer_profile TEXT,
ADD COLUMN IF NOT EXISTS value_proposition TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS social_urls JSONB DEFAULT '{}';

-- Create webhook_configurations table for managing multiple workflow types
CREATE TABLE public.webhook_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_type TEXT NOT NULL UNIQUE,
  inbound_endpoint TEXT NOT NULL,
  outbound_webhook_url TEXT,
  field_mappings JSONB DEFAULT '{}',
  authentication_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on webhook_configurations
ALTER TABLE public.webhook_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies for webhook_configurations (admin only)
CREATE POLICY "Only admins can view webhook configurations" 
ON public.webhook_configurations 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Only admins can insert webhook configurations" 
ON public.webhook_configurations 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Only admins can update webhook configurations" 
ON public.webhook_configurations 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Only admins can delete webhook configurations" 
ON public.webhook_configurations 
FOR DELETE 
USING (is_admin());

-- Create api_keys table for webhook authentication
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  workflow_type TEXT,
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on api_keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for api_keys (admin only)
CREATE POLICY "Only admins can view api keys" 
ON public.api_keys 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Only admins can insert api keys" 
ON public.api_keys 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Only admins can update api keys" 
ON public.api_keys 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Only admins can delete api keys" 
ON public.api_keys 
FOR DELETE 
USING (is_admin());

-- Create trigger for webhook_configurations updated_at
CREATE TRIGGER update_webhook_configurations_updated_at
BEFORE UPDATE ON public.webhook_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for api_keys updated_at
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default webhook configurations
INSERT INTO public.webhook_configurations (workflow_type, inbound_endpoint, field_mappings) VALUES
('company_profile', '/receive-company-profile', '{
  "input_mapping": {
    "company_name": "companyName",
    "website_url": "website",
    "social_urls": "socialUrls"
  },
  "output_mapping": {
    "businessOverview": "business_overview",
    "idealCustomerProfile": "ideal_customer_profile", 
    "valueProposition": "value_proposition",
    "brandVoiceTone": "voice_tone",
    "brandGuidelines": "brand_guidelines"
  }
}'::jsonb),
('post_generation', '/receive-generated-posts', '{
  "input_mapping": {
    "topic": "topic",
    "platform": "platform",
    "tone": "tone"
  },
  "output_mapping": {
    "content": "content",
    "title": "title",
    "imageUrl": "image_url"
  }
}'::jsonb);