-- First transaction: Check and create/modify the enum type
BEGIN;

DO $$
DECLARE
    enum_exists boolean;
    enum_values text[];
    missing_values text[];
    v text;
BEGIN
    -- Check if the enum type exists
    SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ride_status') INTO enum_exists;
    
    IF NOT enum_exists THEN
        -- Create the enum type if it doesn't exist
        CREATE TYPE ride_status AS ENUM ('pending', 'assigned', 'completed', 'in_progress');
    ELSE
        -- Get existing enum values
        SELECT array_agg(enumlabel::text) INTO enum_values
        FROM pg_enum
        WHERE enumtypid = 'ride_status'::regtype;
        
        -- Check for missing values and add them
        missing_values := ARRAY[]::text[];
        
        IF NOT ('pending' = ANY(enum_values)) THEN
            missing_values := array_append(missing_values, 'pending');
        END IF;
        
        IF NOT ('assigned' = ANY(enum_values)) THEN
            missing_values := array_append(missing_values, 'assigned');
        END IF;
        
        IF NOT ('completed' = ANY(enum_values)) THEN
            missing_values := array_append(missing_values, 'completed');
        END IF;
        
        IF NOT ('in_progress' = ANY(enum_values)) THEN
            missing_values := array_append(missing_values, 'in_progress');
        END IF;
        
        -- Add missing values if any
        IF array_length(missing_values, 1) > 0 THEN
            FOREACH v IN ARRAY missing_values LOOP
                EXECUTE format('ALTER TYPE ride_status ADD VALUE IF NOT EXISTS %L', v);
            END LOOP;
        END IF;
    END IF;
END;
$$;

COMMIT;

-- Second transaction: Create the rides table
BEGIN;

-- Create rides table
create table if not exists rides (
    id uuid primary key default uuid_generate_v4(),
    member_id uuid references profiles(id),
    driver_id uuid references profiles(id),
    pickup_address jsonb not null,
    dropoff_address jsonb not null,
    scheduled_pickup_time timestamp with time zone not null,
    status ride_status default 'pending',
    start_miles numeric,
    end_miles numeric,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    notes text,
    payment_method text not null,
    payment_status text default 'pending',
    recurring text default 'none',
    provider_fee numeric default 0,
    driver_earnings numeric default 0,
    insurance_claim_amount numeric default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Add provider_fee column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rides' AND column_name = 'provider_fee'
    ) THEN
        ALTER TABLE rides ADD COLUMN provider_fee numeric default 0;
    END IF;
END;
$$;

-- Add driver_earnings column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rides' AND column_name = 'driver_earnings'
    ) THEN
        ALTER TABLE rides ADD COLUMN driver_earnings numeric default 0;
    END IF;
END;
$$;

-- Add insurance_claim_amount column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rides' AND column_name = 'insurance_claim_amount'
    ) THEN
        ALTER TABLE rides ADD COLUMN insurance_claim_amount numeric default 0;
    END IF;
END;
$$;

-- Add indexes for better query performance
create index if not exists rides_member_id_idx on rides(member_id);
create index if not exists rides_driver_id_idx on rides(driver_id);
create index if not exists rides_status_idx on rides(status);
create index if not exists rides_scheduled_pickup_time_idx on rides(scheduled_pickup_time);

-- Create provider_fee index only if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rides' AND column_name = 'provider_fee'
    ) THEN
        EXECUTE 'create index if not exists rides_provider_fee_idx on rides(provider_fee)';
    END IF;
END;
$$;

-- Create driver_earnings index only if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rides' AND column_name = 'driver_earnings'
    ) THEN
        EXECUTE 'create index if not exists rides_driver_earnings_idx on rides(driver_earnings)';
    END IF;
END;
$$;

-- Create insurance_claim_amount index only if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rides' AND column_name = 'insurance_claim_amount'
    ) THEN
        EXECUTE 'create index if not exists rides_insurance_claim_amount_idx on rides(insurance_claim_amount)';
    END IF;
END;
$$;

-- Enable Row Level Security
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- Create policies for different user roles
-- Super Admin can see and manage all rides
CREATE POLICY super_admin_all_access ON rides
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'super_admin'
        )
    );

-- Admin can see and manage all rides
CREATE POLICY admin_all_access ON rides
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

-- Drivers can see and update their own rides
CREATE POLICY driver_access ON rides
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'driver'
            AND rides.driver_id = profiles.id
        )
    );

-- Members can see and manage their own rides
CREATE POLICY member_access ON rides
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'member'
            AND rides.member_id = profiles.id
        )
    );

COMMIT;

-- Third transaction: Insert sample data
BEGIN;

-- Get valid enum values for ride_status
DO $$
DECLARE
    enum_values text[];
BEGIN
    -- Get existing enum values
    SELECT array_agg(enumlabel::text) INTO enum_values
    FROM pg_enum
    WHERE enumtypid = 'ride_status'::regtype;
    
    -- Store enum values in a temporary table for use in the INSERT statement
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_ride_status_values (
        value text
    );
    
    -- Clear the table in case it already exists
    TRUNCATE temp_ride_status_values;
    
    -- Insert the enum values
    INSERT INTO temp_ride_status_values
    SELECT unnest(enum_values);
END;
$$;

-- Insert some sample data for testing
INSERT INTO rides (
    member_id,
    driver_id,
    pickup_address,
    dropoff_address,
    scheduled_pickup_time,
    status,
    payment_method,
    provider_fee,
    driver_earnings,
    insurance_claim_amount
)
SELECT
    (SELECT id FROM profiles WHERE user_type = 'member' LIMIT 1),
    (SELECT id FROM profiles WHERE user_type = 'driver' LIMIT 1),
    '{"address": "123 Main St", "city": "Indianapolis", "state": "IN", "zip": "46204"}'::jsonb,
    '{"address": "456 Elm St", "city": "Indianapolis", "state": "IN", "zip": "46205"}'::jsonb,
    timezone('utc'::text, now() + (i || ' days')::interval),
    CASE 
        WHEN i % 3 = 0 THEN 
            (SELECT value FROM temp_ride_status_values ORDER BY value LIMIT 1 OFFSET 0)::ride_status
        WHEN i % 3 = 1 THEN 
            (SELECT value FROM temp_ride_status_values ORDER BY value LIMIT 1 OFFSET 1)::ride_status
        ELSE 
            (SELECT value FROM temp_ride_status_values ORDER BY value LIMIT 1 OFFSET 2)::ride_status
    END,
    CASE 
        WHEN i % 3 = 0 THEN 'cash'
        WHEN i % 3 = 1 THEN 'credit'
        ELSE 'insurance'
    END,
    (50 + i * 2)::numeric,
    (30 + i)::numeric,
    (i)::numeric
FROM generate_series(0, 9) i
ON CONFLICT DO NOTHING;

-- Clean up temporary table
DROP TABLE IF EXISTS temp_ride_status_values;

COMMIT;