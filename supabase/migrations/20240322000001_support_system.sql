-- Create enum types for ticket status and priority
create type ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');

-- Create support tickets table
create table if not exists support_tickets (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    description text not null,
    status ticket_status not null default 'open',
    priority ticket_priority not null default 'medium',
    provider_id uuid references transportation_providers(id),
    created_by uuid references profiles(id) not null,
    assigned_to uuid references profiles(id),
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create ticket comments table
create table if not exists ticket_comments (
    id uuid primary key default uuid_generate_v4(),
    ticket_id uuid references support_tickets(id) on delete cascade not null,
    content text not null,
    created_by uuid references profiles(id) not null,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create ticket attachments table for future use
create table if not exists ticket_attachments (
    id uuid primary key default uuid_generate_v4(),
    ticket_id uuid references support_tickets(id) on delete cascade not null,
    file_name text not null,
    file_type text not null,
    file_size integer not null,
    file_url text not null,
    uploaded_by uuid references profiles(id) not null,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table support_tickets enable row level security;
alter table ticket_comments enable row level security;
alter table ticket_attachments enable row level security;

-- RLS Policies for support_tickets
create policy "Super admins can manage all tickets"
    on support_tickets
    for all
    using (auth.jwt() ->> 'user_role' = 'super_admin');

create policy "Admins can view and manage their provider's tickets"
    on support_tickets
    for all
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.user_role = 'admin'
            and support_tickets.provider_id = profiles.provider_id
        )
    );

create policy "Users can view their created tickets"
    on support_tickets
    for select
    using (created_by = auth.uid());

-- RLS Policies for ticket_comments
create policy "Super admins can manage all comments"
    on ticket_comments
    for all
    using (auth.jwt() ->> 'user_role' = 'super_admin');

create policy "Users can view comments on their tickets"
    on ticket_comments
    for select
    using (
        exists (
            select 1 from support_tickets
            where support_tickets.id = ticket_comments.ticket_id
            and (
                support_tickets.created_by = auth.uid()
                or support_tickets.assigned_to = auth.uid()
                or exists (
                    select 1 from profiles
                    where profiles.id = auth.uid()
                    and profiles.user_role = 'admin'
                    and support_tickets.provider_id = profiles.provider_id
                )
            )
        )
    );

create policy "Users can add comments to their tickets"
    on ticket_comments
    for insert
    with check (
        exists (
            select 1 from support_tickets
            where support_tickets.id = ticket_comments.ticket_id
            and (
                support_tickets.created_by = auth.uid()
                or support_tickets.assigned_to = auth.uid()
                or exists (
                    select 1 from profiles
                    where profiles.id = auth.uid()
                    and profiles.user_role = 'admin'
                    and support_tickets.provider_id = profiles.provider_id
                )
            )
        )
    );

-- RLS Policies for ticket_attachments
create policy "Super admins can manage all attachments"
    on ticket_attachments
    for all
    using (auth.jwt() ->> 'user_role' = 'super_admin');

create policy "Users can view attachments on their tickets"
    on ticket_attachments
    for select
    using (
        exists (
            select 1 from support_tickets
            where support_tickets.id = ticket_attachments.ticket_id
            and (
                support_tickets.created_by = auth.uid()
                or support_tickets.assigned_to = auth.uid()
                or exists (
                    select 1 from profiles
                    where profiles.id = auth.uid()
                    and profiles.user_role = 'admin'
                    and support_tickets.provider_id = profiles.provider_id
                )
            )
        )
    );

create policy "Users can add attachments to their tickets"
    on ticket_attachments
    for insert
    with check (
        exists (
            select 1 from support_tickets
            where support_tickets.id = ticket_attachments.ticket_id
            and (
                support_tickets.created_by = auth.uid()
                or support_tickets.assigned_to = auth.uid()
                or exists (
                    select 1 from profiles
                    where profiles.id = auth.uid()
                    and profiles.user_role = 'admin'
                    and support_tickets.provider_id = profiles.provider_id
                )
            )
        )
    );

-- Add updated_at trigger for support_tickets
create trigger update_support_tickets_updated_at
    before update on support_tickets
    for each row
    execute function update_updated_at_column(); 