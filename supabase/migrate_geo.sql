-- Coordenadas opcionales para “cerca de mí”.
-- Ejecuta en Supabase → SQL Editor.

alter table public.pet_reports
  add column if not exists lat double precision;

alter table public.pet_reports
  add column if not exists lng double precision;
