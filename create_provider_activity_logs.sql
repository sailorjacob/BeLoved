-- Create provider activity logs table
CREATE TABLE IF NOT EXISTS public.provider_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES public.transportation_providers(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_by TEXT NOT NULL,
    created_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add description to the table
COMMENT ON TABLE public.provider_activity_logs IS 'Logs of actions performed on transportation providers';

-- Add descriptions to the columns
COMMENT ON COLUMN public.provider_activity_logs.id IS 'Unique identifier for the activity log entry';
COMMENT ON COLUMN public.provider_activity_logs.provider_id IS 'ID of the provider related to this activity';
COMMENT ON COLUMN public.provider_activity_logs.provider_name IS 'Name of the provider at the time of the action';
COMMENT ON COLUMN public.provider_activity_logs.action IS 'Action performed (e.g., update, create, delete, status_change)';
COMMENT ON COLUMN public.provider_activity_logs.details IS 'JSON object containing details of the changes made';
COMMENT ON COLUMN public.provider_activity_logs.created_at IS 'Timestamp when the activity was logged';
COMMENT ON COLUMN public.provider_activity_logs.created_by IS 'Name of the user who performed the action';
COMMENT ON COLUMN public.provider_activity_logs.created_by_id IS 'ID of the user who performed the action';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_activity_logs_provider_id ON public.provider_activity_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_activity_logs_created_at ON public.provider_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_activity_logs_created_by_id ON public.provider_activity_logs(created_by_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.provider_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY "Admins can view provider activity logs" 
    ON public.provider_activity_logs 
    FOR SELECT 
    TO authenticated 
    USING (
        auth.jwt() ->> 'user_role' = 'admin' OR 
        auth.jwt() ->> 'user_role' = 'super_admin'
    );

CREATE POLICY "Super admins can insert provider activity logs" 
    ON public.provider_activity_logs 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        auth.jwt() ->> 'user_role' = 'super_admin'
    );

CREATE POLICY "Provider admins can insert logs for their provider" 
    ON public.provider_activity_logs 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        auth.jwt() ->> 'user_role' = 'admin' AND 
        provider_id = (SELECT provider_id FROM public.profiles WHERE id = auth.uid())
    );

-- Add the table to the public schema
GRANT ALL ON public.provider_activity_logs TO authenticated;
GRANT ALL ON public.provider_activity_logs TO service_role; 