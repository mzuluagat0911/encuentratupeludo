-- Ubica tu Peludo — agregar categoría "adopcion"
-- Ejecuta este SQL en: Supabase Dashboard → SQL Editor → New query

alter table public.pet_reports
  drop constraint if exists pet_reports_report_type_check;

alter table public.pet_reports
  add constraint pet_reports_report_type_check
  check (report_type in ('perdido', 'encontrado', 'rescatado', 'adopcion'));
