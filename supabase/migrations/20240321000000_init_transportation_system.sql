-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Create enum types for user roles and statuses
create type user_role as enum ('super_admin', 'admin', 'driver');
create type status_type as enum ('active', 'inactive');

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
alter table profiles 
    add column if not exists user_role user_role not null default 'driver',
    add column if not exists provider_id uuid references transportation_providers(id),
    add column if not exists status status_type default 'active';

-- Create the drivers table for driver-specific information
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

-- RLS Policies

-- Enable RLS on all tables
alter table transportation_providers enable row level security;
alter table profiles enable row level security;
alter table driver_profiles enable row level security;

-- Transportation Providers policies
create policy "Super admins can manage all providers"
    on transportation_providers
    for all
    using (auth.jwt() ->> 'user_role' = 'super_admin');

create policy "Admins can view their own provider"
    on transportation_providers
    for select
    using (id = (
        select provider_id from profiles
        where profiles.id = auth.uid()
    ));

-- Profiles policies
create policy "Super admins can manage all profiles"
    on profiles
    for all
    using (auth.jwt() ->> 'user_role' = 'super_admin');

create policy "Admins can manage profiles in their provider"
    on profiles
    for all
    using (
        (auth.jwt() ->> 'user_role' = 'admin' and 
        provider_id = (
            select provider_id from profiles
            where profiles.id = auth.uid()
        ))
    );

create policy "Users can view their own profile"
    on profiles
    for select
    using (auth.uid() = id);

-- Driver profiles policies
create policy "Super admins can manage all driver profiles"
    on driver_profiles
    for all
    using (auth.jwt() ->> 'user_role' = 'super_admin');

create policy "Admins can manage driver profiles in their provider"
    on driver_profiles
    for all
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.user_role = 'admin'
            and driver_profiles.provider_id = profiles.provider_id
        )
    );

create policy "Drivers can view their own profile"
    on driver_profiles
    for select
    using (auth.uid() = id);

-- Functions for managing timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger update_transportation_providers_updated_at
    before update on transportation_providers
    for each row
    execute function update_updated_at_column();

create trigger update_driver_profiles_updated_at
    before update on driver_profiles
    for each row
    execute function update_updated_at_column(); 