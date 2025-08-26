-- First, let's see what duplicates exist
-- This query will help us understand the current state
SELECT user_id, COUNT(*) as profile_count 
FROM company_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Clean up duplicates by keeping only the most recent profile for each user
-- We'll delete all but the most recent record for each user_id
DELETE FROM company_profiles 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM company_profiles 
  ORDER BY user_id, updated_at DESC
);

-- Add a unique constraint to prevent future duplicates
ALTER TABLE company_profiles 
ADD CONSTRAINT company_profiles_user_id_unique UNIQUE (user_id);

-- Update the RLS policy to be more specific about single records
DROP POLICY IF EXISTS "Users can view own company profile" ON company_profiles;
CREATE POLICY "Users can view own company profile" 
ON company_profiles 
FOR SELECT 
USING (auth.uid() = user_id);