-- Add appointment_time column to rides table
ALTER TABLE rides
ADD COLUMN IF NOT EXISTS appointment_time TIMESTAMPTZ;

-- Backfill appointment_time from scheduled_pickup_time for existing data
UPDATE rides 
SET appointment_time = scheduled_pickup_time + INTERVAL '1 hour'
WHERE appointment_time IS NULL;

-- Add is_return_trip and return_pickup_tba columns if they don't exist
ALTER TABLE rides
ADD COLUMN IF NOT EXISTS is_return_trip BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS return_pickup_tba BOOLEAN DEFAULT FALSE;

-- Add super_admin_status if it doesn't exist already
ALTER TABLE rides
ADD COLUMN IF NOT EXISTS super_admin_status TEXT DEFAULT 'pending'; 