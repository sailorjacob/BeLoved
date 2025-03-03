-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Create enum types for user roles and statuses if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        create type user_role as enum ('super_admin', 'admin', 'driver');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_type') THEN
        create type status_type as enum ('active', 'inactive');
    END IF;
END $$;

-- Create or modify the transportation_providers table
create table if not exists transportation_providers (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    organization_code text not null unique,
    address text not null,
    city text not null,
    state text not null,
    zip text not null,
    status status_type default 'active',
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Modify the profiles table to include necessary fields
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_role') THEN
        alter table profiles add column user_role user_role default 'driver';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'provider_id') THEN
        alter table profiles add column provider_id uuid references transportation_providers(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
        alter table profiles add column status status_type default 'active';
    END IF;
END $$;

-- Create the driver_profiles table if it doesn't exist
create table if not exists driver_profiles (
    id uuid primary key references profiles(id),
    license_number text,
    license_expiry date,
    vehicle_type text,
    completed_rides integer default 0,
    total_miles decimal default 0,
    provider_id uuid references transportation_providers(id),
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Functions for managing timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Add updated_at triggers if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_transportation_providers_updated_at') THEN
        create trigger update_transportation_providers_updated_at
            before update on transportation_providers
            for each row
            execute function update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_driver_profiles_updated_at') THEN
        create trigger update_driver_profiles_updated_at
            before update on driver_profiles
            for each row
            execute function update_updated_at_column();
    END IF;
END $$;

-- Enable RLS on all tables
alter table transportation_providers enable row level security;
alter table driver_profiles enable row level security;

-- Transportation Providers policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Super admins can manage all providers" ON transportation_providers;
    CREATE POLICY "Super admins can manage all providers"
        ON transportation_providers
        FOR ALL
        USING (auth.jwt() ->> 'user_role' = 'super_admin');
        
    DROP POLICY IF EXISTS "Admins can view their own provider" ON transportation_providers;
    CREATE POLICY "Admins can view their own provider"
        ON transportation_providers
        FOR SELECT
        USING (id = (
            SELECT provider_id FROM profiles
            WHERE profiles.id = auth.uid()
        ));
END $$;

-- Driver profiles policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Super admins can manage all driver profiles" ON driver_profiles;
    CREATE POLICY "Super admins can manage all driver profiles"
        ON driver_profiles
        FOR ALL
        USING (auth.jwt() ->> 'user_role' = 'super_admin');
        
    DROP POLICY IF EXISTS "Admins can manage driver profiles in their provider" ON driver_profiles;
    CREATE POLICY "Admins can manage driver profiles in their provider"
        ON driver_profiles
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.user_role = 'admin'
                AND driver_profiles.provider_id = profiles.provider_id
            )
        );
        
    DROP POLICY IF EXISTS "Drivers can view their own profile" ON driver_profiles;
    CREATE POLICY "Drivers can view their own profile"
        ON driver_profiles
        FOR SELECT
        USING (auth.uid() = id);
END $$;

-- Insert a sample transportation provider for testing
INSERT INTO transportation_providers (name, organization_code, address, city, state, zip)
VALUES ('BeLoved Transportation', 'BELOVED001', '123 Main St', 'Indianapolis', 'IN', '46204')
ON CONFLICT (organization_code) DO NOTHING; 