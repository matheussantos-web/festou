alter table public.produtos
  drop constraint if exists produtos_categoria_check;

alter table public.produtos
  add constraint produtos_categoria_check
  check (categoria in (
    'bolos', 'doces', 'salgados', 'bebidas', 'saloes',
    'animacao', 'decoracao', 'brinquedos', 'convites'
  ));

alter table public.itens_pedido
  drop constraint if exists itens_pedido_categoria_check;

alter table public.itens_pedido
  add constraint itens_pedido_categoria_check
  check (categoria in (
    'bolos', 'doces', 'salgados', 'bebidas', 'saloes',
    'animacao', 'decoracao', 'brinquedos', 'convites'
  ));
