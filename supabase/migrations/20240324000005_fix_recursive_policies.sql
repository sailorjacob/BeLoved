-- First, disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can do everything" ON profiles;
DROP POLICY IF EXISTS "Admins can manage provider profiles" ON profiles;

-- Ensure the super admin profile exists with the correct role
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

-- Create a basic policy that allows users to read their own profile
CREATE POLICY "Allow users to read own profile"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Create a basic policy that allows users to update their own profile
CREATE POLICY "Allow users to update own profile"
    ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Create a basic policy that allows users to insert their own profile
CREATE POLICY "Allow users to insert own profile"
    ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Create a policy for super admins using a direct check
CREATE POLICY "Super admin access"
    ON profiles
    FOR ALL
    TO authenticated
    USING (
        -- Check if the user's ID matches our known super admin ID
        auth.uid() = 'c8ef80bc-c7de-4ba8-a473-bb859b2efd9b'::uuid
    );

-- Create a policy for admins that avoids recursion
CREATE POLICY "Admin access"
    ON profiles
    FOR ALL
    TO authenticated
    USING (
        -- First, check if the requesting user is an admin
        EXISTS (
            SELECT 1
            FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.id IN (
                SELECT id FROM profiles WHERE user_role = 'admin'
            )
        )
        -- Then, ensure they're only accessing profiles within their provider
        AND provider_id = (
            SELECT provider_id
            FROM profiles
            WHERE id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- Verify the policies
SELECT * FROM pg_policies WHERE tablename = 'profiles'; 