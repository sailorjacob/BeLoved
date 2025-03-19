-- Create member_notes table
CREATE TABLE IF NOT EXISTS member_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    provider_id UUID REFERENCES transportation_providers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add an index on member_id for faster queries
CREATE INDEX IF NOT EXISTS member_notes_member_id_idx ON member_notes(member_id);

-- Add an index on provider_id for faster provider-specific queries
CREATE INDEX IF NOT EXISTS member_notes_provider_id_idx ON member_notes(provider_id);

-- Create or replace a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_member_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at timestamp
CREATE TRIGGER update_member_notes_updated_at
BEFORE UPDATE ON member_notes
FOR EACH ROW
EXECUTE FUNCTION update_member_notes_updated_at();

-- Add RLS policies for member_notes
ALTER TABLE member_notes ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own notes and notes for their provider
CREATE POLICY "Users can view notes for their provider"
    ON member_notes
    FOR SELECT
    USING (
        (provider_id = (SELECT provider_id FROM profiles WHERE id = auth.uid())) OR
        (auth.uid() = member_id) OR
        (auth.uid() IN (SELECT id FROM profiles WHERE user_role = 'super_admin'))
    );

-- Allow admins, super_admins to create notes
CREATE POLICY "Admins can create notes"
    ON member_notes
    FOR INSERT
    WITH CHECK (
        (auth.uid() IN (SELECT id FROM profiles WHERE user_role IN ('admin', 'super_admin')))
    );

-- Allow note authors and super_admins to update notes
CREATE POLICY "Note authors and super_admins can update notes"
    ON member_notes
    FOR UPDATE
    USING (
        (auth.uid() = author_id) OR
        (auth.uid() IN (SELECT id FROM profiles WHERE user_role = 'super_admin'))
    );

-- Allow note authors and super_admins to delete notes
CREATE POLICY "Note authors and super_admins can delete notes"
    ON member_notes
    FOR DELETE
    USING (
        (auth.uid() = author_id) OR
        (auth.uid() IN (SELECT id FROM profiles WHERE user_role = 'super_admin'))
    ); 