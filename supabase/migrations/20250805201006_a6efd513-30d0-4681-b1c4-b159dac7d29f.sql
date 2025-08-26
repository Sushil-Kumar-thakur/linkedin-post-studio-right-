-- Add missing company_profile_id column to brand_voice_sessions table
ALTER TABLE public.brand_voice_sessions 
ADD COLUMN company_profile_id uuid REFERENCES public.company_profiles(id);

-- Create index for better performance
CREATE INDEX idx_brand_voice_sessions_company_profile_id 
ON public.brand_voice_sessions(company_profile_id);

-- Add brand_voice_analysis column to company_profiles if not exists
ALTER TABLE public.company_profiles 
ADD COLUMN IF NOT EXISTS brand_voice_analysis jsonb DEFAULT '{}'::jsonb;

-- Add mascot_data column to company_profiles if not exists  
ALTER TABLE public.company_profiles 
ADD COLUMN IF NOT EXISTS mascot_data jsonb DEFAULT '{}'::jsonb;