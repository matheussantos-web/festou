create table if not exists public.avaliacoes_fornecedor (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null unique references public.pedidos (id) on delete cascade,
  cliente_id uuid not null references public.perfis (id) on delete restrict,
  fornecedor_id uuid not null references public.perfis (id) on delete restrict,
  nota smallint not null check (nota between 1 and 5),
  comentario text check (comentario is null or char_length(comentario) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists avaliacoes_fornecedor_idx
  on public.avaliacoes_fornecedor (fornecedor_id, created_at desc);
