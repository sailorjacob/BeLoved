-- Create the carwash_checkins table
create table public.carwash_checkins (
    id uuid default gen_random_uuid() primary key,
    driver_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.carwash_checkins enable row level security;

-- Allow authenticated users to view all check-ins
create policy "Authenticated users can view check-ins"
    on public.carwash_checkins
    for select
    using (auth.role() = 'authenticated');

-- Allow authenticated users to create check-ins
create policy "Authenticated users can create check-ins"
    on public.carwash_checkins
    for insert
    with check (auth.role() = 'authenticated');

-- Allow authenticated users to update their own check-ins
create policy "Authenticated users can update their own check-ins"
    on public.carwash_checkins
    for update
    using (auth.uid() = driver_id);

-- Allow authenticated users to delete their own check-ins
create policy "Authenticated users can delete their own check-ins"
    on public.carwash_checkins
    for delete
    using (auth.uid() = driver_id);

-- Add updated_at trigger
create trigger handle_updated_at before update on public.carwash_checkins
    for each row execute procedure moddatetime('updated_at'); 