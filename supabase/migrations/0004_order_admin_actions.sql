-- Migração incremental — corre isto no SQL Editor do Supabase.
-- Adiciona campos usados pelas ações de administração nas encomendas:
-- notas internas, valor reembolsado e o estado "refunded".

alter table orders add column if not exists admin_notes text;
alter table orders add column if not exists refunded_cents integer not null default 0;

-- Alarga o check de "status" para incluir "refunded".
do $$
begin
  alter table orders drop constraint if exists orders_status_check;
  alter table orders add constraint orders_status_check
    check (status in ('pending', 'paid', 'failed', 'canceled', 'refunded'));
end $$;
