alter table public.pedidos
  alter column cliente_id drop not null,
  add column if not exists cliente_nome text,
  add column if not exists cliente_email text;

alter table public.produtos
  add column if not exists locais_atendimento text[] not null default '{}';
