-- Add super_admin to user_type enum
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'super_admin';

-- Update policies to include super_admin privileges
CREATE OR REPLACE POLICY "Only admins and super admins can create driver profiles"
ON driver_profiles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (user_type = 'admin' OR user_type = 'super_admin')
  )
);

CREATE OR REPLACE POLICY "Members can view their own rides"
ON rides FOR SELECT
USING (
  auth.uid() = member_id OR
  auth.uid() = driver_id OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (user_type = 'admin' OR user_type = 'super_admin')
  )
);

CREATE OR REPLACE POLICY "Members can create their own rides"
ON rides FOR INSERT
WITH CHECK (
  auth.uid() = member_id OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (user_type = 'admin' OR user_type = 'super_admin')
  )
);

CREATE OR REPLACE POLICY "Members and drivers can update their rides"
ON rides FOR UPDATE
USING (
  auth.uid() = member_id OR
  auth.uid() = driver_id OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (user_type = 'admin' OR user_type = 'super_admin')
  )
); 