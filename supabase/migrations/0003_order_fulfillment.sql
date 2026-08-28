-- Migração incremental — corre isto no SQL Editor do Supabase.
-- Adiciona o estado de produção/envio, separado do estado de pagamento,
-- usado pela página /admin/encomendas e pelos emails de atualização.

alter table orders add column if not exists fulfillment_status text not null default 'not_started';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_fulfillment_status_check'
  ) then
    alter table orders add constraint orders_fulfillment_status_check
      check (fulfillment_status in ('not_started', 'in_production', 'shipped', 'delivered'));
  end if;
end $$;
