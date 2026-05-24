# Belfort Supabase Login and Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase-backed login, user security code onboarding, database schema, RLS, triggers, and persistence for the Belfort Engenharia dashboard.

**Architecture:** Keep the current static HTML/CSS/JS app. Add small classic browser scripts for reusable auth/database helpers, then connect existing inline handlers to Supabase while preserving the current UI flow. The database uses Supabase Auth plus organization-scoped operational tables, RLS, triggers, and seed rows for default EPI/equipment inventory.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Supabase JS v2 via CDN, Supabase Postgres, RLS, PL/pgSQL triggers, Node built-in test runner for pure utility tests.

---

## File Structure

- Modify `index.html`
  - Add Supabase CDN script.
  - Add `belfort-auth-utils.js` and `belfort-supabase.js` scripts.
  - Add auth overlay markup before `.app`.
  - Add session bootstrap and persistence calls to existing event handlers.
- Modify `styles.css`
  - Add auth overlay/card/forms/code reveal styles matching the current Belfort visual language.
- Create `belfort-auth-utils.js`
  - Browser + Node-compatible pure utilities: security code generation, SHA-256 hashing, currency parsing, UUID validation.
- Create `belfort-supabase.js`
  - Browser-only Supabase client wrapper and CRUD functions.
- Create `tests/auth-utils.test.cjs`
  - Node tests for utility functions.
- Remote Supabase project `rjxnxfbblhfxxyfaawev`
  - Apply database migration with tables, functions, triggers, policies, grants, and default seed data.

---

## Task 1: Database schema, functions, triggers, RLS

**Files:**
- Remote migration only: Supabase project `rjxnxfbblhfxxyfaawev`

- [ ] **Step 1: Confirm the current database is empty enough for initial schema**

Run MCP `list_tables` for schema `public`.

Expected: either no tables, or only tables that do not conflict with the names below.

- [ ] **Step 2: Apply migration SQL**

Run MCP `apply_migration` named `belfort_initial_login_operational_schema` with this SQL:

```sql
create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  full_name text not null,
  email text not null,
  recovery_password_hash text,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.security_codes (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  code_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  nome text not null,
  documento_tipo text not null check (documento_tipo in ('CPF', 'CNPJ')),
  documento_numero text not null,
  telefone text,
  email text,
  endereco_cep text,
  endereco_logradouro text,
  endereco_numero text,
  endereco_complemento text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_uf text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, documento_tipo, documento_numero)
);

create table if not exists public.obras (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  descricao text not null,
  data_inicio date not null,
  data_termino date not null,
  valor numeric(14,2) not null default 0,
  endereco_cep text,
  endereco_logradouro text,
  endereco_numero text,
  endereco_complemento text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_uf text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.obra_pagamentos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  tipo text not null check (tipo in ('vista', 'parcelado')),
  valor_pago numeric(14,2),
  data_pagamento date,
  entrada numeric(14,2),
  valor_parcela numeric(14,2),
  quantidade_parcelas integer check (quantidade_parcelas is null or quantidade_parcelas > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (obra_id)
);

create table if not exists public.obra_pagamento_parcelas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  pagamento_id uuid not null references public.obra_pagamentos(id) on delete cascade,
  numero integer not null,
  vencimento date,
  valor numeric(14,2) not null default 0,
  status text not null default 'pendente' check (status in ('pendente', 'pago')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pagamento_id, numero)
);

create table if not exists public.cliente_art_pagamentos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  valor_acordado numeric(14,2) not null default 0,
  tipo text check (tipo in ('vista', 'parcelado')),
  valor_pago numeric(14,2),
  data_pagamento date,
  entrada numeric(14,2),
  valor_parcela numeric(14,2),
  quantidade_parcelas integer check (quantidade_parcelas is null or quantidade_parcelas > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cliente_id)
);

create table if not exists public.cliente_art_parcelas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  art_pagamento_id uuid not null references public.cliente_art_pagamentos(id) on delete cascade,
  numero integer not null,
  vencimento date,
  valor numeric(14,2) not null default 0,
  status text not null default 'pendente' check (status in ('pendente', 'pago')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (art_pagamento_id, numero)
);

create table if not exists public.profissionais (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  nome text not null,
  profissao text,
  documento text,
  telefone text,
  email text,
  endereco text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profissional_treinamentos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profissional_id uuid not null references public.profissionais(id) on delete cascade,
  nome text not null,
  tipo text,
  data_treinamento date,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.obra_documentos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  obra_id uuid references public.obras(id) on delete cascade,
  nome text not null,
  status text not null default 'pendente' check (status in ('pendente', 'concluido')),
  checked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documento_anexos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  obra_documento_id uuid references public.obra_documentos(id) on delete cascade,
  file_name text not null,
  file_size bigint,
  mime_type text,
  storage_path text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cnd_mensal (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  ano integer not null,
  mes integer not null check (mes between 1 and 12),
  valor_pago numeric(14,2) not null default 0,
  status text not null default 'pendente' check (status in ('pendente', 'pago')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, ano, mes)
);

create table if not exists public.epi_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  nome text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, lower(nome))
);

create table if not exists public.epi_estoque (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  epi_item_id uuid not null references public.epi_items(id) on delete cascade,
  total integer not null default 0 check (total >= 0),
  em_uso integer not null default 0 check (em_uso >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (epi_item_id),
  check (em_uso <= total)
);

create table if not exists public.equipamentos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  nome text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, lower(nome))
);

create table if not exists public.equipamento_estoque (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  equipamento_id uuid not null references public.equipamentos(id) on delete cascade,
  total integer not null default 0 check (total >= 0),
  em_uso integer not null default 0 check (em_uso >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (equipamento_id),
  check (em_uso <= total)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  tag text not null,
  description text not null,
  target_page text,
  target_selector text,
  unread boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  table_name text,
  row_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.is_org_member(check_org_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = check_org_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  );
$$;

create or replace function private.current_org_id()
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select om.organization_id
  from public.organization_members om
  where om.user_id = auth.uid()
    and om.status = 'active'
  order by om.created_at asc
  limit 1;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  org_id uuid;
  user_name text;
begin
  insert into public.organizations (name, slug)
  values ('Belfort Engenharia', 'belfort-engenharia')
  on conflict (slug) do update set name = excluded.name
  returning id into org_id;

  user_name := coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1), 'Usuário');

  insert into public.profiles (id, organization_id, full_name, email, recovery_password_hash)
  values (new.id, org_id, user_name, coalesce(new.email, ''), new.raw_user_meta_data ->> 'recovery_password_hash')
  on conflict (id) do update set
    organization_id = excluded.organization_id,
    full_name = excluded.full_name,
    email = excluded.email,
    recovery_password_hash = excluded.recovery_password_hash,
    updated_at = now();

  insert into public.organization_members (organization_id, user_id, role, status)
  values (
    org_id,
    new.id,
    case when not exists (select 1 from public.organization_members where organization_id = org_id) then 'admin' else 'member' end,
    'active'
  )
  on conflict (organization_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_security_code_hash(input_hash text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if input_hash is null or length(input_hash) <> 64 then
    raise exception 'invalid security code hash';
  end if;

  select organization_id into org_id from public.profiles where id = auth.uid();
  if org_id is null then
    raise exception 'profile not found';
  end if;

  insert into public.security_codes (user_id, code_hash)
  values (auth.uid(), input_hash)
  on conflict (user_id) do update set code_hash = excluded.code_hash, updated_at = now();
end;
$$;

create or replace function private.seed_org_defaults()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  epi_names text[] := array['Capacete de segurança','Luva de segurança','Óculos de proteção','Protetor auricular','Máscara PFF2','Cinto de segurança','Bota de segurança','Uniforme de brim','Capa de chuva','Máscara respiratória','Protetor facial','Calçado de segurança'];
  epi_totals int[] := array[32,85,50,100,200,25,60,80,30,40,35,45];
  epi_usage int[] := array[20,60,35,70,150,18,45,55,20,25,22,30];
  equip_names text[] := array['Furadeira','Betoneira','Andaime','Marreta','Cimento','Serra Circular'];
  equip_totals int[] := array[10,5,20,15,100,8];
  equip_usage int[] := array[6,3,15,10,0,5];
  item_id uuid;
  i int;
begin
  for i in 1..array_length(epi_names, 1) loop
    insert into public.epi_items (organization_id, nome)
    values (new.id, epi_names[i])
    on conflict do nothing;

    select id into item_id from public.epi_items where organization_id = new.id and lower(nome) = lower(epi_names[i]);

    insert into public.epi_estoque (organization_id, epi_item_id, total, em_uso)
    values (new.id, item_id, epi_totals[i], epi_usage[i])
    on conflict (epi_item_id) do nothing;
  end loop;

  for i in 1..array_length(equip_names, 1) loop
    insert into public.equipamentos (organization_id, nome)
    values (new.id, equip_names[i])
    on conflict do nothing;

    select id into item_id from public.equipamentos where organization_id = new.id and lower(nome) = lower(equip_names[i]);

    insert into public.equipamento_estoque (organization_id, equipamento_id, total, em_uso)
    values (new.id, item_id, equip_totals[i], equip_usage[i])
    on conflict (equipamento_id) do nothing;
  end loop;

  return new;
end;
$$;

drop trigger if exists seed_org_defaults_after_insert on public.organizations;
create trigger seed_org_defaults_after_insert
after insert on public.organizations
for each row execute procedure private.seed_org_defaults();

insert into public.organizations (name, slug)
values ('Belfort Engenharia', 'belfort-engenharia')
on conflict (slug) do update set name = excluded.name;

create index if not exists idx_profiles_org on public.profiles(organization_id);
create index if not exists idx_members_user on public.organization_members(user_id);
create index if not exists idx_clientes_org on public.clientes(organization_id);
create index if not exists idx_obras_org_cliente on public.obras(organization_id, cliente_id);
create index if not exists idx_profissionais_org on public.profissionais(organization_id);
create index if not exists idx_notifications_org_user on public.notifications(organization_id, user_id, unread);
create index if not exists idx_audit_logs_org_created on public.audit_logs(organization_id, created_at desc);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.security_codes enable row level security;
alter table public.clientes enable row level security;
alter table public.obras enable row level security;
alter table public.obra_pagamentos enable row level security;
alter table public.obra_pagamento_parcelas enable row level security;
alter table public.cliente_art_pagamentos enable row level security;
alter table public.cliente_art_parcelas enable row level security;
alter table public.profissionais enable row level security;
alter table public.profissional_treinamentos enable row level security;
alter table public.obra_documentos enable row level security;
alter table public.documento_anexos enable row level security;
alter table public.cnd_mensal enable row level security;
alter table public.epi_items enable row level security;
alter table public.epi_estoque enable row level security;
alter table public.equipamentos enable row level security;
alter table public.equipamento_estoque enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "members select organizations" on public.organizations for select to authenticated using (private.is_org_member(id));
create policy "users select own profile or org profiles" on public.profiles for select to authenticated using (id = auth.uid() or private.is_org_member(organization_id));
create policy "users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "members select organization_members" on public.organization_members for select to authenticated using (private.is_org_member(organization_id));
create policy "users manage own security code" on public.security_codes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "members manage clientes" on public.clientes for all to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy "members manage obras" on public.obras for all to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy "members manage obra_pagamentos" on public.obra_pagamentos for all to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy "members manage obra_pagamento_parcelas" on public.obra_pagamento_parcelas for all to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy "members manage cliente_art_pagamentos" on public.cliente_art_pagamentos for all to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy "members manage cliente_art_parcelas" on public.cliente_art_parcelas for all to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy "members manage profissionais" on public.profissionais for all to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy "members manage profissional_treinamentos" on public.profissional_treinamentos for all to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy "members manage obra_documentos" on public.obra_documentos for all to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy "members manage documento_anexos" on public.documento_anexos for all to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy "members manage cnd_mensal" on public.cnd_mensal for all to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy "members manage epi_items" on public.epi_items for all to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy "members manage epi_estoque" on public.epi_estoque for all to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy "members manage equipamentos" on public.equipamentos for all to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy "members manage equipamento_estoque" on public.equipamento_estoque for all to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy "members manage notifications" on public.notifications for all to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id));
create policy "members insert audit_logs" on public.audit_logs for insert to authenticated with check (organization_id is null or private.is_org_member(organization_id));
create policy "members select audit_logs" on public.audit_logs for select to authenticated using (organization_id is null or private.is_org_member(organization_id));

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'organizations','profiles','organization_members','security_codes','clientes','obras','obra_pagamentos','obra_pagamento_parcelas','cliente_art_pagamentos','cliente_art_parcelas','profissionais','profissional_treinamentos','obra_documentos','documento_anexos','cnd_mensal','epi_items','epi_estoque','equipamentos','equipamento_estoque','notifications'
  ] loop
    execute format('drop trigger if exists set_updated_at_before_update on public.%I', tbl);
    execute format('create trigger set_updated_at_before_update before update on public.%I for each row execute procedure private.set_updated_at()', tbl);
  end loop;
end $$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.set_security_code_hash(text) to authenticated;
```

- [ ] **Step 3: Verify schema exists**

Run MCP `list_tables` for schema `public` with `verbose: false`.

Expected: 21 tables including `profiles`, `security_codes`, `clientes`, `obras`, `epi_items`, and `equipamentos`.

- [ ] **Step 4: Verify functions and seed data**

Run MCP `execute_sql`:

```sql
select slug from public.organizations where slug = 'belfort-engenharia';
select count(*) as epi_count from public.epi_items;
select count(*) as equipamento_count from public.equipamentos;
```

Expected: one organization row, `epi_count = 12`, `equipamento_count = 6`.

---

## Task 2: Utility tests and pure auth helpers

**Files:**
- Create: `belfort-auth-utils.js`
- Create: `tests/auth-utils.test.cjs`

- [ ] **Step 1: Write failing tests**

Create `tests/auth-utils.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const utils = require('../belfort-auth-utils.js');

test('generateSecurityCode returns a mixed 18-character code', () => {
  const code = utils.generateSecurityCode(() => 0.75);
  assert.equal(code.length, 18);
  assert.match(code, /[a-z]/);
  assert.match(code, /[A-Z]/);
  assert.match(code, /[0-9]/);
  assert.equal(utils.isStrongSecurityCode(code), true);
});

test('sha256Hex returns deterministic SHA-256 hex', async () => {
  const expected = crypto.createHash('sha256').update('Belfort123').digest('hex');
  assert.equal(await utils.sha256Hex('Belfort123'), expected);
});

test('parseCurrencyValue converts Brazilian currency text to number', () => {
  assert.equal(utils.parseCurrencyValue('R$ 1.234,56'), 1234.56);
  assert.equal(utils.parseCurrencyValue('2500'), 2500);
  assert.equal(utils.parseCurrencyValue(''), 0);
});

test('splitClienteDocumento extracts document type and digits', () => {
  assert.deepEqual(utils.splitClienteDocumento('CPF: 123.456.789-00'), {
    tipo: 'CPF',
    numero: '12345678900'
  });
  assert.deepEqual(utils.splitClienteDocumento('CNPJ: 12.345.678/0001-99'), {
    tipo: 'CNPJ',
    numero: '12345678000199'
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
node --test tests/auth-utils.test.cjs
```

Expected: FAIL with module not found for `../belfort-auth-utils.js`.

- [ ] **Step 3: Implement minimal utility module**

Create `belfort-auth-utils.js`:

```js
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BelfortAuthUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  const LOWER = 'abcdefghijkmnopqrstuvwxyz';
  const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const DIGITS = '23456789';
  const ALL = LOWER + UPPER + DIGITS;

  function pick(chars, randomFn) {
    return chars[Math.floor(randomFn() * chars.length) % chars.length];
  }

  function secureRandom() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] / 4294967296;
    }
    return Math.random();
  }

  function generateSecurityCode(randomFn) {
    const random = randomFn || secureRandom;
    const chars = [pick(LOWER, random), pick(UPPER, random), pick(DIGITS, random)];
    while (chars.length < 18) chars.push(pick(ALL, random));
    for (let i = chars.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      const tmp = chars[i];
      chars[i] = chars[j];
      chars[j] = tmp;
    }
    return chars.join('');
  }

  function isStrongSecurityCode(code) {
    return typeof code === 'string'
      && code.length >= 18
      && /[a-z]/.test(code)
      && /[A-Z]/.test(code)
      && /[0-9]/.test(code);
  }

  async function sha256Hex(value) {
    const text = String(value || '');
    if (typeof require === 'function') {
      try {
        return require('node:crypto').createHash('sha256').update(text).digest('hex');
      } catch (error) {}
    }
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function parseCurrencyValue(value) {
    const text = String(value || '').trim();
    if (!text) return 0;
    const normalized = text
      .replace(/R\$\s?/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^0-9.\-]/g, '');
    return Number.parseFloat(normalized) || 0;
  }

  function splitClienteDocumento(value) {
    const text = String(value || '');
    const tipo = text.toUpperCase().includes('CNPJ') ? 'CNPJ' : 'CPF';
    return { tipo, numero: text.replace(/\D/g, '') };
  }

  function normalizeDate(value) {
    return value || null;
  }

  return {
    generateSecurityCode,
    isStrongSecurityCode,
    sha256Hex,
    parseCurrencyValue,
    splitClienteDocumento,
    normalizeDate
  };
});
```

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
node --test tests/auth-utils.test.cjs
```

Expected: PASS for 4 tests.

---

## Task 3: Supabase browser bridge

**Files:**
- Create: `belfort-supabase.js`

- [ ] **Step 1: Create browser service**

Create `belfort-supabase.js` with these responsibilities:

```js
(function (root) {
  const SUPABASE_URL = 'https://rjxnxfbblhfxxyfaawev.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_MRO0L1EaLAKrJa4BELfXwg_-1EXImj4';

  function requireClient() {
    if (!root.supabase || !root.supabase.createClient) {
      throw new Error('Cliente Supabase não foi carregado.');
    }
    return root.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
  }

  const client = requireClient();

  function getProfileOrg(profile) {
    if (!profile || !profile.organization_id) throw new Error('Perfil sem organização vinculada.');
    return profile.organization_id;
  }

  async function getSession() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function getProfile() {
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) return null;
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();
    if (error) throw error;
    return data;
  }

  async function signUpWithSecurityCode({ fullName, email, recoveryPassword, securityCode }) {
    const recoveryHash = await root.BelfortAuthUtils.sha256Hex(recoveryPassword);
    const { data, error } = await client.auth.signUp({
      email,
      password: securityCode,
      options: { data: { full_name: fullName, recovery_password_hash: recoveryHash } }
    });
    if (error) throw error;

    if (data.session) {
      const codeHash = await root.BelfortAuthUtils.sha256Hex(securityCode);
      const { error: codeError } = await client.rpc('set_security_code_hash', { input_hash: codeHash });
      if (codeError) throw codeError;
    }

    return data;
  }

  async function saveSecurityCodeForCurrentUser(securityCode) {
    const codeHash = await root.BelfortAuthUtils.sha256Hex(securityCode);
    const { error } = await client.rpc('set_security_code_hash', { input_hash: codeHash });
    if (error) throw error;
  }

  async function signInWithSecurityCode({ email, securityCode }) {
    const { data, error } = await client.auth.signInWithPassword({ email, password: securityCode });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }

  async function loadDashboardData(profile) {
    const organizationId = getProfileOrg(profile);
    const [clientesRes, obrasRes, epiRes, equipRes, profissionaisRes, cndRes, notificationsRes] = await Promise.all([
      client.from('clientes').select('*').eq('organization_id', organizationId).order('created_at'),
      client.from('obras').select('*').eq('organization_id', organizationId).order('created_at'),
      client.from('epi_items').select('*, epi_estoque(*)').eq('organization_id', organizationId).order('created_at'),
      client.from('equipamentos').select('*, equipamento_estoque(*)').eq('organization_id', organizationId).order('created_at'),
      client.from('profissionais').select('*, profissional_treinamentos(*)').eq('organization_id', organizationId).order('created_at'),
      client.from('cnd_mensal').select('*').eq('organization_id', organizationId).order('ano').order('mes'),
      client.from('notifications').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(50)
    ]);

    for (const res of [clientesRes, obrasRes, epiRes, equipRes, profissionaisRes, cndRes, notificationsRes]) {
      if (res.error) throw res.error;
    }

    return {
      clientes: clientesRes.data,
      obras: obrasRes.data,
      epis: epiRes.data,
      equipamentos: equipRes.data,
      profissionais: profissionaisRes.data,
      cnd: cndRes.data,
      notifications: notificationsRes.data
    };
  }

  async function insertCliente(profile, cliente) {
    const organizationId = getProfileOrg(profile);
    const doc = root.BelfortAuthUtils.splitClienteDocumento(cliente.documento);
    const endereco = typeof cliente.endereco === 'object' ? cliente.endereco : {};
    const { data, error } = await client.from('clientes').insert({
      organization_id: organizationId,
      created_by: profile.id,
      nome: cliente.nome,
      documento_tipo: doc.tipo,
      documento_numero: doc.numero,
      telefone: cliente.telefone,
      email: cliente.email,
      endereco_cep: endereco.cep || null,
      endereco_logradouro: endereco.logradouro || null,
      endereco_numero: endereco.numero || null,
      endereco_complemento: endereco.complemento || null,
      endereco_bairro: endereco.bairro || null,
      endereco_cidade: endereco.cidade || null,
      endereco_uf: endereco.uf || null
    }).select('*').single();
    if (error) throw error;
    return data;
  }

  async function insertObra(profile, obra, clienteId) {
    const organizationId = getProfileOrg(profile);
    const endereco = obra.endereco || {};
    const { data, error } = await client.from('obras').insert({
      organization_id: organizationId,
      cliente_id: clienteId,
      created_by: profile.id,
      descricao: obra.descricao,
      data_inicio: obra.dataInicio,
      data_termino: obra.dataTermino,
      valor: root.BelfortAuthUtils.parseCurrencyValue(obra.valor),
      endereco_cep: endereco.cep || null,
      endereco_logradouro: endereco.logradouro || null,
      endereco_numero: endereco.numero || null,
      endereco_complemento: endereco.complemento || null,
      endereco_bairro: endereco.bairro || null,
      endereco_cidade: endereco.cidade || null,
      endereco_uf: endereco.uf || null
    }).select('*').single();
    if (error) throw error;
    return data;
  }

  async function insertNotification(profile, notification) {
    const organizationId = getProfileOrg(profile);
    const { data, error } = await client.from('notifications').insert({
      organization_id: organizationId,
      user_id: profile.id,
      tag: notification.tag,
      description: notification.description,
      target_page: notification.targetPage,
      target_selector: notification.targetSelector,
      unread: notification.unread !== false
    }).select('*').single();
    if (error) throw error;
    return data;
  }

  async function upsertCnd(profile, ano, mes, valorPago) {
    const organizationId = getProfileOrg(profile);
    const { data, error } = await client.from('cnd_mensal').upsert({
      organization_id: organizationId,
      ano,
      mes,
      valor_pago: valorPago,
      status: valorPago > 0 ? 'pago' : 'pendente'
    }, { onConflict: 'organization_id,ano,mes' }).select('*').single();
    if (error) throw error;
    return data;
  }

  root.BelfortSupabase = {
    client,
    getSession,
    getProfile,
    signUpWithSecurityCode,
    saveSecurityCodeForCurrentUser,
    signInWithSecurityCode,
    signOut,
    loadDashboardData,
    insertCliente,
    insertObra,
    insertNotification,
    upsertCnd
  };
})(window);
```

- [ ] **Step 2: Syntax check**

Run:

```bash
node --check belfort-supabase.js
```

Expected: no output and exit code 0.

---

## Task 4: Auth UI markup and styles

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

- [ ] **Step 1: Add scripts and auth overlay markup**

In `index.html`, before the existing inline `<script>`, add:

```html
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="belfort-auth-utils.js"></script>
  <script src="belfort-supabase.js"></script>
```

Immediately after `<body>`, add:

```html
  <section class="auth-shell" id="auth-shell">
    <div class="auth-card">
      <div class="auth-brand">
        <div class="auth-mark">BE</div>
        <div>
          <strong>BELFORT</strong>
          <span>ACESSO SEGURO</span>
        </div>
      </div>

      <form class="auth-panel active" id="auth-login-panel">
        <p class="auth-kicker">Entrar no painel</p>
        <h1>Acesso restrito</h1>
        <p class="auth-copy">Informe seu email e o código único de segurança.</p>
        <div class="field"><label class="field-label">Usuário / Email</label><input class="field-input" id="auth-login-email" type="email" autocomplete="email" required></div>
        <div class="field"><label class="field-label">Código único de segurança</label><input class="field-input" id="auth-login-code" type="password" autocomplete="current-password" required></div>
        <button class="btn-primary auth-submit" type="submit">Entrar</button>
        <div class="auth-links"><button type="button" data-auth-mode="register">Cadastrar</button><button type="button" data-auth-mode="recover">Esqueceu senha ou código de segurança?</button></div>
      </form>

      <form class="auth-panel" id="auth-register-panel">
        <p class="auth-kicker">Criar usuário</p>
        <h1>Cadastro</h1>
        <p class="auth-copy">Cadastre seus dados. Depois será gerado seu código único de segurança.</p>
        <div class="field"><label class="field-label">Nome</label><input class="field-input" id="auth-register-name" type="text" autocomplete="name" required></div>
        <div class="field"><label class="field-label">Email</label><input class="field-input" id="auth-register-email" type="email" autocomplete="email" required></div>
        <div class="field"><label class="field-label">Senha de recuperação</label><input class="field-input" id="auth-register-password" type="password" autocomplete="new-password" minlength="6" required></div>
        <button class="btn-primary auth-submit" type="submit">Cadastrar</button>
        <div class="auth-links"><button type="button" data-auth-mode="login">Entrar</button><button type="button" data-auth-mode="recover">Esqueceu senha ou código de segurança?</button></div>
      </form>

      <div class="auth-panel" id="auth-code-panel">
        <p class="auth-kicker">Código gerado</p>
        <h1>Guarde seu código</h1>
        <p class="auth-copy">Esse código será usado para entrar no painel e não será exibido novamente.</p>
        <div class="security-code-box" id="auth-generated-code"></div>
        <button class="btn-primary auth-submit" id="auth-copy-code" type="button">Copiar código</button>
        <button class="btn-ghost auth-submit" data-auth-mode="login" type="button">Ir para entrada</button>
      </div>

      <div class="auth-panel" id="auth-recover-panel">
        <p class="auth-kicker">Recuperação</p>
        <h1>Recuperar acesso</h1>
        <p class="auth-copy">Para manter a segurança, solicite ao administrador a geração de um novo código de segurança.</p>
        <button class="btn-ghost auth-submit" data-auth-mode="login" type="button">Voltar para entrada</button>
      </div>

      <div class="auth-message" id="auth-message" role="status"></div>
    </div>
  </section>
```

- [ ] **Step 2: Add matching styles**

Append to `styles.css`:

```css
.auth-shell {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at 18% 20%, rgba(224,112,32,0.2), transparent 28%),
    radial-gradient(circle at 82% 12%, rgba(83,167,162,0.22), transparent 30%),
    linear-gradient(135deg, var(--g950), var(--g900) 48%, var(--g800));
}
.auth-shell.hidden { display: none; }
.auth-card {
  width: min(460px, 100%);
  border: 1px solid var(--border-mid);
  border-radius: var(--r-xl);
  background: linear-gradient(180deg, rgba(0,53,51,0.96), rgba(0,43,41,0.98));
  box-shadow: var(--shadow-lg);
  padding: 30px;
  position: relative;
  overflow: hidden;
}
body.light-theme .auth-card { background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(238,246,245,0.98)); }
.auth-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  background: linear-gradient(90deg, var(--o500), var(--g300));
}
.auth-brand { display: flex; align-items: center; gap: 14px; margin-bottom: 26px; }
.auth-mark {
  width: 46px; height: 46px; border-radius: 14px; display: grid; place-items: center;
  font-family: var(--font-display); font-weight: 800; color: white;
  background: linear-gradient(135deg, var(--o500), var(--g400));
  box-shadow: 0 12px 28px rgba(0,0,0,0.28);
}
.auth-brand strong { display: block; font-family: var(--font-display); color: var(--txt-bright); letter-spacing: 0.08em; }
.auth-brand span { display: block; font-size: 11px; color: var(--txt-muted); letter-spacing: 0.18em; }
.auth-panel { display: none; }
.auth-panel.active { display: block; animation: authPanelIn 0.28s ease both; }
@keyframes authPanelIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.auth-kicker { color: var(--o400); font-size: 12px; text-transform: uppercase; letter-spacing: 0.16em; font-weight: 700; margin-bottom: 8px; }
.auth-panel h1 { font-family: var(--font-display); color: var(--txt-bright); font-size: 38px; line-height: 0.95; margin-bottom: 10px; }
.auth-copy { color: var(--txt-muted); line-height: 1.45; margin-bottom: 20px; }
.auth-submit { width: 100%; justify-content: center; margin-top: 10px; }
.auth-links { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 18px; }
.auth-links button { color: var(--txt-main); font-size: 13px; text-decoration: underline; text-underline-offset: 4px; }
.auth-links button:hover { color: var(--o400); }
.security-code-box {
  border: 1px dashed var(--o400); border-radius: var(--r-lg); padding: 18px;
  background: rgba(224,112,32,0.08); color: var(--txt-bright);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 22px; letter-spacing: 0.08em; text-align: center; user-select: all;
}
.auth-message { min-height: 20px; margin-top: 16px; color: var(--txt-muted); text-align: center; font-size: 13px; }
.auth-message.error { color: #e05858; }
.auth-message.success { color: #2ecc71; }
```

- [ ] **Step 3: Manual visual check**

Open `index.html` in a browser.

Expected: login overlay appears before the dashboard; buttons switch panels without changing the page.

---

## Task 5: Auth behavior wiring

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add auth bootstrap inside existing inline script**

At the start of the existing inline script, after `const pages = ...` or before app initialization, add functions:

```js
    let currentProfile = null;
    let dashboardDataLoaded = false;

    function setAuthMessage(message, type = '') {
      const el = document.getElementById('auth-message');
      el.textContent = message || '';
      el.className = 'auth-message' + (type ? ' ' + type : '');
    }

    function showAuthPanel(mode) {
      document.querySelectorAll('.auth-panel').forEach(panel => panel.classList.remove('active'));
      document.getElementById('auth-' + mode + '-panel').classList.add('active');
      setAuthMessage('');
    }

    function showDashboard() {
      document.getElementById('auth-shell').classList.add('hidden');
    }

    function showAuth() {
      document.getElementById('auth-shell').classList.remove('hidden');
    }

    async function bootAuth() {
      try {
        const session = await window.BelfortSupabase.getSession();
        if (!session) {
          showAuth();
          showAuthPanel('login');
          return;
        }
        currentProfile = await window.BelfortSupabase.getProfile();
        await loadDataFromSupabase();
        showDashboard();
      } catch (error) {
        showAuth();
        showAuthPanel('login');
        setAuthMessage(error.message || 'Não foi possível validar sua sessão.', 'error');
      }
    }
```

- [ ] **Step 2: Add auth event handlers**

Add:

```js
    document.querySelectorAll('[data-auth-mode]').forEach(button => {
      button.addEventListener('click', () => showAuthPanel(button.dataset.authMode));
    });

    document.getElementById('auth-register-panel').addEventListener('submit', async event => {
      event.preventDefault();
      const fullName = document.getElementById('auth-register-name').value.trim();
      const email = document.getElementById('auth-register-email').value.trim();
      const recoveryPassword = document.getElementById('auth-register-password').value;
      const securityCode = window.BelfortAuthUtils.generateSecurityCode();
      if (!fullName || !email || recoveryPassword.length < 6) {
        setAuthMessage('Preencha nome, email e senha com pelo menos 6 caracteres.', 'error');
        return;
      }
      try {
        setAuthMessage('Criando usuário...', '');
        const data = await window.BelfortSupabase.signUpWithSecurityCode({ fullName, email, recoveryPassword, securityCode });
        document.getElementById('auth-generated-code').textContent = securityCode;
        showAuthPanel('code');
        if (!data.session) setAuthMessage('Código gerado. Se o Supabase pedir confirmação, confirme seu email antes de entrar.', 'success');
      } catch (error) {
        setAuthMessage(error.message || 'Erro ao cadastrar usuário.', 'error');
      }
    });

    document.getElementById('auth-login-panel').addEventListener('submit', async event => {
      event.preventDefault();
      const email = document.getElementById('auth-login-email').value.trim();
      const securityCode = document.getElementById('auth-login-code').value.trim();
      try {
        setAuthMessage('Entrando...', '');
        await window.BelfortSupabase.signInWithSecurityCode({ email, securityCode });
        currentProfile = await window.BelfortSupabase.getProfile();
        await window.BelfortSupabase.saveSecurityCodeForCurrentUser(securityCode);
        await loadDataFromSupabase();
        showDashboard();
      } catch (error) {
        setAuthMessage('Usuário ou código de segurança inválido.', 'error');
      }
    });

    document.getElementById('auth-copy-code').addEventListener('click', async () => {
      const code = document.getElementById('auth-generated-code').textContent.trim();
      await navigator.clipboard.writeText(code);
      setAuthMessage('Código copiado.', 'success');
    });

    bootAuth();
```

- [ ] **Step 3: Syntax check HTML script extraction**

Run:

```bash
python - <<'PY'
from pathlib import Path
import re
html = Path('index.html').read_text(encoding='utf-8')
for i, block in enumerate(re.findall(r'<script>([\s\S]*?)</script>', html), 1):
    Path(f'tests/extracted-script-{i}.js').write_text(block, encoding='utf-8')
PY
node --check tests/extracted-script-1.js
```

Expected: no syntax errors.

---

## Task 6: Load Supabase data into current state

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add mapping helpers**

Add after `const state = ...`:

```js
    function mapDbCliente(row) {
      return {
        id: row.id,
        nome: row.nome,
        documento: `${row.documento_tipo}: ${row.documento_numero}`,
        telefone: row.telefone || '',
        email: row.email || '',
        endereco: {
          cep: row.endereco_cep || '', logradouro: row.endereco_logradouro || '', numero: row.endereco_numero || '',
          complemento: row.endereco_complemento || '', bairro: row.endereco_bairro || '', cidade: row.endereco_cidade || '', uf: row.endereco_uf || ''
        }
      };
    }

    function mapDbObra(row, clientes) {
      const clienteIndex = clientes.findIndex(cliente => cliente.id === row.cliente_id);
      return {
        id: row.id,
        descricao: row.descricao,
        dataInicio: row.data_inicio,
        dataTermino: row.data_termino,
        valor: `R$ ${Number(row.valor || 0).toFixed(2).replace('.', ',')}`,
        endereco: {
          cep: row.endereco_cep || '', logradouro: row.endereco_logradouro || '', numero: row.endereco_numero || '',
          complemento: row.endereco_complemento || '', bairro: row.endereco_bairro || '', cidade: row.endereco_cidade || '', uf: row.endereco_uf || ''
        },
        clienteIndex,
        clienteId: row.cliente_id,
        clienteNome: clientes[clienteIndex]?.nome || 'Cliente'
      };
    }

    function mapDbStock(row, relationName) {
      const stock = row[relationName] && row[relationName][0] ? row[relationName][0] : {};
      return { id: row.id, nome: row.nome, total: stock.total || 0, emUso: stock.em_uso || 0 };
    }
```

- [ ] **Step 2: Add `loadDataFromSupabase`**

Add:

```js
    async function loadDataFromSupabase() {
      if (!currentProfile) return;
      const data = await window.BelfortSupabase.loadDashboardData(currentProfile);
      state.clientes = data.clientes.map(mapDbCliente);
      state.obras = data.obras.map(row => mapDbObra(row, state.clientes));
      state.estoqueEpis = data.epis.map(row => mapDbStock(row, 'epi_estoque'));
      state.equipamentos = data.equipamentos.map(row => mapDbStock(row, 'equipamento_estoque'));
      state.profissionais = data.profissionais.map(row => ({
        id: row.id,
        nome: row.nome,
        profissao: row.profissao || '',
        documento: row.documento || '',
        telefone: row.telefone || '',
        email: row.email || '',
        endereco: row.endereco || '',
        observacoes: row.observacoes || '',
        treinamentos: (row.profissional_treinamentos || []).map(t => ({ nome: t.nome, tipo: t.tipo, data: t.data_treinamento, observacoes: t.observacoes }))
      }));
      state.notifications = data.notifications.map(row => ({
        id: row.id,
        tag: row.tag,
        description: row.description,
        time: new Date(row.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        unread: row.unread,
        targetPage: row.target_page,
        targetSelector: row.target_selector
      }));
      data.cnd.forEach(row => {
        if (row.ano === state.cnd.ano) state.cnd.meses[row.mes] = Number(row.valor_pago || 0);
      });
      document.getElementById('clientes-count').textContent = state.clientes.length;
      document.getElementById('obras-count').textContent = state.obras.length;
      updateEpiRegistradosCount();
      renderClientesList();
      renderObrasDoCliente();
      updateObraOptions();
      updateClienteCards();
      renderEstoque();
      renderNotifications();
      renderEquipamentos();
      dashboardDataLoaded = true;
    }
```

- [ ] **Step 3: Syntax check**

Run extraction command from Task 5 and `node --check tests/extracted-script-1.js`.

Expected: no syntax errors.

---

## Task 7: Persist primary actions to Supabase

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Make cliente save handler async and insert row**

Change `document.getElementById('btn-save-cliente').addEventListener('click', () => {` to:

```js
    document.getElementById('btn-save-cliente').addEventListener('click', async () => {
```

After building `cliente`, before `state.clientes.push(cliente);`, add:

```js
      if (currentProfile) {
        try {
          const savedCliente = await window.BelfortSupabase.insertCliente(currentProfile, cliente);
          cliente.id = savedCliente.id;
          cliente.endereco = endereco;
        } catch (error) {
          return showToast(error.message || 'Erro ao salvar cliente no banco.', 'error');
        }
      }
```

- [ ] **Step 2: Make obra save handler async and insert row**

Change `document.getElementById('btn-save-obra').addEventListener('click', () => {` to:

```js
    document.getElementById('btn-save-obra').addEventListener('click', async () => {
```

After building `obra`, before `state.obras.push(obra);`, add:

```js
      if (currentProfile) {
        const clienteId = state.clientes[state.selectedClienteIndex].id;
        if (!clienteId) return showToast('Cliente ainda não está sincronizado com o banco.', 'error');
        try {
          const savedObra = await window.BelfortSupabase.insertObra(currentProfile, obra, clienteId);
          obra.id = savedObra.id;
          obra.clienteId = clienteId;
        } catch (error) {
          return showToast(error.message || 'Erro ao salvar obra no banco.', 'error');
        }
      }
```

- [ ] **Step 3: Persist notifications opportunistically**

At the end of `addNotification`, after `renderNotifications();`, add:

```js
      if (currentProfile) {
        window.BelfortSupabase.insertNotification(currentProfile, state.notifications[0]).catch(error => {
          console.warn('Não foi possível salvar notificação:', error.message);
        });
      }
```

- [ ] **Step 4: Persist CND changes**

At the end of `updateCndMonth`, after `updateCndTotal();`, add:

```js
      if (currentProfile) {
        window.BelfortSupabase.upsertCnd(currentProfile, state.cnd.ano, month, state.cnd.meses[month]).catch(error => {
          console.warn('Não foi possível salvar CND:', error.message);
        });
      }
```

- [ ] **Step 5: Syntax check**

Run extraction command from Task 5 and `node --check tests/extracted-script-1.js`.

Expected: no syntax errors.

---

## Task 8: Test buttons and existing site behavior

**Files:**
- No code unless issues are found.

- [ ] **Step 1: Run automated tests**

Run:

```bash
node --test tests/auth-utils.test.cjs
```

Expected: PASS.

- [ ] **Step 2: Syntax check browser scripts**

Run:

```bash
node --check belfort-auth-utils.js
node --check belfort-supabase.js
python - <<'PY'
from pathlib import Path
import re
html = Path('index.html').read_text(encoding='utf-8')
for i, block in enumerate(re.findall(r'<script>([\s\S]*?)</script>', html), 1):
    Path(f'tests/extracted-script-{i}.js').write_text(block, encoding='utf-8')
PY
node --check tests/extracted-script-1.js
```

Expected: all commands exit 0.

- [ ] **Step 3: Check key DOM IDs exist**

Run:

```bash
python - <<'PY'
from pathlib import Path
html = Path('index.html').read_text(encoding='utf-8')
required = [
  'auth-shell','auth-login-panel','auth-register-panel','auth-code-panel','auth-recover-panel',
  'btn-save-cliente','btn-save-obra','btn-update-docs','add-epi-btn','btn-save-epi',
  'clientes-count','obras-count','estoque-lista','notif-list','cnd-table','equipamentos-lista'
]
missing = [item for item in required if f'id="{item}"' not in html]
if missing:
  raise SystemExit('Missing IDs: ' + ', '.join(missing))
print('All required IDs found')
PY
```

Expected: `All required IDs found`.

- [ ] **Step 4: Run Supabase advisors**

Run MCP `get_advisors` with type `security` and `performance`.

Expected: no critical issues introduced by the migration.

---

## Self-Review

- Spec coverage: login, cadastro, code reveal/copy, recovery panel, Supabase schema, triggers, RLS, and button/functionality tests are covered.
- Placeholder scan: no TBD/TODO placeholders are intentionally left.
- Type consistency: database column names use snake_case; JS state mapping converts to the existing camelCase/Portuguese fields used by the dashboard.

## Execution choice

The user already approved the table design and explicitly asked to continue, so execute inline with `superpowers:executing-plans` and verify after implementation.
