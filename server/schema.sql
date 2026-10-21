create extension if not exists pgcrypto;

create table if not exists public.perfis (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 3 and 100),
  email text not null unique,
  senha_hash text not null,
  tipo_perfil text not null default 'cliente'
    check (tipo_perfil in ('cliente', 'fornecedor')),
  created_at timestamptz not null default now()
);

create table if not exists public.sessoes (
  token_hash text primary key,
  perfil_id uuid not null references public.perfis (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sessoes_expiration_idx on public.sessoes (expires_at);

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  fornecedor_id uuid not null references public.perfis (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 3 and 120),
  categoria text not null check (categoria in ('bolos', 'doces', 'brinquedos', 'convites')),
  descricao text not null check (char_length(btrim(descricao)) between 10 and 1000),
  preco numeric(10, 2) not null check (preco > 0),
  cidade text check (cidade is null or char_length(cidade) <= 100),
  imagem_url text check (imagem_url is null or char_length(imagem_url) <= 2048),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists produtos_vitrine_idx
  on public.produtos (categoria, created_at desc)
  where ativo = true;