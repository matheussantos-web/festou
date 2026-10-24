alter table public.confirmacoes_presenca
  alter column email drop not null,
  add column if not exists resposta_token uuid;

create unique index if not exists confirmacoes_convite_token_unique_idx
  on public.confirmacoes_presenca (convite_id, resposta_token)
  where resposta_token is not null;

alter table public.confirmacoes_presenca
  drop constraint if exists confirmacoes_presenca_quantidade_pessoas_check;

alter table public.confirmacoes_presenca
  add constraint confirmacoes_presenca_quantidade_pessoas_check
  check (quantidade_pessoas between 0 and 10);
