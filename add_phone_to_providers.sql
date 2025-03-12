-- Add phone column to transportation_providers table
ALTER TABLE transportation_providers 
  ADD COLUMN IF NOT EXISTS phone text;

-- Update any existing rows to have a default phone value if needed
UPDATE transportation_providers 
  SET phone = 'Not provided' 
  WHERE phone IS NULL;

-- Log the change for audit purposes
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
  'transportation_providers', 
  json_build_object('added_column', 'phone'), 
  auth.uid()
FROM auth.users
WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
LIMIT 1; 