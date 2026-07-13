-- esegui su progetto Supabase gia esistente (sostituisce auth magic link)

create table if not exists trusted_devices (
  device_id text primary key,
  device_name text,
  paired_at timestamptz default now()
);

alter table trusted_devices enable row level security;

drop policy if exists "owner_only" on check_templates;
drop policy if exists "owner_only" on check_logs;
drop policy if exists "owner_only" on daily_state;
drop policy if exists "owner_only" on tasks;
drop policy if exists "owner_only" on notes;
drop policy if exists "owner_only" on resources;
drop policy if exists "owner_only" on scratchpad;
drop policy if exists "owner_only" on archive;
drop policy if exists "owner_only" on behavior_reminders;

create policy "app_access" on check_templates for all using (true) with check (true);
create policy "app_access" on check_logs for all using (true) with check (true);
create policy "app_access" on daily_state for all using (true) with check (true);
create policy "app_access" on tasks for all using (true) with check (true);
create policy "app_access" on notes for all using (true) with check (true);
create policy "app_access" on resources for all using (true) with check (true);
create policy "app_access" on scratchpad for all using (true) with check (true);
create policy "app_access" on archive for all using (true) with check (true);
create policy "app_access" on behavior_reminders for all using (true) with check (true);

drop policy if exists "devices_read" on trusted_devices;
drop policy if exists "devices_insert" on trusted_devices;
drop policy if exists "devices_delete" on trusted_devices;

create policy "devices_read" on trusted_devices for select using (true);
create policy "devices_insert" on trusted_devices for insert with check ((select count(*) from trusted_devices) < 2);
create policy "devices_delete" on trusted_devices for delete using (true);
