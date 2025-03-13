-- Add new workflow fields to rides table for the scheduling workflow
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS super_admin_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES auth.users(id);
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS provider_status VARCHAR(20);
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS assignedby_super_admin_id UUID REFERENCES auth.users(id);
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS assignedby_provider_admin_id UUID REFERENCES auth.users(id);
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS decline_reason TEXT;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS provider_decline_reason TEXT;

-- Add ride status history table to track status changes
CREATE TABLE IF NOT EXISTS public.ride_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES public.rides(id),
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    notes TEXT
);

-- Ensure RLS is enabled
ALTER TABLE public.ride_status_history ENABLE ROW LEVEL SECURITY;

-- Add policies for ride status history
CREATE POLICY super_admin_all_access_history ON public.ride_status_history
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'super_admin'
        )
    );

CREATE POLICY admin_all_access_history ON public.ride_status_history
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY driver_read_access_history ON public.ride_status_history
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM rides, profiles
            WHERE rides.id = ride_status_history.ride_id
            AND profiles.id = auth.uid()
            AND profiles.user_type = 'driver'
            AND rides.driver_id = profiles.id
        )
    );

CREATE POLICY member_read_access_history ON public.ride_status_history
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM rides, profiles
            WHERE rides.id = ride_status_history.ride_id
            AND profiles.id = auth.uid()
            AND profiles.user_type = 'member'
            AND rides.member_id = profiles.id
        )
    ); 