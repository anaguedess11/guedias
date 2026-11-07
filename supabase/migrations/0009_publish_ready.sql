-- Migração incremental — corre isto no SQL Editor do Supabase ANTES de publicar
-- o código correspondente. É compatível com a versão anterior do site.

-- ─────────────────────────────────────────────────────────────
-- Segurança: o cliente só pode alterar os dados do próprio perfil,
-- nunca profiles.is_admin. A policy de update limita a linha, não as colunas,
-- por isso qualquer conta registada podia tornar-se administradora.
-- ─────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────
-- Várias fotos por produto. A primeira é a capa; image_url mantém-se igual
-- à primeira foto, para compatibilidade.
-- ─────────────────────────────────────────────────────────────
alter table public.products
  add column if not exists image_urls text[] not null default '{}';

update public.products
set image_urls = array[image_url]
where image_url is not null
  and image_url <> ''
  and cardinality(image_urls) = 0;

-- ─────────────────────────────────────────────────────────────
-- Cor de cada filamento, para escolher as cores ao criar um produto.
-- Os valores abaixo são uma aproximação: ajusta em /admin/filamentos.
-- ─────────────────────────────────────────────────────────────
alter table public.filaments
  add column if not exists hex text not null default '#A97464';

update public.filaments
set hex = case
  when color ilike 'branco%' then '#F4F1EA'
  when color ilike 'preto%' then '#232320'
  when color ilike 'matte rose%' then '#C9A49A'
  when color ilike 'amarelo%' then '#E8C53A'
  when color ilike 'verde%' then '#7FA650'
  when color ilike 'vermelho%' then '#C8352B'
  when color ilike 'azul%' then '#A9D3E8'
  else hex
end
where hex = '#A97464';

-- ─────────────────────────────────────────────────────────────
-- Telefone do cliente na encomenda — necessário para combinar a entrega em mão.
-- shipping_method passa também a aceitar 'maos_coimbra' e 'maos_santarem'
-- (é uma coluna de texto, sem alterações de esquema).
-- ─────────────────────────────────────────────────────────────
alter table public.orders
  add column if not exists customer_phone text;
