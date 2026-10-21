import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { getDatabase } from '../db.js'
import { requireUser } from '../middleware/session.js'
import { clientOrderSelect, findClientOrderById } from '../queries/orders.js'
import { orderSchema, updateOrderStatusSchema } from '../schemas/orders.js'

export const ordersRouter = Router()

const orderIdSchema = z.string().uuid('Identificador do pedido inválido.')

ordersRouter.get('/', requireUser, async (request, response, next) => {
  try {
    const sql = getDatabase()

    if (request.user.tipo_perfil === 'cliente') {
      const orders = await sql.query(
        `${clientOrderSelect} where o.cliente_id = $1 group by o.id order by o.created_at desc limit 100`,
        [request.user.id],
      )

      return response.json({ orders })
    }

    if (request.user.tipo_perfil === 'fornecedor') {
      const orders = await sql`
        select
          o.id,
          o.status,
          o.observacao,
          o.created_at,
          c.nome as cliente_nome,
          c.email as cliente_email,
          sum(i.subtotal) as total_fornecedor,
          json_agg(json_build_object(
            'id', i.id,
            'nome', i.nome_produto,
            'categoria', i.categoria,
            'preco_unitario', i.preco_unitario,
            'quantidade', i.quantidade,
            'subtotal', i.subtotal
          )) as itens
        from public.pedidos o
        join public.perfis c on c.id = o.cliente_id
        join public.itens_pedido i on i.pedido_id = o.id
        where i.fornecedor_id = ${request.user.id}
        group by o.id, c.nome, c.email
        order by o.created_at desc
        limit 100
      `

      return response.json({ orders })
    }

    return response.status(403).json({ message: 'Este perfil nao pode consultar pedidos.' })
  } catch (error) {
    return next(error)
  }
})

ordersRouter.post('/', requireUser, async (request, response, next) => {
  try {
    if (request.user.tipo_perfil !== 'cliente') {
      return response.status(403).json({ message: 'Somente clientes podem solicitar orcamentos.' })
    }

    const input = orderSchema.parse(request.body)
    const quantities = new Map()
    for (const item of input.items) {
      const quantity = (quantities.get(item.produto_id) ?? 0) + item.quantidade
      if (quantity > 20) {
        return response.status(400).json({ message: 'O limite e de 20 unidades por produto.' })
      }
      quantities.set(item.produto_id, quantity)
    }

    const productIds = [...quantities.keys()]
    const placeholders = productIds.map((_, index) => `$${index + 1}::uuid`).join(', ')
    const sql = getDatabase()
    const products = await sql.query(
      `select id, fornecedor_id, nome, categoria, preco from public.produtos where ativo = true and id in (${placeholders})`,
      productIds,
    )

    if (products.length !== productIds.length) {
      return response.status(400).json({ message: 'Um ou mais produtos nao estao mais disponiveis.' })
    }

    const productsById = new Map(products.map((product) => [product.id, product]))
    const orderItems = productIds.map((productId) => {
      const product = productsById.get(productId)
      const quantity = quantities.get(productId)
      const unitPriceCents = Math.round(Number(product.preco) * 100)
      const subtotalCents = unitPriceCents * quantity

      return {
        product,
        quantity,
        unitPrice: (unitPriceCents / 100).toFixed(2),
        subtotal: (subtotalCents / 100).toFixed(2),
        subtotalCents,
      }
    })
    const totalCents = orderItems.reduce((total, item) => total + item.subtotalCents, 0)
    const total = (totalCents / 100).toFixed(2)
    const orderId = randomUUID()
    const statements = [
      sql`
        insert into public.pedidos (id, cliente_id, total_estimado, observacao)
        values (${orderId}, ${request.user.id}, ${total}, ${input.observacao})
        returning id
      `,
    ]

    statements.push(...orderItems.map(({ product, quantity, unitPrice, subtotal }) => sql`
      insert into public.itens_pedido (
        pedido_id, produto_id, fornecedor_id, nome_produto, categoria,
        preco_unitario, quantidade, subtotal
      ) values (
        ${orderId},
        ${product.id}, ${product.fornecedor_id}, ${product.nome}, ${product.categoria},
        ${unitPrice}, ${quantity}, ${subtotal}
      )
    `))

    await sql.transaction(statements)

    const order = await findClientOrderById(orderId)

    if (!order) {
      return response.status(500).json({ message: 'O pedido foi criado, mas não pôde ser carregado. Atualize a página.' })
    }

    response.status(201).json({ order })
  } catch (error) {
    return next(error)
  }
})

ordersRouter.patch('/:id/status', requireUser, async (request, response, next) => {
  try {
    const orderId = orderIdSchema.parse(request.params.id)
    const input = updateOrderStatusSchema.parse(request.body)
    const sql = getDatabase()

    const [order] = await sql`
      select id, cliente_id, status
      from public.pedidos
      where id = ${orderId}
      limit 1
    `

    if (!order) {
      return response.status(404).json({ message: 'Pedido não encontrado.' })
    }

    if (request.user.tipo_perfil === 'cliente') {
      if (order.cliente_id !== request.user.id) {
        return response.status(403).json({ message: 'Você não tem permissão para alterar este pedido.' })
      }

      if (input.status === 'cancelado') {
        if (!['solicitado', 'em_negociacao'].includes(order.status)) {
          return response.status(400).json({ message: 'Apenas pedidos pendentes ou em negociação podem ser cancelados.' })
        }
      } else if (input.status === 'concluido') {
        if (order.status !== 'confirmado') {
          return response.status(400).json({ message: 'Apenas pedidos confirmados podem ser marcados como concluídos.' })
        }
      } else {
        return response.status(403).json({ message: 'Clientes só podem cancelar ou concluir seus pedidos.' })
      }
    } else if (request.user.tipo_perfil === 'fornecedor') {
      const [supplierItem] = await sql`
        select 1
        from public.itens_pedido
        where pedido_id = ${order.id} and fornecedor_id = ${request.user.id}
        limit 1
      `

      if (!supplierItem) {
        return response.status(403).json({ message: 'Você não possui produtos vinculados a este pedido.' })
      }

      const allowedForSupplier = ['em_negociacao', 'confirmado', 'recusado']
      if (!allowedForSupplier.includes(input.status)) {
        return response.status(400).json({ message: 'Status inválido para fornecedor.' })
      }

      if (!['solicitado', 'em_negociacao'].includes(order.status)) {
        return response.status(400).json({ message: 'Este pedido não pode mais ter o status alterado pelo fornecedor.' })
      }
    } else {
      return response.status(403).json({ message: 'Perfil não autorizado.' })
    }

    const [updatedOrder] = await sql`
      update public.pedidos
      set status = ${input.status}
      where id = ${order.id}
      returning id, status
    `

    response.json({
      message: 'Status do pedido atualizado com sucesso.',
      order: updatedOrder,
    })
  } catch (error) {
    next(error)
  }
})
