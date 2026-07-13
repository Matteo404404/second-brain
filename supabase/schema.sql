-- Second Brain v3 — routine, storico, task completi
-- Esegui in SQL Editor (anche su DB esistente)

create table if not exists habit_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  section text not null,
  frequency_type text not null,
  frequency_value int,
  preferred_rule text,
  active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references habit_templates(id) on delete cascade,
  log_date date not null,
  done boolean default false,
  created_at timestamptz default now(),
  unique (template_id, log_date)
);

create table if not exists daily_state (
  log_date date primary key,
  handwriting_done boolean default false,
  updated_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text,
  tag text default 'personal',
  priority text default 'next',
  due_date date,
  due_time time,
  recurrence text,
  done boolean default false,
  done_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists task_subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  title text not null,
  done boolean default false,
  sort_order int default 0
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  kind text default 'text',
  tag text default 'personal',
  created_at timestamptz default now()
);

create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text,
  content text,
  kind text default 'link',
  tag text default 'personal',
  created_at timestamptz default now()
);

create table if not exists inbox (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  processed boolean default false,
  created_at timestamptz default now()
);

create table if not exists archive (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  original_type text,
  archived_at timestamptz default now()
);

create table if not exists behavior_reminders (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  sort_order int default 0,
  active boolean default true
);

create table if not exists trusted_devices (
  device_id text primary key,
  device_name text,
  paired_at timestamptz default now()
);

-- migrate old tables if present
insert into habit_templates (title, section, frequency_type, frequency_value, preferred_rule, sort_order)
select title, category, frequency_type, frequency_value, preferred_rule, sort_order
from check_templates
where not exists (select 1 from habit_templates limit 1)
  and exists (select 1 from information_schema.tables where table_name = 'check_templates');

insert into habit_logs (template_id, log_date, done, created_at)
select hl.template_id, hl.log_date, hl.done, hl.created_at
from check_logs hl
join habit_templates ht on ht.id = hl.template_id
where not exists (select 1 from habit_logs limit 1)
  and exists (select 1 from information_schema.tables where table_name = 'check_logs');

insert into inbox (content, processed, created_at)
select content, processed, created_at from scratchpad
where not exists (select 1 from inbox limit 1)
  and exists (select 1 from information_schema.tables where table_name = 'scratchpad');

alter table habit_templates enable row level security;
alter table habit_logs enable row level security;
alter table daily_state enable row level security;
alter table tasks enable row level security;
alter table task_subtasks enable row level security;
alter table notes enable row level security;
alter table resources enable row level security;
alter table inbox enable row level security;
alter table archive enable row level security;
alter table behavior_reminders enable row level security;
alter table trusted_devices enable row level security;

drop policy if exists "app_access" on check_templates;
drop policy if exists "owner_only" on check_templates;

do $$ declare t text; begin
  foreach t in array array['habit_templates','habit_logs','daily_state','tasks','task_subtasks','notes','resources','inbox','archive','behavior_reminders','trusted_devices','check_templates','check_logs','scratchpad'] loop
    execute format('drop policy if exists app_access on %I', t);
    execute format('drop policy if exists owner_only on %I', t);
    execute format('drop policy if exists devices_read on %I', t);
    execute format('drop policy if exists devices_insert on %I', t);
    execute format('drop policy if exists devices_delete on %I', t);
  end loop;
end $$;

create policy app_access on habit_templates for all using (true) with check (true);
create policy app_access on habit_logs for all using (true) with check (true);
create policy app_access on daily_state for all using (true) with check (true);
create policy app_access on tasks for all using (true) with check (true);
create policy app_access on task_subtasks for all using (true) with check (true);
create policy app_access on notes for all using (true) with check (true);
create policy app_access on resources for all using (true) with check (true);
create policy app_access on inbox for all using (true) with check (true);
create policy app_access on archive for all using (true) with check (true);
create policy app_access on behavior_reminders for all using (true) with check (true);
create policy devices_read on trusted_devices for select using (true);
create policy devices_insert on trusted_devices for insert with check ((select count(*) from trusted_devices) < 2);
create policy devices_delete on trusted_devices for delete using (true);

-- seed routine (solo se vuota)
insert into habit_templates (title, section, frequency_type, frequency_value, preferred_rule, sort_order)
select * from (values
  ('Drink water + sunlight', 'Morning', 'daily', null, null, 10),
  ('Dead hangs', 'Morning', 'daily', null, null, 20),
  ('Work', 'Work', 'weekdays', null, null, 30),
  ('Cardio', 'Body', 'daily', null, null, 40),
  ('Stretch', 'Body', 'daily', null, null, 50),
  ('Chin tucks + symmetry', 'Body', 'daily', null, null, 60),
  ('Supplements + creatine', 'Body', 'daily', null, null, 70),
  ('Relax breathing', 'Body', 'daily', null, null, 80),
  ('Training', 'Body', 'times_per_week', 3, 'even_days_preferred', 90),
  ('Head massage', 'Body', 'every_other_day', null, null, 100),
  ('Posture / balance', 'Body', 'every_other_day', null, null, 110),
  ('Stare al muro', 'Body', 'conditional', null, 'no_handwriting', 120),
  ('Study', 'Mind', 'daily', null, null, 130),
  ('Duolingo', 'Mind', 'daily', null, null, 140),
  ('Language Transfer Spanish', 'Mind', 'every_other_day', null, null, 150),
  ('Book — 1 capitolo', 'Mind', 'daily', null, null, 160),
  ('Bibbia — 5 capitoli', 'Mind', 'daily', null, null, 170),
  ('Articolo Wikipedia', 'Mind', 'daily', null, null, 180),
  ('Newsletter', 'Mind', 'daily_except_sunday', null, null, 190),
  ('Substack', 'Mind', 'times_per_week', 1, 'thursday_preferred', 200),
  ('Side project session', 'Mind', 'times_per_week', 1, null, 210),
  ('Meditare', 'Mind', 'conditional', null, 'rest_day', 220),
  ('Volontariato', 'Mind', 'times_per_month', 1, null, 230),
  ('Film / qualcosa', 'Evening', 'conditional', null, 'rest_day', 240),
  ('Track food', 'Evening', 'daily', null, null, 250)
) as v(title, section, frequency_type, frequency_value, preferred_rule, sort_order)
where not exists (select 1 from habit_templates limit 1);

insert into behavior_reminders (body, sort_order)
select 'Per parlare meglio: evita le filler words, usa le pause.', 10
where not exists (select 1 from behavior_reminders limit 1);
