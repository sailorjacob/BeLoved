-- Create a helper function to create return trips correctly
-- This function takes an original ride ID and creates a corresponding return trip
-- while properly handling the trip_id and ensuring the is_return_trip flag is set

CREATE OR REPLACE FUNCTION public.create_return_trip(
    original_ride_id UUID
) RETURNS UUID
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    original_ride rides;
    new_ride_id UUID;
    current_user_id UUID;
BEGIN
    -- Get current user ID for logging
    current_user_id := auth.uid();
    
    -- Get the original ride details
    SELECT * INTO original_ride FROM rides WHERE id = original_ride_id;
    
    -- Verify original ride exists
    IF original_ride IS NULL THEN
        RAISE EXCEPTION 'Original ride with ID % not found', original_ride_id;
    END IF;
    
    -- Verify this is not already a return trip
    IF original_ride.is_return_trip = true THEN
        RAISE EXCEPTION 'Cannot create return trip from an existing return trip';
    END IF;
    
    -- Check if a return trip already exists for this trip_id
    PERFORM 1 FROM rides 
    WHERE trip_id = original_ride.trip_id 
      AND is_return_trip = true;
      
    IF FOUND THEN
        RAISE EXCEPTION 'A return trip already exists for trip_id %', original_ride.trip_id;
    END IF;
    
    -- Generate new UUID for the return ride
    new_ride_id := gen_random_uuid();
    
    -- Insert the return trip
    INSERT INTO rides (
        id,
        member_id,
        provider_id,
        trip_id,
        pickup_address,
        dropoff_address,
        scheduled_pickup_time,
        driver_id,
        status,
        is_return_trip,
        notes,
        created_at,
        updated_at
    ) VALUES (
        new_ride_id,
        original_ride.member_id,
        original_ride.provider_id,
        original_ride.trip_id,
        original_ride.dropoff_address,  -- Swap pickup and dropoff for return
        original_ride.pickup_address,   -- Swap pickup and dropoff for return
        -- Default to 2 hours after original pickup time if null, otherwise use the original time
        CASE 
            WHEN original_ride.scheduled_pickup_time IS NULL THEN CURRENT_TIMESTAMP + INTERVAL '2 hours'
            ELSE original_ride.scheduled_pickup_time + INTERVAL '2 hours'
        END,
        original_ride.driver_id,        -- Keep the same driver if assigned
        'pending',                      -- Start as pending even if original has driver
        true,                           -- Mark as return trip
        COALESCE(original_ride.notes, '') || ' (Return trip)',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    
    -- Add a log entry
    INSERT INTO audit_logs (
        actor_id,
        action,
        table_name,
        record_id,
        details
    ) VALUES (
        COALESCE(current_user_id, '00000000-0000-0000-0000-000000000000'),
        'create_return_trip',
        'rides',
        new_ride_id,
        jsonb_build_object(
            'original_ride_id', original_ride_id,
            'trip_id', original_ride.trip_id,
            'member_id', original_ride.member_id
        )
    );
    
    RETURN new_ride_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_return_trip(UUID) TO authenticated;

-- Add comment to function
COMMENT ON FUNCTION public.create_return_trip IS 
'Creates a return trip for an existing ride, using the same trip_id but setting is_return_trip to true';

-- Output message
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Added create_return_trip function to handle return trips properly';
END $$; 