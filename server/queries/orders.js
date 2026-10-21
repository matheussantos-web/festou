import { getDatabase } from '../db.js'

export const clientOrderSelect = `
  select
    o.id,
    o.status,
    o.total_estimado,
    o.observacao,
    o.created_at,
    coalesce(
      json_agg(json_build_object(
        'id', i.id,
        'produto_id', i.produto_id,
        'nome', i.nome_produto,
        'categoria', i.categoria,
        'preco_unitario', i.preco_unitario,
        'quantidade', i.quantidade,
        'subtotal', i.subtotal
      )) filter (where i.id is not null),
      '[]'::json
    ) as itens
  from public.pedidos o
  left join public.itens_pedido i on i.pedido_id = o.id
`

export async function findClientOrderById(orderId) {
  const sql = getDatabase()
  const rows = await sql.query(
    `${clientOrderSelect} where o.id = $1 group by o.id`,
    [orderId],
  )

  return rows[0] ?? null
}
