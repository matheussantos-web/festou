import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { getDatabase } from '../db.js'
import { requireUser } from '../middleware/session.js'
import { clientOrderSelect, findClientOrderById } from '../queries/orders.js'
import { orderSchema, updateOrderStatusSchema } from '../schemas/orders.js'
import { buildPagination, readPagination } from '../schemas/pagination.js'

export const ordersRouter = Router()

const orderIdSchema = z.string().uuid('Identificador do pedido inválido.')
const defaultPageSize = 20

ordersRouter.get('/', requireUser, async (request, response, next) => {
  try {
    const sql = getDatabase()
    const { pagina, limite, offset } = readPagination(request.query, { defaultLimit: defaultPageSize })

    if (request.user.tipo_perfil === 'cliente') {
      const [{ total }] = await sql`
        select count(*)::int as total
        from public.pedidos
        where cliente_id = ${request.user.id}
      `

      const orders = await sql`
        select o.id, o.status, o.total_estimado, o.observacao, o.created_at,
          (select string_agg(distinct f.nome, ', ' order by f.nome)
           from public.itens_pedido ip join public.perfis f on f.id = ip.fornecedor_id
           where ip.pedido_id = o.id) as fornecedor_nome,
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
          ) as itens,
          case
            when o.status = 'confirmado'
            then coalesce(
              (select json_agg(distinct jsonb_build_object('email', f.email, 'whatsapp', null))
               from public.itens_pedido ip
               join public.perfis f on f.id = ip.fornecedor_id
               where ip.pedido_id = o.id),
              '[]'::json
            )
            else '[]'::json
          end as fornecedor_contato
        from public.pedidos o
        left join public.itens_pedido i on i.pedido_id = o.id
        where o.cliente_id = ${request.user.id}
        group by o.id
        order by o.created_at desc, o.id
        limit ${limite} offset ${offset}
      `

      return response.json({
        orders,
        pagination: buildPagination({ pagina, limite, total }),
      })
    }

    if (request.user.tipo_perfil === 'fornecedor') {
      const [{ total, pendentes }] = await sql`
        select
          count(distinct o.id)::int as total,
          count(distinct o.id) filter (where o.status = 'solicitado')::int as pendentes
        from public.pedidos o
        join public.itens_pedido i on i.pedido_id = o.id
        where i.fornecedor_id = ${request.user.id}
      `

      const orders = await sql`
        select
          o.id,
          o.status,
          o.observacao,
          o.created_at,
          c.nome as cliente_nome,
          -- O contato completo só é liberado depois que o pedido é confirmado;
          -- antes disso o fornecedor vê o e-mail mascarado (LGPD).
          case
            when o.status in ('confirmado', 'concluido') then c.email
            else regexp_replace(c.email, '^(.)[^@]*(@.*)$', '\\1***\\2')
          end as cliente_email,
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
        order by o.created_at desc, o.id
        limit ${limite} offset ${offset}
      `

      return response.json({
        orders,
        pagination: buildPagination({ pagina, limite, total }),
        summary: { pendentes },
      })
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
    const itemsBySupplier = new Map()
    for (const item of orderItems) {
      const supplierId = item.product.fornecedor_id
      if (!itemsBySupplier.has(supplierId)) itemsBySupplier.set(supplierId, [])
      itemsBySupplier.get(supplierId).push(item)
    }

    const groupedItems = [...itemsBySupplier.values()]
    const orderIds = groupedItems.map(() => randomUUID())
    const statements = []
    groupedItems.forEach((supplierItems, index) => {
      const supplierTotalCents = supplierItems.reduce((sum, item) => sum + item.subtotalCents, 0)
      const supplierTotal = (supplierTotalCents / 100).toFixed(2)
      statements.push(sql`
        insert into public.pedidos (id, cliente_id, total_estimado, observacao)
        values (${orderIds[index]}, ${request.user.id}, ${supplierTotal}, ${input.observacao})
      `)
      statements.push(...supplierItems.map(({ product, quantity, unitPrice, subtotal }) => sql`
        insert into public.itens_pedido (
          pedido_id, produto_id, fornecedor_id, nome_produto, categoria,
          preco_unitario, quantidade, subtotal
        ) values (
          ${orderIds[index]}, ${product.id}, ${product.fornecedor_id}, ${product.nome}, ${product.categoria},
          ${unitPrice}, ${quantity}, ${subtotal}
        )
      `))
    })

    await sql.transaction(statements)
    const orders = await Promise.all(orderIds.map((id) => findClientOrderById(id)))
    if (orders.some((order) => !order)) {
      return response.status(500).json({ message: 'Os pedidos foram criados, mas nao puderam ser carregados. Atualize a pagina.' })
    }
    response.status(201).json({ orders, ...(orders.length === 1 ? { order: orders[0] } : {}) })
  } catch (error) {
    return next(error)
  }
})

ordersRouter.get('/:id/messages', requireUser, async (request, response, next) => {
  try {
    const orderId = orderIdSchema.parse(request.params.id)
    const sql = getDatabase()
    const [access] = await sql`
      select o.id from public.pedidos o
      where o.id = ${orderId}
        and (o.cliente_id = ${request.user.id} or exists (
          select 1 from public.itens_pedido i
          where i.pedido_id = o.id and i.fornecedor_id = ${request.user.id}
        ))
      limit 1
    `
    if (!access) return response.status(404).json({ message: 'Conversa nao encontrada.' })

    const messages = await sql`
      select m.id, m.texto, m.created_at, m.autor_id,
        p.nome as autor_nome, p.tipo_perfil as autor_tipo
      from public.mensagens_pedido m
      join public.perfis p on p.id = m.autor_id
      where m.pedido_id = ${orderId}
      order by m.created_at asc, m.id asc
      limit 200
    `
    return response.json({ messages })
  } catch (error) {
    return next(error)
  }
})

ordersRouter.post('/:id/messages', requireUser, async (request, response, next) => {
  try {
    const orderId = orderIdSchema.parse(request.params.id)
    const texto = z.string().trim().min(1, 'Digite uma mensagem.').max(2000, 'A mensagem deve ter no maximo 2.000 caracteres.').parse(request.body?.texto)
    const sql = getDatabase()
    const [access] = await sql`
      select o.id from public.pedidos o
      where o.id = ${orderId}
        and o.status not in ('cancelado', 'recusado')
        and (o.cliente_id = ${request.user.id} or exists (
          select 1 from public.itens_pedido i
          where i.pedido_id = o.id and i.fornecedor_id = ${request.user.id}
        ))
      limit 1
    `
    if (!access) return response.status(404).json({ message: 'Conversa nao encontrada.' })

    const [message] = await sql`
      insert into public.mensagens_pedido (pedido_id, autor_id, texto)
      values (${orderId}, ${request.user.id}, ${texto})
      returning id, texto, created_at, autor_id
    `
    return response.status(201).json({
      message: { ...message, autor_nome: request.user.nome, autor_tipo: request.user.tipo_perfil },
    })
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
