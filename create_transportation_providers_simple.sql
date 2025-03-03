-- Create transportation_providers table
create table if not exists transportation_providers (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    organization_code text not null unique,
    address text not null,
    city text not null,
    state text not null,
    zip text not null,
    status text default 'active',
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Insert a sample transportation provider for testing
INSERT INTO transportation_providers (name, organization_code, address, city, state, zip)
VALUES ('BeLoved Transportation', 'BELOVED001', '123 Main St', 'Indianapolis', 'IN', '46204')
ON CONFLICT (organization_code) DO NOTHING; 