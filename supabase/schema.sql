-- Second Brain schema (handout)

create table if not exists check_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  frequency_type text not null,
  frequency_value int,
  preferred_rule text,
  active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists check_logs (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references check_templates(id) on delete cascade,
  log_date date not null,
  done boolean default false,
  created_at timestamptz default now(),
  unique (template_id, log_date)
);

create table if not exists daily_state (
  log_date date primary key,
  handwriting_done boolean default false,
  is_rest_day boolean default false,
  updated_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  priority text default 'next',
  due_date date,
  due_time time,
  done boolean default false,
  reminder_offset_minutes int,
  created_at timestamptz default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  tag text,
  created_at timestamptz default now()
);

create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text,
  content text,
  tag text,
  created_at timestamptz default now()
);

create table if not exists scratchpad (
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

alter table check_templates enable row level security;
alter table check_logs enable row level security;
alter table daily_state enable row level security;
alter table tasks enable row level security;
alter table notes enable row level security;
alter table resources enable row level security;
alter table scratchpad enable row level security;
alter table archive enable row level security;
alter table behavior_reminders enable row level security;
alter table trusted_devices enable row level security;

-- ponytail: solo uso personale, gate dispositivi nell'app (max 2 in trusted_devices)
create policy "app_access" on check_templates for all using (true) with check (true);
create policy "app_access" on check_logs for all using (true) with check (true);
create policy "app_access" on daily_state for all using (true) with check (true);
create policy "app_access" on tasks for all using (true) with check (true);
create policy "app_access" on notes for all using (true) with check (true);
create policy "app_access" on resources for all using (true) with check (true);
create policy "app_access" on scratchpad for all using (true) with check (true);
create policy "app_access" on archive for all using (true) with check (true);
create policy "app_access" on behavior_reminders for all using (true) with check (true);
create policy "devices_read" on trusted_devices for select using (true);
create policy "devices_insert" on trusted_devices for insert with check ((select count(*) from trusted_devices) < 2);
create policy "devices_delete" on trusted_devices for delete using (true);

-- seed templates (run once on fresh DB)
insert into check_templates (title, category, frequency_type, frequency_value, preferred_rule, sort_order)
select * from (values
  ('Drink water + sunlight', 'Morning', 'daily', null, null, 10),
  ('Dead hangs', 'Morning', 'daily', null, null, 20),
  ('Cardio', 'Body', 'daily', null, null, 30),
  ('Stretch', 'Body', 'daily', null, null, 40),
  ('Chin tucks + symmetry', 'Body', 'daily', null, null, 50),
  ('Supplements + creatine', 'Body', 'daily', null, null, 60),
  ('Relax breathing / mini-meditation', 'Body', 'daily', null, null, 70),
  ('Study', 'Mind', 'daily', null, null, 80),
  ('Duolingo', 'Mind', 'daily', null, null, 90),
  ('Book, 1 capitolo', 'Mind', 'daily', null, null, 100),
  ('Bibbia, 5 capitoli', 'Mind', 'daily', null, null, 110),
  ('Articolo Wikipedia', 'Mind', 'daily', null, null, 120),
  ('Newsletter', 'Mind', 'daily_except_sunday', null, null, 130),
  ('Track food', 'Evening', 'daily', null, null, 140),
  ('Head massage', 'Body', 'every_other_day', null, null, 150),
  ('Language Transfer Spanish', 'Mind', 'every_other_day', null, null, 160),
  ('Posture / balance exercises', 'Body', 'every_other_day', null, null, 170),
  ('Stare al muro (no scrittura a mano)', 'Body', 'conditional', null, 'no_handwriting', 180),
  ('Training', 'Body', 'times_per_week', 3, 'even_days_preferred', 190),
  ('Meditare (rest day)', 'Mind', 'conditional', null, 'rest_day', 200),
  ('Film / qualcosa (rest day)', 'Evening', 'conditional', null, 'rest_day', 210),
  ('Substack', 'Mind', 'times_per_week', 1, 'thursday_preferred', 220),
  ('Side project session', 'Mind', 'times_per_week', 1, null, 230),
  ('Volontariato', 'Mind', 'times_per_month', 1, null, 240)
) as v(title, category, frequency_type, frequency_value, preferred_rule, sort_order)
where not exists (select 1 from check_templates limit 1);

insert into behavior_reminders (body, sort_order)
select 'Per parlare meglio: evita le filler words, usa le pause.', 10
where not exists (select 1 from behavior_reminders limit 1);
