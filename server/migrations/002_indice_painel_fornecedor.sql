-- Indice do painel do fornecedor: os produtos sao listados por fornecedor e
-- ordenados pela data de criacao.
create index if not exists produtos_fornecedor_idx
  on public.produtos (fornecedor_id, created_at desc);
