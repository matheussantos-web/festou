alter table public.produtos
  add column if not exists imagens_url text[] not null default '{}'::text[];

update public.produtos
set imagens_url = array[imagem_url]
where imagem_url is not null and cardinality(imagens_url) = 0;

alter table public.produtos
  add constraint produtos_imagens_url_length_check
  check (cardinality(imagens_url) <= 5);
