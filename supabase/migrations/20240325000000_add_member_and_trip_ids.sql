-- Migration: Add member_id and trip_id fields
-- Creates 7-digit numeric identifiers for both members (profiles) and trips (rides)

-- IMPORTANT SAFETY CHECKS:
-- 1. First check if the columns already exist before attempting to add them
-- 2. Use IF NOT EXISTS for all functions and triggers

-- =============================================
-- MEMBER ID IMPLEMENTATION
-- =============================================

-- Add member_id column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'member_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN member_id VARCHAR(7) UNIQUE;
        
        -- Add an index on member_id for faster lookups
        CREATE INDEX IF NOT EXISTS idx_profiles_member_id ON profiles(member_id);
    END IF;
END $$;

-- Create function to generate the next member ID if it doesn't exist
CREATE OR REPLACE FUNCTION generate_member_id() 
RETURNS VARCHAR AS $$
DECLARE
    next_id INTEGER;
    formatted_id VARCHAR;
BEGIN
    -- Get the current max numeric part, safely handling NULL or invalid values
    SELECT COALESCE(MAX(NULLIF(regexp_replace(member_id, '[^0-9]', '', 'g'), '')::INTEGER), 0) + 1 
    INTO next_id 
    FROM profiles 
    WHERE member_id IS NOT NULL;
    
    -- If somehow we got a NULL or zero, start with 1
    IF next_id IS NULL OR next_id < 1 THEN
        next_id := 1;
    END IF;
    
    -- Format with leading zeros to ensure 7 digits
    formatted_id := LPAD(next_id::TEXT, 7, '0');
    
    RETURN formatted_id;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger function for member_id
CREATE OR REPLACE FUNCTION set_member_id() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.member_id IS NULL THEN
        NEW.member_id := generate_member_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-assign member_id on insert if not provided
DO $$ 
BEGIN
    -- Drop the trigger if it exists
    DROP TRIGGER IF EXISTS before_insert_profiles ON profiles;
    
    -- Create the trigger
    CREATE TRIGGER before_insert_profiles
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_member_id();
END $$;

-- Update existing profiles with a member_id
UPDATE profiles 
SET member_id = generate_member_id() 
WHERE member_id IS NULL OR member_id = '';

-- =============================================
-- TRIP ID IMPLEMENTATION
-- =============================================

-- Add trip_id column to rides table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'rides' AND column_name = 'trip_id'
    ) THEN
        ALTER TABLE rides ADD COLUMN trip_id VARCHAR(7) UNIQUE;
        
        -- Add an index on trip_id for faster lookups
        CREATE INDEX IF NOT EXISTS idx_rides_trip_id ON rides(trip_id);
    END IF;
END $$;

-- Create function to generate the next trip ID
CREATE OR REPLACE FUNCTION generate_trip_id() 
RETURNS VARCHAR AS $$
DECLARE
    next_id INTEGER;
    formatted_id VARCHAR;
BEGIN
    -- Get the current max numeric part, safely handling NULL or invalid values
    SELECT COALESCE(MAX(NULLIF(regexp_replace(trip_id, '[^0-9]', '', 'g'), '')::INTEGER), 0) + 1 
    INTO next_id 
    FROM rides 
    WHERE trip_id IS NOT NULL;
    
    -- If somehow we got a NULL or zero, start with 1
    IF next_id IS NULL OR next_id < 1 THEN
        next_id := 1;
    END IF;
    
    -- Format with leading zeros to ensure 7 digits
    formatted_id := LPAD(next_id::TEXT, 7, '0');
    
    RETURN formatted_id;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger function for trip_id
CREATE OR REPLACE FUNCTION set_trip_id() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.trip_id IS NULL THEN
        NEW.trip_id := generate_trip_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-assign trip_id on insert if not provided
DO $$ 
BEGIN
    -- Drop the trigger if it exists
    DROP TRIGGER IF EXISTS before_insert_rides ON rides;
    
    -- Create the trigger
    CREATE TRIGGER before_insert_rides
    BEFORE INSERT ON rides
    FOR EACH ROW
    EXECUTE FUNCTION set_trip_id();
END $$;

-- Update existing rides with a trip_id
UPDATE rides 
SET trip_id = generate_trip_id() 
WHERE trip_id IS NULL OR trip_id = '';

-- =============================================
-- VERIFICATION
-- =============================================

-- Output counts of updated records
DO $$
DECLARE
    profile_count INTEGER;
    ride_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles WHERE member_id IS NOT NULL;
    SELECT COUNT(*) INTO ride_count FROM rides WHERE trip_id IS NOT NULL;
    
    RAISE NOTICE 'Migration complete. % profiles have member_id and % rides have trip_id.', 
        profile_count, ride_count;
END $$; 