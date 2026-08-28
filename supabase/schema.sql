-- Guedias — schema da base de dados (Supabase / Postgres)
-- Corre este ficheiro no SQL Editor do teu projeto Supabase (uma única vez).

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Categorias
-- ─────────────────────────────────────────────────────────────
create table if not exists categories (
  key text primary key,
  label text not null,
  description text not null default ''
);

alter table categories enable row level security;

create policy "categorias são públicas para leitura"
  on categories for select
  using (true);

-- ─────────────────────────────────────────────────────────────
-- Produtos
-- ─────────────────────────────────────────────────────────────
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category_key text not null references categories(key),
  price_cents integer not null check (price_cents >= 0),
  compare_at_price_cents integer,
  short_description text not null default '',
  description text not null default '',
  details text[] not null default '{}',
  materials text[] not null default '{}',
  colors jsonb not null default '[]',            -- [{ "name": "Preto", "hex": "#232320" }, ...]
  image_url text,                                 -- foto real opcional; sem isto usa-se o placeholder visual
  customizable boolean not null default false,
  customization_label text,
  customization_note text,
  profile numeric[] not null default '{}',        -- silhueta em "camadas" usada no placeholder visual
  print_time_hours numeric not null default 1,
  dimensions text not null default '',
  featured boolean not null default false,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists products_category_key_idx on products (category_key);
create index if not exists products_featured_idx on products (featured) where featured = true;

alter table products enable row level security;

create policy "produtos são públicos para leitura"
  on products for select
  using (true);

-- ─────────────────────────────────────────────────────────────
-- Perfis de utilizador (estende auth.users)
-- ─────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "utilizador vê o próprio perfil"
  on profiles for select
  using (auth.uid() = id);

create policy "utilizador atualiza o próprio perfil"
  on profiles for update
  using (auth.uid() = id);

-- Cria automaticamente uma linha em profiles sempre que um utilizador se regista
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Administração de produtos
-- Só utilizadores com profiles.is_admin = true podem criar/editar/apagar
-- produtos. Para te tornares admin, depois de teres uma conta criada:
--   update profiles set is_admin = true where id =
--     (select id from auth.users where email = 'o-teu-email@exemplo.com');
-- ─────────────────────────────────────────────────────────────
create policy "admins podem criar produtos"
  on products for insert
  with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
  );

create policy "admins podem editar produtos"
  on products for update
  using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
  )
  with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
  );

create policy "admins podem apagar produtos"
  on products for delete
  using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
  );

-- ─────────────────────────────────────────────────────────────
-- Encomendas
-- ─────────────────────────────────────────────────────────────
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id),
  stripe_session_id text unique,
  stripe_payment_intent text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'canceled')),
  -- Estado de produção/envio, distinto do estado de pagamento acima.
  -- Só avança manualmente, a partir de /admin/encomendas.
  fulfillment_status text not null default 'not_started'
    check (fulfillment_status in ('not_started', 'in_production', 'shipped', 'delivered')),
  email text not null,
  shipping_name text,
  shipping_address jsonb,
  shipping_method text,
  subtotal_cents integer not null,
  shipping_cents integer not null,
  total_cents integer not null,
  currency text not null default 'eur',
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on orders (user_id);

alter table orders enable row level security;

create policy "utilizador vê as próprias encomendas"
  on orders for select
  using (auth.uid() = user_id);

-- Não há policies de insert/update/delete: as encomendas só são escritas
-- pelo webhook do Stripe e atualizadas a partir de /admin, ambos usando a
-- service role key (ignora RLS) com verificação de administrador na app.

-- ─────────────────────────────────────────────────────────────
-- Itens da encomenda
-- ─────────────────────────────────────────────────────────────
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id),
  name text not null,
  price_cents integer not null,
  qty integer not null check (qty > 0),
  color text,
  material text,
  personalization text
);

create index if not exists order_items_order_id_idx on order_items (order_id);

alter table order_items enable row level security;

create policy "utilizador vê itens das próprias encomendas"
  on order_items for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );
