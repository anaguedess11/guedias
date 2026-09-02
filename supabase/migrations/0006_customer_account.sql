-- Migração incremental — corre isto no SQL Editor do Supabase.
-- Funcionalidades da conta do cliente: morada guardada no perfil,
-- cliente Stripe reutilizável, e lista de favoritos.

-- ─────────────────────────────────────────────────────────────
-- Perfil: morada de envio guardada + id do cliente Stripe
-- ─────────────────────────────────────────────────────────────
alter table profiles add column if not exists shipping_name text;
alter table profiles add column if not exists shipping_line1 text;
alter table profiles add column if not exists shipping_line2 text;
alter table profiles add column if not exists shipping_postal_code text;
alter table profiles add column if not exists shipping_city text;
alter table profiles add column if not exists stripe_customer_id text;

-- ─────────────────────────────────────────────────────────────
-- Favoritos (lista de desejos) — um registo por (utilizador, produto)
-- ─────────────────────────────────────────────────────────────
create table if not exists favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index if not exists favorites_user_id_idx on favorites (user_id);

alter table favorites enable row level security;

create policy "utilizador vê os próprios favoritos"
  on favorites for select
  using (auth.uid() = user_id);

create policy "utilizador adiciona aos próprios favoritos"
  on favorites for insert
  with check (auth.uid() = user_id);

create policy "utilizador remove dos próprios favoritos"
  on favorites for delete
  using (auth.uid() = user_id);
