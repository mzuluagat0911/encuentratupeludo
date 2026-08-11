-- Mover a rescatado: Alta Leonora (Coliflor) + Conjunto la estación
-- y limpiar coincidencias exactas en perdidos

update public.pet_reports
set report_type = 'rescatado'
where report_type <> 'rescatado'
  and city = 'Manizales'
  and (
    neighborhood ilike '%Alta Leonora%'
    or neighborhood ilike '%Conjunto la estación%'
    or neighborhood ilike '%Conjunto la estacion%'
  );

-- Por descripción “acabamos de encontrar…”
update public.pet_reports
set report_type = 'rescatado'
where report_type <> 'rescatado'
  and description is not null
  and (
    description ~* 'acabamos\s+de\s+encontr'
    or description ~* 'acabo\s+de\s+encontr'
    or description ~* 'encontramos\s+a\s+'
    or description ~* 'encontr[eé]\s+a\s+'
  );

-- Perdidos con el mismo barrio+ciudad que un rescatado (coincidencia exacta)
update public.pet_reports p
set report_type = 'rescatado'
where p.report_type = 'perdido'
  and exists (
    select 1
    from public.pet_reports r
    where r.report_type = 'rescatado'
      and r.city = p.city
      and lower(trim(r.neighborhood)) = lower(trim(p.neighborhood))
  );

-- Perdido que mencione Coliflor
update public.pet_reports
set report_type = 'rescatado'
where report_type = 'perdido'
  and (
    description ilike '%Coliflor%'
    or neighborhood ilike '%Coliflor%'
  );
