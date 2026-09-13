-- Migração incremental — corre isto no SQL Editor do Supabase.
-- Sai o Stripe Checkout nesta fase inicial: os pagamentos passam a ser
-- feitos por MB WAY ou transferência bancária, confirmados manualmente
-- em /admin/encomendas (sem taxas de plataforma de pagamentos).

-- ─────────────────────────────────────────────────────────────
-- Encomendas: método de pagamento em vez de sessão/pagamento Stripe
-- ─────────────────────────────────────────────────────────────
alter table orders add column if not exists payment_method text;

update orders set payment_method = 'transferencia' where payment_method is null;

alter table orders alter column payment_method set not null;
alter table orders alter column payment_method set default 'transferencia';

alter table orders add constraint orders_payment_method_check
  check (payment_method in ('mbway', 'transferencia'));

alter table orders drop column if exists stripe_session_id;
alter table orders drop column if exists stripe_payment_intent;

-- ─────────────────────────────────────────────────────────────
-- Perfis: já não criamos clientes Stripe
-- ─────────────────────────────────────────────────────────────
alter table profiles drop column if exists stripe_customer_id;

comment on column orders.status is
  'Estado do pagamento. "pending" = aguarda confirmação manual (MB WAY / transferência); avança para "paid" só quando um admin confirma a receção em /admin/encomendas.';
