-- Contas existentes permanecem ativas; novos cadastros por senha exigem confirmacao.
alter table public.perfis
  add column if not exists email_verified boolean not null default true,
  add column if not exists email_verification_token_hash text,
  add column if not exists email_verification_expires_at timestamptz;

create unique index if not exists perfis_email_verification_token_unique_idx
  on public.perfis (email_verification_token_hash)
  where email_verification_token_hash is not null;
