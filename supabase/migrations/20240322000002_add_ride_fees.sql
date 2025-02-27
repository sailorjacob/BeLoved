-- Add financial fields to rides table
ALTER TABLE rides
ADD COLUMN IF NOT EXISTS provider_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS driver_earnings NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS insurance_claim_amount NUMERIC DEFAULT 0;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS rides_provider_fee_idx ON rides(provider_fee);
CREATE INDEX IF NOT EXISTS rides_driver_earnings_idx ON rides(driver_earnings);
CREATE INDEX IF NOT EXISTS rides_insurance_claim_amount_idx ON rides(insurance_claim_amount);

-- Update the Database type definition
COMMENT ON TABLE rides IS 'Table storing ride information including financial details';
COMMENT ON COLUMN rides.provider_fee IS 'Fee paid to the transportation provider';
COMMENT ON COLUMN rides.driver_earnings IS 'Earnings for the driver';
COMMENT ON COLUMN rides.insurance_claim_amount IS 'Amount claimed for insurance'; 