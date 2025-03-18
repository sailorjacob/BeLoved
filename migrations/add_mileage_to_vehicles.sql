-- Add mileage column to vehicles table
ALTER TABLE vehicles 
ADD COLUMN mileage INTEGER;

-- Add comment explaining the column
COMMENT ON COLUMN vehicles.mileage IS 'Current mileage of the vehicle in miles'; 