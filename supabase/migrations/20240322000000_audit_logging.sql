-- Create enum for audit action types
create type audit_action as enum (
  'create',
  'update',
  'delete',
  'status_change',
  'login',
  'password_change',
  'assignment'
);

-- Create enum for entity types
create type audit_entity as enum (
  'provider',
  'admin',
  'driver',
  'ride',
  'vehicle'
);

-- Create audit logs table
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  action audit_action not null,
  entity_type audit_entity not null,
  entity_id uuid not null,
  changed_by uuid references profiles(id),
  changes jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Add indexes for better query performance
create index audit_logs_entity_idx on audit_logs(entity_type, entity_id);
create index audit_logs_changed_by_idx on audit_logs(changed_by);
create index audit_logs_created_at_idx on audit_logs(created_at);

-- Enable RLS
alter table audit_logs enable row level security;

-- RLS policies for audit logs
create policy "Super admins can view all audit logs"
  on audit_logs
  for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.user_role = 'super_admin'
    )
  );

create policy "Admins can view audit logs for their provider"
  on audit_logs
  for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.user_role = 'admin'
      and (
        -- Can view logs related to their provider
        exists (
          select 1 from transportation_providers
          where transportation_providers.id = (
            select provider_id from profiles where id = audit_logs.entity_id
          )
          and transportation_providers.id = profiles.provider_id
        )
        -- Or logs they created
        or audit_logs.changed_by = profiles.id
      )
    )
  );

-- Function to automatically create audit logs
create or replace function create_audit_log()
returns trigger as $$
declare
  changes_json jsonb;
  current_user_id uuid;
begin
  -- Get the current user ID from the auth.uid()
  current_user_id := auth.uid();
  
  if (TG_OP = 'INSERT') then
    changes_json := jsonb_build_object('new', row_to_json(NEW));
  elsif (TG_OP = 'UPDATE') then
    changes_json := jsonb_build_object(
      'old', row_to_json(OLD),
      'new', row_to_json(NEW),
      'changed_fields', (
        select jsonb_object_agg(key, value)
        from jsonb_each(row_to_json(NEW)::jsonb)
        where NEW.* ? key and OLD.* ? key and NEW.* -> key <> OLD.* -> key
      )
    );
  elsif (TG_OP = 'DELETE') then
    changes_json := jsonb_build_object('old', row_to_json(OLD));
  end if;

  insert into audit_logs (
    action,
    entity_type,
    entity_id,
    changed_by,
    changes,
    ip_address,
    user_agent
  ) values (
    lower(TG_OP)::audit_action,
    TG_TABLE_NAME::audit_entity,
    case
      when TG_OP = 'DELETE' then OLD.id
      else NEW.id
    end,
    current_user_id,
    changes_json,
    current_setting('request.headers', true)::jsonb->>'x-real-ip',
    current_setting('request.headers', true)::jsonb->>'user-agent'
  );

  return null;
end;
$$ language plpgsql security definer;

-- Add audit triggers to relevant tables
create trigger audit_transportation_providers_trigger
  after insert or update or delete on transportation_providers
  for each row execute function create_audit_log();

create trigger audit_profiles_trigger
  after insert or update or delete on profiles
  for each row execute function create_audit_log();

create trigger audit_driver_profiles_trigger
  after insert or update or delete on driver_profiles
  for each row execute function create_audit_log(); 