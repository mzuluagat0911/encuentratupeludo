-- Ubica tu Peludo — agregar categoría "rescatado"
-- Ejecuta en: Supabase → SQL Editor → Run

-- 1) Ampliar el check de report_type
alter table public.pet_reports
  drop constraint if exists pet_reports_report_type_check;

alter table public.pet_reports
  add constraint pet_reports_report_type_check
  check (report_type in ('perdido', 'encontrado', 'rescatado'));

-- 2) Permitir UPDATE (para reclasificar)
drop policy if exists "Actualización pública de reportes" on public.pet_reports;
create policy "Actualización pública de reportes"
  on public.pet_reports for update
  using (true)
  with check (true);

-- 3) Reclasificar los que ya dicen que aparecieron / están con dueño
update public.pet_reports
set report_type = 'rescatado'
where report_type <> 'rescatado'
  and description is not null
  and (
    description ~* 'ya\s+aparec'
    or description ~* 'con\s+su(s)?\s+due[nñ]o'
    or description ~* 'ya\s+(lo|la|los|las)\s+encontr'
    or description ~* 'recuperad[oa]s?'
    or description ~* 'ya\s+volv'
    or description ~* 'entregad[oa]'
    or description ~* 'ya\s+est[aá]n?\s+en\s+casa'
    or description ~* 'caso\s+cerrado'
    or description ~* 'reunid[oa]\s+con'
    or description ~* 'ya\s+tiene\s+(due[nñ]o|familia)'
  );
