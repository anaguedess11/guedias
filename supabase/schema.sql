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
  image_url text,                                 -- foto de capa (igual a image_urls[1]); sem foto usa-se o placeholder visual
  image_urls text[] not null default '{}',        -- todas as fotos do produto, por ordem
  customizable boolean not null default false,
  customization_label text,
  customization_note text,
  profile numeric[] not null default '{}',        -- silhueta em "camadas" usada no placeholder visual
  print_time_hours numeric not null default 1,
  dimensions text not null default '',
  featured boolean not null default false,
  models text[] not null default '{}',           -- modelos à escolha (ex.: Meia de Natal, Laço)
  hidden boolean not null default false,          -- oculto da loja (continua no admin e nas encomendas)
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
  -- Morada de envio guardada — pré-preenche o formulário de checkout.
  shipping_name text,
  shipping_line1 text,
  shipping_line2 text,
  shipping_postal_code text,
  shipping_city text,
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

-- A policy limita a linha, não as colunas: is_admin nunca pode ser editável pelo cliente.
revoke update on public.profiles from anon, authenticated;
grant update (
  full_name,
  phone,
  shipping_name,
  shipping_line1,
  shipping_line2,
  shipping_postal_code,
  shipping_city
) on public.profiles to authenticated;

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
  -- "pending" = aguarda confirmação manual do pagamento (MB WAY ou
  -- transferência bancária); só avança para "paid" quando um admin
  -- confirma a receção em /admin/encomendas — não há gateway automático.
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'canceled', 'refunded')),
  payment_method text not null default 'transferencia'
    check (payment_method in ('mbway', 'transferencia')),
  -- Estado de produção/envio, distinto do estado de pagamento acima.
  -- Só avança manualmente, a partir de /admin/encomendas.
  fulfillment_status text not null default 'not_started'
    check (fulfillment_status in ('not_started', 'in_production', 'shipped', 'delivered')),
  email text not null,
  shipping_name text,
  shipping_address jsonb,
  shipping_method text,                           -- standard, expresso, maos_coimbra ou maos_santarem
  customer_phone text,
  subtotal_cents integer not null,
  shipping_cents integer not null,
  total_cents integer not null,
  refunded_cents integer not null default 0,
  currency text not null default 'eur',
  -- Notas internas visíveis apenas em /admin/encomendas.
  admin_notes text,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on orders (user_id);

alter table orders enable row level security;

create policy "utilizador vê as próprias encomendas"
  on orders for select
  using (auth.uid() = user_id);

-- Não há policies de insert/update/delete: as encomendas só são escritas
-- pelo endpoint de checkout (/api/checkout) e atualizadas a partir de
-- /admin, ambos usando a service role key (ignora RLS), esta última com
-- verificação de administrador na app.

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
  personalization text,
  model text
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

-- ─────────────────────────────────────────────────────────────
-- Favoritos (lista de desejos)
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

-- ─────────────────────────────────────────────────────────────
-- Filamentos
-- Informação de custos — leitura e escrita restritas a administradores.
-- ─────────────────────────────────────────────────────────────
create table if not exists filaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  color text not null,
  hex text not null default '#A97464',
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

-- ─────────────────────────────────────────────────────────────
-- "Imagina a tua peça" (ideias dos clientes)
-- ─────────────────────────────────────────────────────────────
create table if not exists custom_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  description text not null,
  size text,
  colors text,
  needed_by text,
  quantity integer check (quantity is null or quantity > 0),
  image_paths text[] not null default '{}',
  status text not null default 'new' check (status in ('new', 'talking', 'accepted', 'declined')),
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists custom_requests_created_at_idx on custom_requests (created_at desc);
create index if not exists custom_requests_ip_hash_idx on custom_requests (ip_hash, created_at);

alter table custom_requests enable row level security;

-- Bucket privado: as fotos podem mostrar pessoas ou casas.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'custom-request-images',
  'custom-request-images',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
