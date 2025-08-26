-- First, let's handle the foreign key constraint by updating brand_voice_sessions
-- to reference the most recent company profile for each user
WITH latest_profiles AS (
  SELECT DISTINCT ON (user_id) id as latest_id, user_id 
  FROM company_profiles 
  ORDER BY user_id, updated_at DESC
),
profiles_to_delete AS (
  SELECT cp.id, cp.user_id
  FROM company_profiles cp
  WHERE cp.id NOT IN (SELECT latest_id FROM latest_profiles)
)
UPDATE brand_voice_sessions 
SET company_profile_id = lp.latest_id
FROM profiles_to_delete ptd
JOIN latest_profiles lp ON ptd.user_id = lp.user_id
WHERE brand_voice_sessions.company_profile_id = ptd.id;

-- Now delete the duplicate company profiles
DELETE FROM company_profiles 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM company_profiles 
  ORDER BY user_id, updated_at DESC
);

-- Add a unique constraint to prevent future duplicates
ALTER TABLE company_profiles 
ADD CONSTRAINT company_profiles_user_id_unique UNIQUE (user_id);