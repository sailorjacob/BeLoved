-- First, disable RLS to make sure we can modify everything
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Enable read access for users to their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update access for users to their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert access for users to create their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can read all member and driver profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can do everything" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles in their provider" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;

-- Ensure the super admin profile exists and has the correct role
-- Use upsert approach
INSERT INTO profiles (
    id,
    email,
    full_name,
    user_role,
    phone,
    status,
    created_at,
    updated_at
)
VALUES (
    'c8ef80bc-c7de-4ba8-a473-bb859b2efd9b',
    'x2sides@gmail.com',
    'Super Admin',
    'super_admin',
    '555-123-4567',
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    user_role = 'super_admin',
    status = 'active',
    updated_at = NOW();

-- Verify super admin exists
DO $$
BEGIN
    RAISE NOTICE 'Super admin profile check: %', (
        SELECT COUNT(*) FROM profiles 
        WHERE id = 'c8ef80bc-c7de-4ba8-a473-bb859b2efd9b'
    );
END $$;

-- Create extremely simple RLS policies
-- 1. Create a very permissive policy for testing
CREATE POLICY "Authenticated users can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- 2. Allow users to update their own profiles
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 3. Allow profile creation
CREATE POLICY "Allow profile creation"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Grant permissions explicitly to be safe
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO anon;

-- For testing, allow anyone to see all profiles
ALTER TABLE profiles REPLICA IDENTITY FULL;

-- Log that this migration ran successfully
DO $$
BEGIN
    RAISE NOTICE 'Migration 20240324000007_simplify_policies_fix_profile.sql completed successfully';
END $$; 