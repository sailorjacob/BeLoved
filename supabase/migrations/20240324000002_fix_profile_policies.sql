-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles in their provider" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read for users to own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for users on own profile" ON profiles;
DROP POLICY IF EXISTS "Enable all for super admins" ON profiles;
DROP POLICY IF EXISTS "Enable all for admins within provider" ON profiles;
DROP POLICY IF EXISTS "Allow users to read own profile" ON profiles;
DROP POLICY IF EXISTS "Super admin full access" ON profiles;

-- Temporarily disable RLS to fix data
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Ensure the user's profile exists with correct role
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
    updated_at = NOW();

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simplified policies
CREATE POLICY "Enable read access to own profile"
    ON profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Enable update access to own profile"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Super admins can do everything"
    ON profiles
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE user_role = 'super_admin'
        )
    );

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role; 