-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id uuid REFERENCES transportation_providers(id),
    make text NOT NULL,
    model text NOT NULL,
    year text NOT NULL,
    license_plate text NOT NULL,
    vin text NOT NULL,
    status text CHECK (status IN ('active', 'maintenance', 'inactive')) DEFAULT 'active',
    last_inspection_date timestamp with time zone,
    insurance_expiry timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create rides table
CREATE TABLE IF NOT EXISTS rides (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id uuid REFERENCES transportation_providers(id),
    member_id uuid REFERENCES profiles(id),
    driver_id uuid REFERENCES profiles(id),
    vehicle_id uuid REFERENCES vehicles(id),
    status text CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    scheduled_pickup_time timestamp with time zone NOT NULL,
    actual_pickup_time timestamp with time zone,
    actual_dropoff_time timestamp with time zone,
    pickup_location text NOT NULL,
    dropoff_location text NOT NULL,
    start_miles numeric,
    end_miles numeric,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    changed_by uuid REFERENCES profiles(id),
    changes jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Add foreign key for changed_by_user relationship
ALTER TABLE audit_logs
    ADD CONSTRAINT audit_logs_changed_by_fkey
    FOREIGN KEY (changed_by)
    REFERENCES profiles(id)
    ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for vehicles
CREATE POLICY "Super admins can manage all vehicles"
    ON vehicles
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.user_role = 'super_admin'
    ));

CREATE POLICY "Admins can manage vehicles in their provider"
    ON vehicles
    FOR ALL
    USING (
        provider_id = (
            SELECT provider_id FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'admin'
        )
    );

-- Add RLS policies for rides
CREATE POLICY "Super admins can manage all rides"
    ON rides
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.user_role = 'super_admin'
    ));

CREATE POLICY "Admins can manage rides in their provider"
    ON rides
    FOR ALL
    USING (
        provider_id = (
            SELECT provider_id FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'admin'
        )
    );

CREATE POLICY "Drivers can view and update their assigned rides"
    ON rides
    FOR ALL
    USING (
        driver_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'driver'
        )
    );

-- Add RLS policies for audit_logs
CREATE POLICY "Super admins can view all audit logs"
    ON audit_logs
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.user_role = 'super_admin'
    ));

CREATE POLICY "Admins can view audit logs for their provider"
    ON audit_logs
    FOR SELECT
    USING (
        entity_id IN (
            SELECT id FROM transportation_providers
            WHERE id = (
                SELECT provider_id FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.user_role = 'admin'
            )
        )
    );

-- Add updated_at triggers
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at
    BEFORE UPDATE ON rides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 