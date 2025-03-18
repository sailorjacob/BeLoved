-- Create a storage bucket for vehicle documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-documents', 'vehicle-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up public access policies
CREATE POLICY "Vehicle Documents - Public Read Access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vehicle-documents');

-- Set up authenticated user access policies
CREATE POLICY "Vehicle Documents - Authenticated Insert Access"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-documents');

CREATE POLICY "Vehicle Documents - Authenticated Delete Access"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'vehicle-documents'); 