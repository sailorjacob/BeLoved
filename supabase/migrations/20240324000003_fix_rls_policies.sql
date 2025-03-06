-- First, disable RLS temporarily to ensure we can fix the data
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access to own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update access to own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can do everything" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles in their provider" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Ensure the super admin profile exists and has the correct role
INSERT INTO profiles (
    id,
    email,
    full_name,
    user_role,
    created_at,
    updated_at
)
VALUES (
    'c8ef80bc-c7de-4ba8-a473-bb859b2efd9b',
    'x2sides@gmail.com',
    'Super Admin',
    'super_admin',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
    user_role = 'super_admin',
    email = 'x2sides@gmail.com',
    full_name = 'Super Admin',
    updated_at = NOW();

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to read their own profile
CREATE POLICY "Users can read own profile"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id
    );

-- Create a policy that allows users to update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id
    );

-- Create a policy that allows super admins to do everything
CREATE POLICY "Super admins can do everything"
    ON profiles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'super_admin'
        )
    );

-- Create a policy that allows admins to manage profiles in their provider
CREATE POLICY "Admins can manage provider profiles"
    ON profiles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'admin'
            AND profiles.provider_id = profiles.provider_id
        )
    );

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- Verify the policies
SELECT * FROM pg_policies WHERE tablename = 'profiles'; 