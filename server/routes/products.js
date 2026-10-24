import { Router } from 'express'
import { z } from 'zod'
import { getDatabase } from '../db.js'
import { requireUser } from '../middleware/session.js'
import { buildUpdate } from '../sql/buildUpdate.js'
import { buildPagination, readPagination } from '../schemas/pagination.js'
import { categorySchema, productSchema, productUpdateSchema } from '../schemas/products.js'

export const productsRouter = Router()
export const supplierProductsRouter = Router()

const productIdSchema = z.string().uuid('Identificador do produto inválido.')

const defaultPageSize = 24

const toggleActiveSchema = z.object({
  ativo: z.boolean().optional(),
})

function requireFornecedor(request, response, mensagem) {
  if (request.user.tipo_perfil !== 'fornecedor') {
    response.status(403).json({ message: mensagem })
    return false
  }
  return true
}

productsRouter.get('/', async (request, response, next) => {
  try {
    const category = request.query.categoria
      ? categorySchema.parse(request.query.categoria)
      : null
    const { pagina, limite, offset } = readPagination(request.query, { defaultLimit: defaultPageSize })
    const sql = getDatabase()

    const [{ total }] = category
      ? await sql`
        select count(*)::int as total
        from public.produtos
        where ativo = true and categoria = ${category}
      `
      : await sql`
        select count(*)::int as total
        from public.produtos
        where ativo = true
      `

    const products = category
      ? await sql`
        select id, nome, descricao, categoria, preco, cidade, imagem_url, imagens_url, created_at
        from public.produtos
        where ativo = true and categoria = ${category}
        order by created_at desc, id
        limit ${limite} offset ${offset}
      `
      : await sql`
        select id, nome, descricao, categoria, preco, cidade, imagem_url, imagens_url, created_at
        from public.produtos
        where ativo = true
        order by created_at desc, id
        limit ${limite} offset ${offset}
      `

    response.json({
      products,
      pagination: buildPagination({ pagina, limite, total }),
    })
  } catch (error) {
    next(error)
  }
})

productsRouter.get('/:id', async (request, response, next) => {
  try {
    const productId = productIdSchema.parse(request.params.id)
    const sql = getDatabase()
    const [product] = await sql`
      select id, nome, categoria, descricao, preco, cidade, imagem_url, imagens_url, created_at,
             fornecedor_id
      from public.produtos
      where id = ${productId} and ativo = true
      limit 1
    `

    if (!product) return response.status(404).json({ message: 'Produto nao encontrado na vitrine.' })

    const [supplierRows, reviewSummaryRows, reviews] = await Promise.all([
      sql`
        select id, nome, avatar_url, cover_url, biografia, whatsapp,
               instagram_url, facebook_url, site_url
        from public.perfis
        where id = ${product.fornecedor_id} and tipo_perfil = 'fornecedor'
        limit 1
      `,
      sql`
        select count(*)::int as total,
               coalesce(round(avg(nota)::numeric, 1), 0)::float as media
        from public.avaliacoes_fornecedor
        where fornecedor_id = ${product.fornecedor_id}
      `,
      sql`
        select a.id, a.nota, a.comentario, a.created_at, p.nome as cliente_nome
        from public.avaliacoes_fornecedor a
        join public.perfis p on p.id = a.cliente_id
        where a.fornecedor_id = ${product.fornecedor_id}
        order by a.created_at desc
        limit 10
      `,
    ])

    const { fornecedor_id, ...publicProduct } = product
    response.json({
      product: publicProduct,
      supplier: supplierRows[0] ?? null,
      review_summary: reviewSummaryRows[0] ?? { total: 0, media: 0 },
      reviews,
    })
  } catch (error) {
    next(error)
  }
})

productsRouter.post('/', requireUser, async (request, response, next) => {
  try {
    if (request.user.tipo_perfil !== 'fornecedor') {
      return response.status(403).json({ message: 'Somente fornecedores podem anunciar produtos.' })
    }

    const input = productSchema.parse(request.body)
    const sql = getDatabase()
    const [product] = await sql`
      insert into public.produtos (
        fornecedor_id, nome, categoria, descricao, preco, cidade, imagem_url, imagens_url
      ) values (
        ${request.user.id}, ${input.nome}, ${input.categoria}, ${input.descricao},
        ${input.preco}, ${input.cidade}, ${input.imagem_url}, ${input.imagens_url}
      )
      returning id, nome, categoria, descricao, preco, cidade, imagem_url, imagens_url, created_at
    `

    response.status(201).json({ product })
  } catch (error) {
    next(error)
  }
})

supplierProductsRouter.get('/', requireUser, async (request, response, next) => {
  try {
    if (!requireFornecedor(request, response, 'Apenas fornecedores podem consultar esta lista.')) return

    const sql = getDatabase()
    const products = await sql`
      select id, nome, categoria, descricao, preco, cidade, imagem_url, imagens_url, ativo, created_at
      from public.produtos
      where fornecedor_id = ${request.user.id}
      order by created_at desc
    `

    response.json({ products })
  } catch (error) {
    next(error)
  }
})

supplierProductsRouter.patch('/:id/toggle-active', requireUser, async (request, response, next) => {
  try {
    if (!requireFornecedor(request, response, 'Apenas fornecedores podem alterar produtos.')) return

    const productId = productIdSchema.parse(request.params.id)
    // Aceita "ativo" explicito para a operacao ser idempotente; sem o campo,
    // alterna o estado atual.
    const input = toggleActiveSchema.parse(request.body ?? {})
    const sql = getDatabase()

    const [product] = input.ativo === undefined
      ? await sql`
        update public.produtos
        set ativo = not ativo
        where id = ${productId} and fornecedor_id = ${request.user.id}
        returning id, nome, ativo
      `
      : await sql`
        update public.produtos
        set ativo = ${input.ativo}
        where id = ${productId} and fornecedor_id = ${request.user.id}
        returning id, nome, ativo
      `

    if (!product) {
      return response.status(404).json({ message: 'Produto não encontrado ou permissão negada.' })
    }

    const message = product.ativo
      ? `O produto "${product.nome}" foi ativado na vitrine.`
      : `O produto "${product.nome}" foi pausado.`

    response.json({ message, product })
  } catch (error) {
    next(error)
  }
})

supplierProductsRouter.get('/:id', requireUser, async (request, response, next) => {
  try {
    if (!requireFornecedor(request, response, 'Apenas fornecedores podem consultar esta lista.')) return

    const productId = productIdSchema.parse(request.params.id)
    const sql = getDatabase()
    const [product] = await sql`
      select id, nome, categoria, descricao, preco, cidade, imagem_url, imagens_url, ativo, created_at
      from public.produtos
      where id = ${productId} and fornecedor_id = ${request.user.id}
      limit 1
    `

    if (!product) {
      return response.status(404).json({ message: 'Produto não encontrado ou permissão negada.' })
    }

    response.json({ product })
  } catch (error) {
    next(error)
  }
})

supplierProductsRouter.patch('/:id', requireUser, async (request, response, next) => {
  try {
    if (!requireFornecedor(request, response, 'Apenas fornecedores podem alterar produtos.')) return

    const productId = productIdSchema.parse(request.params.id)
    const input = productUpdateSchema.parse(request.body)
    const { assignments, values } = buildUpdate(
      ['nome', 'categoria', 'descricao', 'preco', 'cidade', 'imagem_url', 'imagens_url'],
      input,
    )

    const sql = getDatabase()
    const [product] = await sql.query(
      `update public.produtos
       set ${assignments.join(', ')}
       where id = $${values.length + 1} and fornecedor_id = $${values.length + 2}
       returning id, nome, categoria, descricao, preco, cidade, imagem_url, imagens_url, ativo, created_at`,
      [...values, productId, request.user.id],
    )

    if (!product) {
      return response.status(404).json({ message: 'Produto não encontrado ou permissão negada.' })
    }

    response.json({ message: 'Produto atualizado com sucesso.', product })
  } catch (error) {
    next(error)
  }
})

supplierProductsRouter.delete('/:id', requireUser, async (request, response, next) => {
  try {
    if (!requireFornecedor(request, response, 'Apenas fornecedores podem excluir produtos.')) return

    const productId = productIdSchema.parse(request.params.id)
    const sql = getDatabase()
    const [product] = await sql`
      delete from public.produtos
      where id = ${productId} and fornecedor_id = ${request.user.id}
      returning id, nome
    `

    if (!product) {
      return response.status(404).json({ message: 'Produto não encontrado ou permissão negada.' })
    }

    response.json({ message: `O produto "${product.nome}" foi excluído do catálogo.` })
  } catch (error) {
    next(error)
  }
})
