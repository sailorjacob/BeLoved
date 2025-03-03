-- Create rides table
create table if not exists rides (
    id uuid primary key default uuid_generate_v4(),
    member_id uuid references profiles(id),
    driver_id uuid references profiles(id),
    pickup_address jsonb not null,
    dropoff_address jsonb not null,
    scheduled_pickup_time timestamp with time zone not null,
    status text default 'pending',
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

-- Add indexes for better query performance
create index if not exists rides_member_id_idx on rides(member_id);
create index if not exists rides_driver_id_idx on rides(driver_id);
create index if not exists rides_status_idx on rides(status);
create index if not exists rides_scheduled_pickup_time_idx on rides(scheduled_pickup_time);
create index if not exists rides_provider_fee_idx on rides(provider_fee);
create index if not exists rides_driver_earnings_idx on rides(driver_earnings);
create index if not exists rides_insurance_claim_amount_idx on rides(insurance_claim_amount);

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
        WHEN i % 4 = 0 THEN 'pending'
        WHEN i % 4 = 1 THEN 'assigned'
        WHEN i % 4 = 2 THEN 'completed'
        ELSE 'cancelled'
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