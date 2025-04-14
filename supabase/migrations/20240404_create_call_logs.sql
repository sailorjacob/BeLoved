-- Create call_logs table
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  call_id TEXT NOT NULL,
  caller_id TEXT,
  status TEXT NOT NULL,
  duration INTEGER,
  recording_url TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  end_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create call_transcripts table
CREATE TABLE IF NOT EXISTS call_transcripts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  call_id TEXT NOT NULL,
  transcript TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_call_logs_call_id ON call_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_caller_id ON call_logs(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_transcripts_call_id ON call_transcripts(call_id);

-- Add RLS policies
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_transcripts ENABLE ROW LEVEL SECURITY;

-- Policy for super admins and admins to view all calls
CREATE POLICY "Super admins and admins can view all call logs"
  ON call_logs
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('super_admin', 'admin')
  );

-- Policy for members to view their own calls
CREATE POLICY "Members can view their own call logs"
  ON call_logs
  FOR SELECT
  USING (
    auth.uid() = caller_id::uuid
  );

-- Policy for super admins and admins to view all transcripts
CREATE POLICY "Super admins and admins can view all call transcripts"
  ON call_transcripts
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('super_admin', 'admin')
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_call_logs_updated_at
    BEFORE UPDATE ON call_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_transcripts_updated_at
    BEFORE UPDATE ON call_transcripts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 