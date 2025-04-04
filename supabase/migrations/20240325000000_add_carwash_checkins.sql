-- Create the carwash_checkins table
create table public.carwash_checkins (
    id uuid default gen_random_uuid() primary key,
    driver_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.carwash_checkins enable row level security;

-- Allow drivers to view their own check-ins
create policy "Drivers can view their own check-ins"
    on public.carwash_checkins
    for select
    using (auth.uid() = driver_id);

-- Allow drivers to create their own check-ins
create policy "Drivers can create their own check-ins"
    on public.carwash_checkins
    for insert
    with check (auth.uid() = driver_id);

-- Add updated_at trigger
create trigger handle_updated_at before update on public.carwash_checkins
    for each row execute procedure moddatetime('updated_at'); 