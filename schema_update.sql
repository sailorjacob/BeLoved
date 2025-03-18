-- Create a new table for vehicle documents
CREATE TABLE IF NOT EXISTS vehicle_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('photo', 'insurance', 'maintenance')),
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle_id ON vehicle_documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_type ON vehicle_documents(type);

-- Add comment for documentation
COMMENT ON TABLE vehicle_documents IS 'Stores document uploads related to vehicles such as photos, insurance papers, and maintenance records';
