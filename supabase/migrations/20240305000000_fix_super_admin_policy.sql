-- Drop and recreate the super admin policy for transportation providers
DROP POLICY IF EXISTS "Super admins can manage all providers" ON transportation_providers;
CREATE POLICY "Super admins can manage all providers"
    ON transportation_providers
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.user_type = 'super_admin'
    )); 