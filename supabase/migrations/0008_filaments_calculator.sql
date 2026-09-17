-- Migração incremental — corre isto no SQL Editor do Supabase.
-- Gestão de filamentos, configurações gerais da calculadora de preço,
-- e cálculos guardados (usados também para importar preço em /admin/produtos).

-- ─────────────────────────────────────────────────────────────
-- Filamentos
-- Informação de custos — leitura e escrita restritas a administradores.
-- ─────────────────────────────────────────────────────────────
create table if not exists filaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  color text not null,
  material text not null,
  price_per_kg_cents integer not null check (price_per_kg_cents >= 0),
  notes text,
  created_at timestamptz not null default now()
);

alter table filaments enable row level security;

create policy "admins podem ver filamentos"
  on filaments for select
  using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
  );

create policy "admins podem criar filamentos"
  on filaments for insert
  with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
  );

create policy "admins podem editar filamentos"
  on filaments for update
  using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
  )
  with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
  );

create policy "admins podem apagar filamentos"
  on filaments for delete
  using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
  );

-- ─────────────────────────────────────────────────────────────
-- Configurações gerais da calculadora — registo único ("singleton")
-- ─────────────────────────────────────────────────────────────
create table if not exists calculator_settings (
  id text primary key default 'default',
  machine_rate_cents integer not null default 50,       -- €/hora (desgaste + manutenção)
  labor_rate_cents integer not null default 1200,        -- €/hora (o teu trabalho)
  failure_reserve_percent numeric not null default 8,    -- % reserva para impressões falhadas
  fee_percent numeric not null default 1.5,               -- % taxa de pagamento
  fee_fixed_cents integer not null default 25,            -- taxa de pagamento fixa (€)
  vat_percent numeric not null default 23,                -- IVA (%)
  vat_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint calculator_settings_singleton_id check (id = 'default')
);

alter table calculator_settings enable row level security;

create policy "admins podem ver configurações da calculadora"
  on calculator_settings for select
  using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
  );

create policy "admins podem criar configurações da calculadora"
  on calculator_settings for insert
  with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
  );

create policy "admins podem editar configurações da calculadora"
  on calculator_settings for update
  using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
  )
  with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
  );

insert into calculator_settings (id)
values ('default')
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────
-- Cálculos guardados — usados na calculadora e para importar preço
-- ao criar/editar um produto.
-- ─────────────────────────────────────────────────────────────
create table if not exists saved_calculations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  filament_id uuid references filaments (id) on delete set null,
  inputs jsonb not null,
  total_cost_cents integer not null,
  suggested_price_cents integer not null,
  profit_cents integer not null,
  margin_percent numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_calculations_created_at_idx on saved_calculations (created_at desc);

alter table saved_calculations enable row level security;

create policy "admins podem ver cálculos guardados"
  on saved_calculations for select
  using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
  );

create policy "admins podem criar cálculos guardados"
  on saved_calculations for insert
  with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
  );

create policy "admins podem editar cálculos guardados"
  on saved_calculations for update
  using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
  )
  with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
  );

create policy "admins podem apagar cálculos guardados"
  on saved_calculations for delete
  using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
  );
