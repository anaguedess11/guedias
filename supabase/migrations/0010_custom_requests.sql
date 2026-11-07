-- Migração incremental — corre isto no SQL Editor do Supabase.
-- "Imagina a tua peça": ideias enviadas pelos clientes.
-- Sem policies de propósito: a tabela e as imagens só são acedidas no servidor,
-- com a service role, depois de validar o pedido ou de confirmar que é um admin.

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
