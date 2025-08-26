-- Add you as admin
INSERT INTO public.admin_users (user_id, role, permissions) 
VALUES (
  'fae9a25d-8e29-4186-8a4d-520434de47b5',
  'admin',
  '{"full_access": true, "manage_settings": true, "manage_users": true}'::jsonb
);