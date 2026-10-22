-- Adiciona WhatsApp opcional ao perfil do fornecedor para contato após aprovação do orçamento
alter table public.perfis
  add column if not exists whatsapp text;

comment on column public.perfis.whatsapp is 'WhatsApp do fornecedor (apenas para contas tipo fornecedor). Exibido ao cliente apenas após pedido confirmado.';
