-- Clear the bad webhook URL data and reset it properly
DELETE FROM admin_settings WHERE setting_key = 'n8n_webhook_url';

-- Create admin user if doesn't exist
INSERT INTO admin_users (user_id, role, permissions)
VALUES ('fae9a25d-8e29-4186-8a4d-520434de47b5', 'admin', '{}')
ON CONFLICT (user_id) DO NOTHING;