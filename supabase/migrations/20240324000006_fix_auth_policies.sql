-- First, temporarily disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;

-- Ensure super admin exists
INSERT INTO profiles (id, email, full_name, user_role, created_at, updated_at)
VALUES (
  'c8ef80bc-c7de-4ba8-a473-bb859b2efd9b',
  'x2sides@gmail.com',
  'Super Admin',
  'super_admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET user_role = 'super_admin',
    updated_at = NOW()
WHERE profiles.id = 'c8ef80bc-c7de-4ba8-a473-bb859b2efd9b';

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create new policies that avoid recursion
CREATE POLICY "Enable read access for users to their own profile"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Enable update access for users to their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);

CREATE POLICY "Enable insert access for users to create their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
);

CREATE POLICY "Super admins can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.user_role = 'super_admin'
  )
);

CREATE POLICY "Super admins can update all profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.user_role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.user_role = 'super_admin'
  )
);

CREATE POLICY "Admins can read all member and driver profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.user_role = 'admin'
  )
  AND user_role IN ('member', 'driver')
);

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- Verify the policies
SELECT * FROM pg_policies WHERE tablename = 'profiles'; 