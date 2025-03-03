-- Check if ride_status enum type exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ride_status') THEN
        CREATE TYPE ride_status AS ENUM ('pending', 'assigned', 'completed', 'cancelled');
    END IF;
END$$;

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
END $$;

-- Add driver_earnings column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rides' AND column_name = 'driver_earnings'
    ) THEN
        ALTER TABLE rides ADD COLUMN driver_earnings numeric default 0;
    END IF;
END $$;

-- Add insurance_claim_amount column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rides' AND column_name = 'insurance_claim_amount'
    ) THEN
        ALTER TABLE rides ADD COLUMN insurance_claim_amount numeric default 0;
    END IF;
END $$;

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
END $$;

-- Create driver_earnings index only if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rides' AND column_name = 'driver_earnings'
    ) THEN
        EXECUTE 'create index if not exists rides_driver_earnings_idx on rides(driver_earnings)';
    END IF;
END $$;

-- Create insurance_claim_amount index only if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rides' AND column_name = 'insurance_claim_amount'
    ) THEN
        EXECUTE 'create index if not exists rides_insurance_claim_amount_idx on rides(insurance_claim_amount)';
    END IF;
END $$;

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
        WHEN i % 4 = 0 THEN 'pending'::ride_status
        WHEN i % 4 = 1 THEN 'assigned'::ride_status
        WHEN i % 4 = 2 THEN 'completed'::ride_status
        ELSE 'cancelled'::ride_status
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