-- Añade fecha manual a las entradas del diario/wiki
alter table public.project_notes
  add column if not exists entry_date date;
