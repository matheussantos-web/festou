alter table public.pedidos
  drop constraint if exists pedidos_status_check;

update public.pedidos
set status = case status
  when 'confirmado' then 'negocio_fechado'
  when 'concluido' then 'servico_concluido'
  else status
end
where status in ('confirmado', 'concluido');

alter table public.pedidos
  add constraint pedidos_status_check
  check (status in (
    'solicitado',
    'em_negociacao',
    'negocio_fechado',
    'servico_concluido',
    'recusado',
    'cancelado'
  ));
