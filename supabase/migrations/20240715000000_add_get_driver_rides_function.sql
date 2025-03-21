-- Create a function to get a driver's rides that can bypass RLS
CREATE OR REPLACE FUNCTION public.get_driver_rides(driver_id_param UUID)
RETURNS SETOF rides
SECURITY DEFINER -- This means the function runs with the privileges of the creator
AS $$
BEGIN
    -- Log the function call
    INSERT INTO audit_logs (actor_id, action, table_name, record_id, details)
    VALUES (
        driver_id_param,
        'get_driver_rides_function_called',
        'rides',
        NULL,
        jsonb_build_object('driver_id', driver_id_param)
    );

    -- Return all rides where driver_id matches the parameter
    RETURN QUERY 
    SELECT r.*
    FROM rides r
    WHERE r.driver_id = driver_id_param
    ORDER BY r.scheduled_pickup_time ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_driver_rides(UUID) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.get_driver_rides IS 'Gets all rides assigned to a specific driver, bypassing RLS policies. Used by driver dashboard.'; 