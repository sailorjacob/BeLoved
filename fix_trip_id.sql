-- Fix the trip_id issue

-- Drop and recreate the trip_id trigger
DROP TRIGGER IF EXISTS before_insert_rides ON rides;

-- Check and update the generate_trip_id function
CREATE OR REPLACE FUNCTION generate_trip_id() 
RETURNS VARCHAR AS $$
DECLARE
    new_id VARCHAR;
    id_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a new 7-digit ID with 'T' prefix
        new_id := 'T' || LPAD(
            (SELECT COALESCE(
                MAX(NULLIF(regexp_replace(SUBSTRING(trip_id FROM 2), '[^0-9]', '', 'g'), '')::INTEGER), 
                0
            ) + 1
            FROM rides
            WHERE trip_id IS NOT NULL AND trip_id LIKE 'T%'),
            6, '0'
        );
        
        -- Check if this ID already exists
        SELECT EXISTS(SELECT 1 FROM rides WHERE trip_id = new_id) INTO id_exists;
        
        -- If the ID doesn't exist, return it
        IF NOT id_exists THEN
            RETURN new_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger function for trip_id with conflict prevention
CREATE OR REPLACE FUNCTION set_trip_id() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.trip_id IS NULL THEN
        NEW.trip_id := generate_trip_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER before_insert_rides
BEFORE INSERT ON rides
FOR EACH ROW
EXECUTE FUNCTION set_trip_id();

-- Check for duplicate trip_ids and fix them
WITH dupe_trips AS (
    SELECT trip_id
    FROM rides
    GROUP BY trip_id
    HAVING COUNT(*) > 1
)
UPDATE rides
SET trip_id = generate_trip_id()
WHERE trip_id IN (SELECT trip_id FROM dupe_trips);

-- Notify on completion
DO $$ 
BEGIN
    RAISE NOTICE 'Trip ID fixing script completed successfully';
END $$; 