-- Drop existing user_role type and recreate with all roles
DO $$ BEGIN
    -- Drop existing policies that reference user_role
    DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
    DROP POLICY IF EXISTS "Admins can manage profiles in their provider" ON profiles;
    DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
    
    -- Drop the type
    DROP TYPE IF EXISTS user_role;
    
    -- Recreate the type with all roles
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'driver', 'member');
END $$;

-- Update profiles table
ALTER TABLE profiles 
    ALTER COLUMN user_role SET DEFAULT 'member',
    ALTER COLUMN user_role TYPE user_role USING 
        CASE 
            WHEN user_role::text = 'driver' THEN 'driver'::user_role
            WHEN user_role::text = 'admin' THEN 'admin'::user_role
            WHEN user_role::text = 'super_admin' THEN 'super_admin'::user_role
            ELSE 'member'::user_role
        END;

-- Recreate RLS policies
CREATE POLICY "Super admins can manage all profiles"
    ON profiles
    FOR ALL
    USING (auth.jwt() ->> 'user_role' = 'super_admin');

CREATE POLICY "Admins can manage profiles in their provider"
    ON profiles
    FOR ALL
    USING (
        (auth.jwt() ->> 'user_role' = 'admin' AND 
        provider_id = (
            SELECT provider_id FROM profiles
            WHERE profiles.id = auth.uid()
        ))
    );

CREATE POLICY "Users can view their own profile"
    ON profiles
    FOR SELECT
    USING (auth.uid() = id); 