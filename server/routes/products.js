import { Router } from 'express'
import { z } from 'zod'
import { getDatabase } from '../db.js'
import { requireUser } from '../middleware/session.js'
import { buildUpdate } from '../sql/buildUpdate.js'
import { categorySchema, productSchema, productUpdateSchema } from '../schemas/products.js'

export const productsRouter = Router()
export const supplierProductsRouter = Router()

const productIdSchema = z.string().uuid('Identificador do produto inválido.')

const defaultPageSize = 24
const pageSchema = z.coerce.number().int('A pagina precisa ser um numero inteiro.').min(1).max(10_000)
const limitSchema = z.coerce.number().int('O limite precisa ser um numero inteiro.').min(1).max(60)

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
    const pagina = pageSchema.parse(request.query.pagina ?? 1)
    const limite = limitSchema.parse(request.query.limite ?? defaultPageSize)
    const offset = (pagina - 1) * limite
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
        select id, nome, descricao, categoria, preco, cidade, imagem_url, created_at
        from public.produtos
        where ativo = true and categoria = ${category}
        order by created_at desc, id
        limit ${limite} offset ${offset}
      `
      : await sql`
        select id, nome, descricao, categoria, preco, cidade, imagem_url, created_at
        from public.produtos
        where ativo = true
        order by created_at desc, id
        limit ${limite} offset ${offset}
      `

    const totalPaginas = Math.max(1, Math.ceil(total / limite))

    response.json({
      products,
      pagination: {
        pagina,
        limite,
        total,
        totalPaginas,
        temMais: pagina < totalPaginas,
      },
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
        fornecedor_id, nome, categoria, descricao, preco, cidade, imagem_url
      ) values (
        ${request.user.id}, ${input.nome}, ${input.categoria}, ${input.descricao},
        ${input.preco}, ${input.cidade}, ${input.imagem_url}
      )
      returning id, nome, categoria, descricao, preco, cidade, imagem_url, created_at
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
      select id, nome, categoria, descricao, preco, cidade, imagem_url, ativo, created_at
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
      select id, nome, categoria, descricao, preco, cidade, imagem_url, ativo, created_at
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
      ['nome', 'categoria', 'descricao', 'preco', 'cidade', 'imagem_url'],
      input,
    )

    const sql = getDatabase()
    const [product] = await sql.query(
      `update public.produtos
       set ${assignments.join(', ')}
       where id = $${values.length + 1} and fornecedor_id = $${values.length + 2}
       returning id, nome, categoria, descricao, preco, cidade, imagem_url, ativo, created_at`,
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
