create table if not exists public.mensagens_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  autor_id uuid not null references public.perfis (id) on delete restrict,
  texto text not null check (char_length(btrim(texto)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists mensagens_pedido_conversa_idx
  on public.mensagens_pedido (pedido_id, created_at, id);
