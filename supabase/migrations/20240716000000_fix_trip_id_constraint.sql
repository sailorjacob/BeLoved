-- Fix the unique constraint on trip_id to allow for return trips
-- This migration will:
-- 1. Drop the existing unique constraint on trip_id
-- 2. Add a new partial index that ensures uniqueness only when comparing same trip types
-- This allows a trip_id to be used for both the initial trip and its return trip

-- First, drop the existing constraint if it exists
ALTER TABLE IF EXISTS rides DROP CONSTRAINT IF EXISTS rides_trip_id_key;

-- Create a new partial unique index that only enforces uniqueness within the same trip type
-- This means we can have a regular trip and return trip with the same trip_id
CREATE UNIQUE INDEX IF NOT EXISTS rides_trip_id_is_return_idx 
ON rides(trip_id, is_return_trip) 
WHERE trip_id IS NOT NULL;

-- Add a comment explaining the constraint
COMMENT ON INDEX rides_trip_id_is_return_idx IS 
'Ensures trip_id is unique only within the same trip type (regular or return), allowing round trips to share the same trip_id';

-- Add an entry in the audit log for this migration
INSERT INTO audit_logs (actor_id, action, table_name, details)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- System user ID
  'schema_migration', 
  'rides', 
  jsonb_build_object(
    'migration', '20240716000000_fix_trip_id_constraint',
    'description', 'Modified trip_id constraint to allow return trips with same trip_id'
  )
);

-- Output message
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Modified trip_id constraint to allow return trips with the same trip_id';
END $$; 