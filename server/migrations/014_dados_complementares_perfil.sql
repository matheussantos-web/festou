alter table public.perfis
  add column if not exists telefone text,
  add column if not exists cidade text,
  add column if not exists segmento text;

alter table public.perfis
  add constraint perfis_telefone_length_check check (telefone is null or char_length(telefone) <= 30),
  add constraint perfis_cidade_length_check check (cidade is null or char_length(cidade) <= 100),
  add constraint perfis_segmento_length_check check (segmento is null or char_length(segmento) <= 100);
