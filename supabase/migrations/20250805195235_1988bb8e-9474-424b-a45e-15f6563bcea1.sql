-- Create brand_voice_sessions table for tracking analysis status
CREATE TABLE public.brand_voice_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  session_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Enable Row Level Security
ALTER TABLE public.brand_voice_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own brand voice sessions" 
ON public.brand_voice_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own brand voice sessions" 
ON public.brand_voice_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brand voice sessions" 
ON public.brand_voice_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_brand_voice_sessions_updated_at
BEFORE UPDATE ON public.brand_voice_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();