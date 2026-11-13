-- Migração incremental — corre isto no SQL Editor do Supabase.
-- Modelos de um produto (ex.: Meia de Natal, Laço) e o modelo escolhido em cada artigo encomendado.
alter table products add column if not exists models text[] not null default '{}';
alter table order_items add column if not exists model text;
