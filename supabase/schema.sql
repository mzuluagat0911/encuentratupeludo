-- Ubica tu Peludo — esquema Supabase
-- Ejecuta este SQL en: Supabase Dashboard → SQL Editor → New query

-- 1. Tabla de reportes
create table if not exists public.pet_reports (
  id uuid primary key default gen_random_uuid(),
  report_type text not null check (report_type in ('perdido', 'encontrado')),
  pet_type text not null check (pet_type in ('perro', 'gato')),
  photo_url text,
  city text not null,
  neighborhood text not null,
  phone text not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists pet_reports_created_at_idx
  on public.pet_reports (created_at desc);

create index if not exists pet_reports_city_idx
  on public.pet_reports (city);

create index if not exists pet_reports_type_idx
  on public.pet_reports (report_type, pet_type);

-- 2. Acceso público sin autenticación (lectura y escritura)
alter table public.pet_reports enable row level security;

drop policy if exists "Lectura pública de reportes" on public.pet_reports;
create policy "Lectura pública de reportes"
  on public.pet_reports for select
  using (true);

drop policy if exists "Creación pública de reportes" on public.pet_reports;
create policy "Creación pública de reportes"
  on public.pet_reports for insert
  with check (true);

-- 3. Bucket de fotos (público)
insert into storage.buckets (id, name, public)
values ('pet-photos', 'pet-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Lectura pública de fotos" on storage.objects;
create policy "Lectura pública de fotos"
  on storage.objects for select
  using (bucket_id = 'pet-photos');

drop policy if exists "Subida pública de fotos" on storage.objects;
create policy "Subida pública de fotos"
  on storage.objects for insert
  with check (bucket_id = 'pet-photos');
