-- Fix RLS policies for rides table

-- First disable RLS on rides table
ALTER TABLE rides DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname, tablename FROM pg_policies WHERE tablename = 'rides'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 
                      policy_record.policyname, 
                      policy_record.tablename);
    END LOOP;
END
$$;

-- Add a new simplified policy for members to create their own rides
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- Allow members to create their own rides
CREATE POLICY "Members can create rides"
ON rides FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = member_id
);

-- Allow members to view their own rides
CREATE POLICY "Members can view rides"
ON rides FOR SELECT
TO authenticated
USING (
  auth.uid() = member_id
);

-- Allow members to update their own rides
CREATE POLICY "Members can update rides"
ON rides FOR UPDATE
TO authenticated
USING (
  auth.uid() = member_id
);

-- Allow super admins to do everything
CREATE POLICY "Super admins can do everything with rides"
ON rides FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_role = 'super_admin'
  )
);

-- Allow admins to manage rides
CREATE POLICY "Admins can manage rides"
ON rides FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_role = 'admin'
  )
);

-- Grant permissions
GRANT ALL ON rides TO authenticated;
GRANT ALL ON rides TO anon;
GRANT ALL ON rides TO service_role; 