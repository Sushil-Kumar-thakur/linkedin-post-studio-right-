-- Update your profile to be an admin
UPDATE profiles 
SET subscription_tier = 'admin' 
WHERE email ILIKE '%admin%' OR user_id = auth.uid();