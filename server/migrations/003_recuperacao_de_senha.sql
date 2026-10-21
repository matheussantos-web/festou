-- Tokens de recuperação de senha. Guarda só o hash do token, com validade e
-- marcação de uso, para o link funcionar uma única vez.
create table if not exists public.recuperacao_senha (
  token_hash text primary key,
  perfil_id uuid not null references public.perfis (id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists recuperacao_senha_perfil_idx
  on public.recuperacao_senha (perfil_id);
