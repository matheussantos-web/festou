create table if not exists public.leituras_conversa (
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  lida_ate timestamptz not null default '-infinity',
  updated_at timestamptz not null default now(),
  primary key (pedido_id, usuario_id)
);

create index if not exists leituras_conversa_usuario_idx
  on public.leituras_conversa (usuario_id, pedido_id);
