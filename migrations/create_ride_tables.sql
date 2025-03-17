-- Create tables for ride scheduling functionality

-- Table for storing driver availability
CREATE TABLE IF NOT EXISTS public.driver_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Create index on driver_id
CREATE INDEX IF NOT EXISTS idx_driver_availability_driver_id ON public.driver_availability(driver_id);

-- Table for storing ride information
CREATE TABLE IF NOT EXISTS public.rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES public.transportation_providers(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.profiles(id),
    driver_id UUID REFERENCES public.profiles(id),
    pickup_location TEXT NOT NULL,
    pickup_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    dropoff_location TEXT NOT NULL,
    dropoff_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_rides_provider_id ON public.rides(provider_id);
CREATE INDEX IF NOT EXISTS idx_rides_member_id ON public.rides(member_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_pickup_datetime ON public.rides(pickup_datetime);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.driver_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Drivers can see their own availability
CREATE POLICY driver_availability_select ON public.driver_availability
    FOR SELECT
    USING (driver_id = auth.uid() OR 
           EXISTS (
               SELECT 1 FROM public.profiles
               WHERE profiles.id = auth.uid() AND 
                     (profiles.user_role = 'admin' OR profiles.user_role = 'super_admin')
           ));

-- Drivers can update their own availability
CREATE POLICY driver_availability_update ON public.driver_availability
    FOR UPDATE
    USING (driver_id = auth.uid() OR 
           EXISTS (
               SELECT 1 FROM public.profiles
               WHERE profiles.id = auth.uid() AND 
                     (profiles.user_role = 'admin' OR profiles.user_role = 'super_admin')
           ));

-- Drivers can insert their own availability
CREATE POLICY driver_availability_insert ON public.driver_availability
    FOR INSERT
    WITH CHECK (driver_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid() AND 
                          (profiles.user_role = 'admin' OR profiles.user_role = 'super_admin')
                ));

-- Drivers can delete their own availability
CREATE POLICY driver_availability_delete ON public.driver_availability
    FOR DELETE
    USING (driver_id = auth.uid() OR 
           EXISTS (
               SELECT 1 FROM public.profiles
               WHERE profiles.id = auth.uid() AND 
                     (profiles.user_role = 'admin' OR profiles.user_role = 'super_admin')
           ));

-- Policies for rides table
-- Members can see their own rides
CREATE POLICY rides_select_member ON public.rides
    FOR SELECT
    USING (member_id = auth.uid());

-- Drivers can see rides assigned to them
CREATE POLICY rides_select_driver ON public.rides
    FOR SELECT
    USING (driver_id = auth.uid());

-- Admins and super admins can see all rides for their provider
CREATE POLICY rides_select_admin ON public.rides
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND 
              (profiles.user_role = 'admin' OR profiles.user_role = 'super_admin') AND
              (profiles.user_role = 'super_admin' OR profiles.provider_id = provider_id)
    ));

-- Only admins and super admins can create rides
CREATE POLICY rides_insert ON public.rides
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND 
              (profiles.user_role = 'admin' OR profiles.user_role = 'super_admin') AND
              (profiles.user_role = 'super_admin' OR profiles.provider_id = provider_id)
    ));

-- Only admins and super admins can update rides
CREATE POLICY rides_update_admin ON public.rides
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND 
              (profiles.user_role = 'admin' OR profiles.user_role = 'super_admin') AND
              (profiles.user_role = 'super_admin' OR profiles.provider_id = provider_id)
    ));

-- Drivers can update rides assigned to them (for status changes)
CREATE POLICY rides_update_driver ON public.rides
    FOR UPDATE
    USING (driver_id = auth.uid() AND status IN ('assigned', 'in_progress'))
    WITH CHECK (status IN ('in_progress', 'completed', 'cancelled'));

-- Functions to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_driver_availability_updated_at
BEFORE UPDATE ON public.driver_availability
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_rides_updated_at
BEFORE UPDATE ON public.rides
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at(); 