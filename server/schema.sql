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

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.perfis (id) on delete restrict,
  status text not null default 'solicitado'
    check (status in ('solicitado', 'em_negociacao', 'confirmado', 'recusado', 'cancelado', 'concluido')),
  total_estimado numeric(10, 2) not null check (total_estimado > 0),
  observacao text check (observacao is null or char_length(observacao) <= 500),
  created_at timestamptz not null default now()
);

create table if not exists public.itens_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  produto_id uuid references public.produtos (id) on delete set null,
  fornecedor_id uuid not null references public.perfis (id) on delete restrict,
  nome_produto text not null,
  categoria text not null check (categoria in ('bolos', 'doces', 'brinquedos', 'convites')),
  preco_unitario numeric(10, 2) not null check (preco_unitario > 0),
  quantidade integer not null check (quantidade between 1 and 20),
  subtotal numeric(10, 2) not null check (subtotal > 0),
  created_at timestamptz not null default now()
);

create index if not exists pedidos_cliente_idx
  on public.pedidos (cliente_id, created_at desc);

create index if not exists itens_pedido_fornecedor_idx
  on public.itens_pedido (fornecedor_id, pedido_id);

create table if not exists public.convites (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null references public.perfis (id) on delete cascade,
  slug text not null unique,
  titulo text not null check (char_length(btrim(titulo)) between 3 and 100),
  anfitriao text not null check (char_length(btrim(anfitriao)) between 2 and 100),
  data_evento timestamptz not null,
  local_evento text not null check (char_length(btrim(local_evento)) between 3 and 180),
  mensagem text check (mensagem is null or char_length(mensagem) <= 500),
  tema text not null default 'jardim'
    check (tema in ('jardim', 'colorido', 'ceu-estrelado')),
  aceita_rsvp boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.confirmacoes_presenca (
  id uuid primary key default gen_random_uuid(),
  convite_id uuid not null references public.convites (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 2 and 100),
  email text not null,
  resposta text not null check (resposta in ('confirmado', 'recusado', 'talvez')),
  quantidade_pessoas integer not null default 1 check (quantidade_pessoas between 1 and 10),
  mensagem text check (mensagem is null or char_length(mensagem) <= 300),
  updated_at timestamptz not null default now(),
  unique (convite_id, email)
);

create index if not exists convites_dono_idx
  on public.convites (dono_id, created_at desc);

create index if not exists confirmacoes_convite_idx
  on public.confirmacoes_presenca (convite_id, resposta);