-- Migração incremental — corre isto no SQL Editor do Supabase.
-- Cria o bucket de Storage para as fotografias de produtos e as políticas:
-- leitura pública, escrita só para administradores.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Qualquer pessoa pode ver as imagens (o bucket é público).
create policy "product-images: leitura pública"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Só contas com profiles.is_admin = true podem carregar / substituir / apagar.
create policy "product-images: upload de admin"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin)
  );

create policy "product-images: update de admin"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin)
  );

create policy "product-images: delete de admin"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin)
  );
