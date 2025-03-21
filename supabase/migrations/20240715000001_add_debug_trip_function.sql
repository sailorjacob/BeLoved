-- Create a function to get details about a specific trip ID
CREATE OR REPLACE FUNCTION public.get_trip_details(trip_id_param TEXT)
RETURNS TABLE (
    id UUID,
    trip_id TEXT,
    member_id UUID,
    driver_id UUID,
    status TEXT,
    scheduled_pickup_time TIMESTAMPTZ,
    member_name TEXT,
    driver_name TEXT
)
SECURITY DEFINER
AS $$
BEGIN
    -- Log the function call for auditing
    INSERT INTO audit_logs (actor_id, action, table_name, record_id, details)
    VALUES (
        auth.uid(),
        'get_trip_details_function_called',
        'rides',
        NULL,
        jsonb_build_object('trip_id', trip_id_param)
    );

    -- Return all rides with this trip ID along with member and driver info
    RETURN QUERY 
    SELECT 
        r.id,
        r.trip_id,
        r.member_id,
        r.driver_id,
        r.status,
        r.scheduled_pickup_time,
        m.full_name as member_name,
        d.full_name as driver_name
    FROM 
        rides r
    LEFT JOIN 
        profiles m ON r.member_id = m.id
    LEFT JOIN 
        profiles d ON r.driver_id = d.id
    WHERE 
        r.trip_id = trip_id_param
    ORDER BY 
        r.scheduled_pickup_time ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_trip_details(TEXT) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.get_trip_details IS 'Gets details about rides with a specific trip ID for debugging purposes';

-- Create a function to get all trips assigned to a driver and their statuses
CREATE OR REPLACE FUNCTION public.get_all_driver_trips(driver_id_param UUID)
RETURNS TABLE (
    trip_id TEXT,
    ride_count INTEGER,
    statuses TEXT[]
)
SECURITY DEFINER
AS $$
BEGIN
    -- Log the function call for auditing
    INSERT INTO audit_logs (actor_id, action, table_name, record_id, details)
    VALUES (
        auth.uid(),
        'get_all_driver_trips_function_called',
        'rides',
        NULL,
        jsonb_build_object('driver_id', driver_id_param)
    );

    -- Return summary of all trips assigned to this driver
    RETURN QUERY 
    SELECT 
        r.trip_id,
        COUNT(*) AS ride_count,
        ARRAY_AGG(DISTINCT r.status) AS statuses
    FROM 
        rides r
    WHERE 
        r.driver_id = driver_id_param
        AND r.trip_id IS NOT NULL
    GROUP BY 
        r.trip_id
    ORDER BY 
        COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_driver_trips(UUID) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.get_all_driver_trips IS 'Gets a summary of all trips assigned to a driver with their statuses'; 