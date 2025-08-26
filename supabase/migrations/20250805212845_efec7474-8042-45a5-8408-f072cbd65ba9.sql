-- Create social_posts_collection table for tracking post collection sessions
CREATE TABLE public.social_posts_collection (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  platform TEXT NOT NULL,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  collection_status TEXT NOT NULL DEFAULT 'processing',
  posts_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_posts_collection ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own social posts collections" 
ON public.social_posts_collection 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own social posts collections" 
ON public.social_posts_collection 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social posts collections" 
ON public.social_posts_collection 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_social_posts_collection_updated_at
BEFORE UPDATE ON public.social_posts_collection
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create webhook configuration for posts collection if it doesn't exist
INSERT INTO public.webhook_configurations (workflow_type, inbound_endpoint, field_mappings, is_active)
VALUES (
  'posts_collection',
  '/receive-posts-collection',
  '{
    "input_mapping": {
      "user_id": "user_id",
      "collection_id": "collection_id",
      "posts": "posts_data"
    },
    "output_mapping": {
      "collection_id": "id",
      "posts_data": "posts_data",
      "status": "collection_status"
    }
  }'::jsonb,
  true
)
ON CONFLICT (workflow_type) DO NOTHING;