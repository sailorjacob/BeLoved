-- Add URL column to vehicle_documents table
ALTER TABLE vehicle_documents ADD COLUMN IF NOT EXISTS url TEXT NOT NULL;
