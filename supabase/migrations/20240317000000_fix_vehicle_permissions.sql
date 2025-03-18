-- Fix for vehicle permissions
-- This script fixes the Row Level Security (RLS) policies for the vehicles table
-- to ensure that admins and super_admins can properly interact with the table

-- First, let's see if RLS is enabled on the vehicles table
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'vehicles' 
        AND rowsecurity = true
    ) THEN
        -- RLS is enabled, so let's modify the policies
        
        -- Drop existing policies to start fresh
        DROP POLICY IF EXISTS "Super admins can manage all vehicles" ON vehicles;
        DROP POLICY IF EXISTS "Admins can manage vehicles in their provider" ON vehicles;
        DROP POLICY IF EXISTS "Drivers can view vehicles" ON vehicles;
        
        -- Create a policy for super_admins (they can do everything)
        CREATE POLICY "Super admins can manage all vehicles"
            ON vehicles
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.user_role = 'super_admin'
                )
            );
        
        -- Create a policy for admins (they can manage vehicles in their provider)
        CREATE POLICY "Admins can manage vehicles in their provider"
            ON vehicles
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.user_role = 'admin'
                    AND (
                        -- Either the admin's provider_id matches the vehicle's provider_id
                        (
                            provider_id = profiles.provider_id
                            AND profiles.provider_id IS NOT NULL
                        )
                        -- Or the vehicle has no provider_id (provider-agnostic vehicle)
                        OR provider_id IS NULL
                    )
                )
            );
        
        -- Add a policy for drivers to view vehicles
        CREATE POLICY "Drivers can view vehicles"
            ON vehicles
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.user_role = 'driver'
                )
            );
        
        RAISE NOTICE 'Successfully updated RLS policies for vehicles table';
    ELSE
        -- RLS is not enabled, so let's enable it and create policies
        ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
        
        -- Create a policy for super_admins (they can do everything)
        CREATE POLICY "Super admins can manage all vehicles"
            ON vehicles
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.user_role = 'super_admin'
                )
            );
        
        -- Create a policy for admins (they can manage vehicles in their provider)
        CREATE POLICY "Admins can manage vehicles in their provider"
            ON vehicles
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.user_role = 'admin'
                    AND (
                        -- Either the admin's provider_id matches the vehicle's provider_id
                        (
                            provider_id = profiles.provider_id
                            AND profiles.provider_id IS NOT NULL
                        )
                        -- Or the vehicle has no provider_id (provider-agnostic vehicle)
                        OR provider_id IS NULL
                    )
                )
            );
        
        -- Add a policy for drivers to view vehicles
        CREATE POLICY "Drivers can view vehicles"
            ON vehicles
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.user_role = 'driver'
                )
            );
        
        RAISE NOTICE 'Successfully enabled RLS and created policies for vehicles table';
    END IF;
END $$; 