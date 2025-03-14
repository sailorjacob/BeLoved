-- Add appointment_time column to rides table
ALTER TABLE IF EXISTS rides
ADD COLUMN IF NOT EXISTS appointment_time TIMESTAMPTZ;

-- Create index on appointment_time for performance
CREATE INDEX IF NOT EXISTS rides_appointment_time_idx ON rides(appointment_time);

-- Backfill appointment_time as 1 hour after scheduled_pickup_time for existing data
UPDATE rides 
SET appointment_time = scheduled_pickup_time + INTERVAL '1 hour'
WHERE appointment_time IS NULL;

-- Add is_return_trip and return_pickup_tba columns if they don't exist
ALTER TABLE IF EXISTS rides
ADD COLUMN IF NOT EXISTS is_return_trip BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS return_pickup_tba BOOLEAN DEFAULT FALSE;

-- Add super_admin_status column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_approval_status') THEN
    CREATE TYPE admin_approval_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

ALTER TABLE IF EXISTS rides
ADD COLUMN IF NOT EXISTS super_admin_status admin_approval_status DEFAULT 'pending'; 