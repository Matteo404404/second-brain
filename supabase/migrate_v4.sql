-- v4: rest-only habits, multi-log, topic, routine fix, seed personale

alter table habit_templates add column if not exists allow_multi boolean default false;
alter table notes add column if not exists kind text default 'text';
alter table notes add column if not exists topic text;
alter table resources add column if not exists kind text default 'link';
alter table resources add column if not exists topic text;

-- ponytail: allow multiple logs same habit same day (es. breathing x7)
alter table habit_logs drop constraint if exists habit_logs_template_id_log_date_key;
alter table habit_logs drop constraint if exists check_logs_template_id_log_date_key;

-- aggiorna routine (idempotente: disattiva vecchi titoli, reinserisci se mancano)
update habit_templates set active = false where title in (
  'Head massage', 'Posture / balance', 'Meditare', 'Film / qualcosa',
  'Volontariato', 'Relax breathing'
);

insert into habit_templates (title, section, frequency_type, frequency_value, preferred_rule, allow_multi, sort_order, active)
select * from (values
  ('Relax breathing (minimo)', 'Body', 'daily', null, null, true, 75, true),
  ('Training', 'Body', 'times_per_week', 3, null, false, 90, true),
  ('Stare al muro', 'Body', 'conditional', null, 'no_handwriting', false, 120, true),
  ('Massaggio testa', 'Rest', 'conditional', null, 'rest_only', true, 125, true),
  ('Posture / balance', 'Rest', 'conditional', null, 'rest_only', true, 130, true),
  ('Meditazione full', 'Rest', 'conditional', null, 'rest_only', true, 135, true),
  ('Film / serie', 'Rest', 'conditional', null, 'rest_only', false, 140, true),
  ('Volontariato', 'Monthly', 'times_per_month', 1, null, false, 230, true),
  ('Psicologo', 'Monthly', 'times_per_month', 1, null, false, 235, true)
) as v(title, section, frequency_type, frequency_value, preferred_rule, allow_multi, sort_order, active)
where not exists (select 1 from habit_templates h where h.title = v.title);

insert into behavior_reminders (body, sort_order)
select 'Psicologo: almeno 1 volta al mese.', 20
where not exists (select 1 from behavior_reminders where body like 'Psicologo%');

-- note personali
insert into notes (title, content, tag, kind, topic)
select * from (values
  ('Tatuaggio cicatrice', 'Voglio farmi un tatuaggio a forma di cicatrice', 'personal', 'text', 'idee'),
  ('Helix piercing', 'Helix piercing', 'personal', 'text', 'idee'),
  ('Sopracciglio', 'Taglio al sopracciglio', 'personal', 'text', 'idee'),
  ('Codice papà', 'Codice casa di papà: 2909', 'personal', 'text', 'casa'),
  ('Psicologo', 'Psicologo 1x al mese', 'personal', 'text', 'salute')
) as v(title, content, tag, kind, topic)
where not exists (select 1 from notes where title = 'Tatuaggio cicatrice');

-- resources
insert into resources (title, url, content, tag, kind, topic)
select * from (values
  ('F1 live', 'https://f1live.dpdns.org/stream', null, 'personal', 'link', 'streaming'),
  ('Getfoot live', 'https://getfoot.live/', null, 'personal', 'link', 'streaming'),
  ('Yarr ebooks', 'https://yarrlist.com/ebooks-list', null, 'personal', 'link', 'libri'),
  ('Osiris inschrijven', 'https://uvt.osiris-student.nl/inschrijven/cursus/zoek', null, 'uni', 'link', 'uni'),
  ('EUR pre-master', 'https://www.eur.nl/en/ese/education/master/pre-master-programmes/pre-master-econometrics-and-management-science', null, 'uni', 'link', 'uni'),
  ('LazyVim', 'https://github.com/joshuamorony/lazyvim/', null, 'personal', 'app', 'dev'),
  ('TiU electives email', null, 'registration TiU electives: jbds@tilburguniversity.edu', 'uni', 'text', 'uni'),
  ('Datachecker support', null, 'Support@datachecker.nl', 'work', 'text', 'lavoro')
) as v(title, url, content, tag, kind, topic)
where not exists (select 1 from resources where title = 'F1 live');

insert into resources (title, content, tag, kind, topic)
select * from (values
  ('Uomo che cammina', 'da leggere', 'personal', 'list', 'libri'),
  ('Planetes', 'da leggere', 'personal', 'list', 'libri'),
  ('Quartieri lontani', 'da leggere', 'personal', 'list', 'libri'),
  ('Corto Maltese', 'da leggere', 'personal', 'list', 'libri')
) as v(title, content, tag, kind, topic)
where not exists (select 1 from resources where title = 'Uomo che cammina');

insert into notes (title, content, tag, kind, topic)
select 'Prompt handover AI', 'Sei un assistant senior specializzato in project memory, notebook continuation, data science pipelines... (prompt completo per handover progetti)', 'work', 'work_prompt', 'lavoro'
where not exists (select 1 from notes where title = 'Prompt handover AI');
