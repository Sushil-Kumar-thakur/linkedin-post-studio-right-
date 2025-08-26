-- Update webhook_configurations table to add new fields for enhanced documentation
ALTER TABLE webhook_configurations ADD COLUMN IF NOT EXISTS webhook_description TEXT;
ALTER TABLE webhook_configurations ADD COLUMN IF NOT EXISTS required_headers JSONB DEFAULT '{}';
ALTER TABLE webhook_configurations ADD COLUMN IF NOT EXISTS expected_payload JSONB DEFAULT '{}';
ALTER TABLE webhook_configurations ADD COLUMN IF NOT EXISTS response_format JSONB DEFAULT '{}';
ALTER TABLE webhook_configurations ADD COLUMN IF NOT EXISTS documentation TEXT;

-- Insert missing webhook configurations
INSERT INTO webhook_configurations (workflow_type, inbound_endpoint, outbound_webhook_url, field_mappings, webhook_description, expected_payload, response_format, documentation) VALUES
('company_profile_generation', '/functions/v1/receive-company-profile', NULL, 
 '{"companyProfileId": "company_profile_id", "companyName": "companyName", "companyWebsite": "website_url"}',
 'Generates comprehensive company profile analysis including business overview, value proposition, and ideal customer profile',
 '{"companyProfileId": "string", "companyName": "string", "companyWebsite": "string", "businessOverview": "string", "valueProposition": "string", "idealCustomerProfile": "string"}',
 '{"success": "boolean", "message": "string", "profile": "object"}',
 'This webhook receives AI-analyzed company profile data and updates the company_profiles table. Send the company profile ID, name, and website URL to trigger analysis.'
),
('linkedin_posts_collection', '/functions/v1/receive-posts-collection', NULL,
 '{"companyProfileId": "company_profile_id", "companyName": "company_name", "companyLinkedInUrl": "linkedin_url", "start_date": "start_date", "posts": "posts_data"}',
 'Collects and analyzes LinkedIn company posts for brand voice analysis',
 '{"companyProfileId": "string", "companyName": "string", "companyLinkedInUrl": "string", "start_date": "string", "posts": "array"}',
 '{"success": "boolean", "message": "string", "posts_count": "number"}',
 'This webhook collects LinkedIn posts from a company page within a specified date range. Used for brand voice analysis and content pattern recognition.'
),
('mascot_generation', '/functions/v1/receive-mascot-data', NULL,
 '{"companyProfileId": "company_profile_id", "companyName": "company_name", "companyWebsite": "website_url", "mascotRefImage": "reference_image", "mascotDescription": "description"}',
 'Generates company mascot based on brand guidelines and reference materials',
 '{"companyProfileId": "string", "companyName": "string", "companyWebsite": "string", "mascotRefImage": "string", "mascotDescription": "string", "mascotData": "object"}',
 '{"success": "boolean", "message": "string", "mascot": "object"}',
 'This webhook generates a custom company mascot based on brand analysis and provided reference materials.'
),
('post_content_creation', '/functions/v1/receive-post-content', NULL,
 '{"companyProfileId": "company_profile_id", "companyName": "company_name", "companyBusinessOverview": "business_overview", "companyICP": "ideal_customer_profile", "companyValueProposition": "value_proposition", "selectedPost": "selected_post"}',
 'Creates LinkedIn post content based on company profile and strategic inputs',
 '{"companyProfileId": "string", "companyName": "string", "companyBusinessOverview": "string", "companyICP": "string", "companyValueProposition": "string", "selectedPost": "object", "generatedContent": "string"}',
 '{"success": "boolean", "message": "string", "post": "object"}',
 'This webhook creates LinkedIn post content tailored to the company brand voice and target audience.'
),
('post_content_update', '/functions/v1/receive-post-content-update', NULL,
 '{"companyProfileId": "company_profile_id", "companyName": "company_name", "postImage": "image_url", "postContentRevisionComments": "revision_comments"}',
 'Updates LinkedIn post content based on revision feedback',
 '{"companyProfileId": "string", "companyName": "string", "postImage": "string", "postContentRevisionComments": "string", "updatedContent": "string"}',
 '{"success": "boolean", "message": "string", "post": "object"}',
 'This webhook updates existing post content based on feedback and revision comments.'
),
('post_image_update', '/functions/v1/receive-post-image-update', NULL,
 '{"companyProfileId": "company_profile_id", "companyName": "company_name", "postImage": "image_url", "postImageRevisionComments": "revision_comments"}',
 'Updates LinkedIn post images based on revision feedback',
 '{"companyProfileId": "string", "companyName": "string", "postImage": "string", "postImageRevisionComments": "string", "updatedImage": "string"}',
 '{"success": "boolean", "message": "string", "image": "object"}',
 'This webhook updates post images based on feedback and revision requirements.'
)
ON CONFLICT (workflow_type) DO UPDATE SET
  webhook_description = EXCLUDED.webhook_description,
  expected_payload = EXCLUDED.expected_payload,
  response_format = EXCLUDED.response_format,
  documentation = EXCLUDED.documentation,
  field_mappings = EXCLUDED.field_mappings;