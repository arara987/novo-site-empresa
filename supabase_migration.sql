-- Belfort Engenharia - Supabase MVP
-- Project ref: anenzougmpqekaagmpxi
-- Execute no SQL Editor do Supabase.
-- Esta migração cria persistência para o site estático atual usando um snapshot JSONB do estado
-- e metadados de anexos enviados ao Supabase Storage.

create extension if not exists pgcrypto;

create table if not exists public.belfort_app_state (
  id text primary key default 'main',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.belfort_anexos (
  id uuid primary key default gen_random_uuid(),
  context text not null,
  owner_idx text,
  item_idx text,
  file_name text not null,
  file_path text not null,
  file_url text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create index if not exists belfort_anexos_context_idx on public.belfort_anexos (context);
create index if not exists belfort_anexos_lookup_idx on public.belfort_anexos (context, owner_idx, item_idx);

create or replace function public.set_belfort_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_belfort_app_state_updated_at on public.belfort_app_state;
create trigger trg_belfort_app_state_updated_at
before update on public.belfort_app_state
for each row execute function public.set_belfort_updated_at();

-- Bucket de anexos. O bucket fica público para o front-end estático conseguir abrir comprovantes/boletos.
-- Em produção com login, troque public para false e use políticas por usuário.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'belfort-anexos',
  'belfort-anexos',
  true,
  20971520,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Permissões para o front-end com anon key. Para uso público real, recomendo adicionar autenticação depois.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.belfort_app_state to anon, authenticated;
grant select, insert, update, delete on public.belfort_anexos to anon, authenticated;

alter table public.belfort_app_state enable row level security;
alter table public.belfort_anexos enable row level security;

drop policy if exists "belfort_app_state_select" on public.belfort_app_state;
drop policy if exists "belfort_app_state_insert" on public.belfort_app_state;
drop policy if exists "belfort_app_state_update" on public.belfort_app_state;
drop policy if exists "belfort_app_state_delete" on public.belfort_app_state;

create policy "belfort_app_state_select" on public.belfort_app_state for select to anon, authenticated using (true);
create policy "belfort_app_state_insert" on public.belfort_app_state for insert to anon, authenticated with check (true);
create policy "belfort_app_state_update" on public.belfort_app_state for update to anon, authenticated using (true) with check (true);
create policy "belfort_app_state_delete" on public.belfort_app_state for delete to anon, authenticated using (true);

drop policy if exists "belfort_anexos_select" on public.belfort_anexos;
drop policy if exists "belfort_anexos_insert" on public.belfort_anexos;
drop policy if exists "belfort_anexos_update" on public.belfort_anexos;
drop policy if exists "belfort_anexos_delete" on public.belfort_anexos;

create policy "belfort_anexos_select" on public.belfort_anexos for select to anon, authenticated using (true);
create policy "belfort_anexos_insert" on public.belfort_anexos for insert to anon, authenticated with check (true);
create policy "belfort_anexos_update" on public.belfort_anexos for update to anon, authenticated using (true) with check (true);
create policy "belfort_anexos_delete" on public.belfort_anexos for delete to anon, authenticated using (true);

-- Storage policies para o bucket belfort-anexos.
drop policy if exists "belfort_storage_select" on storage.objects;
drop policy if exists "belfort_storage_insert" on storage.objects;
drop policy if exists "belfort_storage_update" on storage.objects;
drop policy if exists "belfort_storage_delete" on storage.objects;

create policy "belfort_storage_select" on storage.objects
for select to anon, authenticated
using (bucket_id = 'belfort-anexos');

create policy "belfort_storage_insert" on storage.objects
for insert to anon, authenticated
with check (bucket_id = 'belfort-anexos');

create policy "belfort_storage_update" on storage.objects
for update to anon, authenticated
using (bucket_id = 'belfort-anexos')
with check (bucket_id = 'belfort-anexos');

create policy "belfort_storage_delete" on storage.objects
for delete to anon, authenticated
using (bucket_id = 'belfort-anexos');

insert into public.belfort_app_state (id, data)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;
