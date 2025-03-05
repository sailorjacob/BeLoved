-- Drop the existing policy
DROP POLICY IF EXISTS "Super admins can manage all providers" ON transportation_providers;

-- Create a new policy that explicitly handles both read and write operations
CREATE POLICY "Super admins can manage all providers"
    ON transportation_providers
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'super_admin'
        )
    ); 