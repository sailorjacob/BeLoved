-- EMERGENCY MIGRATION: COMPLETELY DISABLE RLS FOR DEBUGGING

-- First, disable RLS on the profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname, tablename FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 
                      policy_record.policyname, 
                      policy_record.tablename);
    END LOOP;
END
$$;

-- Ensure super admin profile exists
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
    updated_at = NOW();

-- Grant full permissions to all roles
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO service_role;

-- Add a notice about this emergency measure
DO $$
BEGIN
    RAISE NOTICE 'EMERGENCY MIGRATION: ALL RLS POLICIES HAVE BEEN DISABLED FOR DEBUGGING';
    RAISE NOTICE 'Re-enable RLS once authentication issues are resolved';
END
$$; 