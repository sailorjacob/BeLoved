-- Version 1: Without audit logging (recommended if you're having issues with audit logs)
-- Add phone column to transportation_providers table
ALTER TABLE transportation_providers 
  ADD COLUMN IF NOT EXISTS phone text;

-- Update any existing rows to have a default phone value if needed
UPDATE transportation_providers 
  SET phone = 'Not provided' 
  WHERE phone IS NULL;


-- Version 2: With audit logging (use this if your audit logs table accepts NULL for entity_id)
/*
-- Add phone column to transportation_providers table
ALTER TABLE transportation_providers 
  ADD COLUMN IF NOT EXISTS phone text;

-- Update any existing rows to have a default phone value if needed
UPDATE transportation_providers 
  SET phone = 'Not provided' 
  WHERE phone IS NULL;

-- Log the change for audit purposes with NULL entity_id
INSERT INTO audit_logs (
  action, 
  entity_type, 
  entity_id, 
  changes, 
  changed_by
) 
SELECT 
  'alter', 
  'table', 
  NULL, 
  json_build_object('added_column', 'phone'), 
  auth.uid()
FROM auth.users
WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
LIMIT 1;
*/ 