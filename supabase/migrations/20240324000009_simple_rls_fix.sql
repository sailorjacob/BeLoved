-- Simple fix for RLS issues - minimalistic approach

-- First disable RLS on profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop specific policies that might be causing problems
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
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;

-- Ensure super admin exists with correct role
INSERT INTO profiles (
    id, email, full_name, user_role, phone, status, created_at, updated_at
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
    user_role = 'super_admin',
    status = 'active',
    updated_at = NOW();

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO service_role; 