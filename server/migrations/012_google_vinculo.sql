-- Vinculo explicito entre a conta Festou e a conta Google (claim "sub").
-- So contas criadas pelo fluxo Google recebem google_sub automaticamente.
-- Contas com senha ficam com NULL para evitar pre-hijack: alguem poderia
-- cadastrar o e-mail da vitima com senha e esperar que ela entre com Google.
alter table public.perfis add column if not exists google_sub text;

create unique index if not exists perfis_google_sub_unique_idx
  on public.perfis (google_sub)
  where google_sub is not null;
