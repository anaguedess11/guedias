-- Migração incremental — corre isto no SQL Editor do Supabase.
-- Permite ocultar um produto da loja sem o apagar (as encomendas antigas continuam ligadas a ele).
alter table products add column if not exists hidden boolean not null default false;
