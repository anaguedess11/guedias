-- Migração incremental — corre isto no SQL Editor do Supabase SE já
-- tinhas corrido o schema.sql antes desta funcionalidade existir.
-- (Se estás a criar o projeto de raiz, basta correres o schema.sql
-- atualizado — já inclui tudo isto.)

alter table products add column if not exists image_url text;
alter table profiles add column if not exists is_admin boolean not null default false;

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

-- Por fim, torna-te administradora (troca o email pelo da tua conta):
-- update profiles set is_admin = true where id =
--   (select id from auth.users where email = 'o-teu-email@exemplo.com');
