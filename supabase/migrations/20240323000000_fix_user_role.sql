-- Drop the user_type column if it exists
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_type') THEN
        ALTER TABLE profiles DROP COLUMN user_type;
    END IF;
END $$;

-- Create user_role enum if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'driver');
    END IF;
END $$;

-- Add user_role column if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_role') THEN
        ALTER TABLE profiles ADD COLUMN user_role user_role DEFAULT 'driver';
    END IF;
END $$;

-- Update RLS policies to use user_role
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
CREATE POLICY "Super admins can manage all profiles"
    ON profiles
    FOR ALL
    USING (auth.jwt() ->> 'user_role' = 'super_admin');

DROP POLICY IF EXISTS "Admins can manage profiles in their provider" ON profiles;
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

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
    ON profiles
    FOR SELECT
    USING (auth.uid() = id); 