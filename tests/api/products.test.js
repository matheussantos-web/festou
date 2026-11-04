import { afterAll, describe, expect, it } from 'vitest'
import { cleanupTestData, createAccount, createProduct } from '../helpers/api.js'

afterAll(cleanupTestData)

describe('vitrine de produtos', () => {
  it('exibe na vitrine pública apenas os produtos ativos', async () => {
    const supplier = await createAccount('fornecedor')
    const product = await createProduct(supplier)

    const list = await supplier.client.get('/api/products')
    expect(list.status).toBe(200)
    expect(list.body.products.some((item) => item.id === product.id)).toBe(true)

    const toggle = await supplier.client.patch(`/api/supplier/products/${product.id}/toggle-active`)
    expect(toggle.status).toBe(200)
    expect(toggle.body.product.ativo).toBe(false)

    const afterPause = await supplier.client.get('/api/products')
    expect(afterPause.body.products.some((item) => item.id === product.id)).toBe(false)

    const reactivate = await supplier.client.patch(`/api/supplier/products/${product.id}/toggle-active`)
    expect(reactivate.body.product.ativo).toBe(true)
  })

  it('filtra a vitrine por categoria', async () => {
    const supplier = await createAccount('fornecedor')
    const product = await createProduct(supplier, { categoria: 'doces' })

    const list = await supplier.client.get('/api/products?categoria=doces')

    expect(list.status).toBe(200)
    expect(list.body.products.every((item) => item.categoria === 'doces')).toBe(true)
    expect(list.body.products.some((item) => item.id === product.id)).toBe(true)
  })

  it('recusa categoria desconhecida', async () => {
    const supplier = await createAccount('fornecedor')

    const response = await supplier.client.get('/api/products?categoria=inexistente')

    expect(response.status).toBe(400)
  })

  it('pagina a vitrine e informa o total', async () => {
    const supplier = await createAccount('fornecedor')

    // A vitrine e publica e o banco de desenvolvimento pode ja ter produtos
    // nessa categoria. A linha de base evita um teste que so passa em banco
    // vazio (e quebrava depois de uma execucao interrompida).
    const baseline = await supplier.client.get('/api/products?categoria=brinquedos&limite=60')
    const baselineTotal = baseline.body.pagination.total

    const created = []
    for (let index = 0; index < 3; index += 1) {
      created.push(await createProduct(supplier, { categoria: 'brinquedos' }))
    }

    const firstPage = await supplier.client.get('/api/products?categoria=brinquedos&pagina=1&limite=2')
    expect(firstPage.status).toBe(200)
    expect(firstPage.body.products).toHaveLength(2)
    expect(firstPage.body.pagination).toMatchObject({
      pagina: 1,
      limite: 2,
      total: baselineTotal + 3,
      totalPaginas: Math.ceil((baselineTotal + 3) / 2),
      temMais: true,
    })

    const ids = []
    let pagina = 1
    let temMais = true
    while (temMais) {
      const page = await supplier.client.get(`/api/products?categoria=brinquedos&pagina=${pagina}&limite=2`)
      ids.push(...page.body.products.map((item) => item.id))
      temMais = page.body.pagination.temMais
      pagina += 1
    }

    expect(ids).toHaveLength(baselineTotal + 3)
    expect(new Set(ids).size).toBe(ids.length)
    expect(created.every((product) => ids.includes(product.id))).toBe(true)
  })

  it('devolve pagina vazia quando passa do fim', async () => {
    const supplier = await createAccount('fornecedor')

    const response = await supplier.client.get('/api/products?pagina=999&limite=12')

    expect(response.status).toBe(200)
    expect(response.body.products).toEqual([])
    expect(response.body.pagination.temMais).toBe(false)
  })

  it('recusa pagina e limite invalidos', async () => {
    const supplier = await createAccount('fornecedor')

    const zero = await supplier.client.get('/api/products?pagina=0')
    expect(zero.status).toBe(400)

    const bigLimit = await supplier.client.get('/api/products?limite=500')
    expect(bigLimit.status).toBe(400)

    const text = await supplier.client.get('/api/products?pagina=abc')
    expect(text.status).toBe(400)
  })

  it('consulta apenas os produtos do carrinho, inclusive fora da primeira pagina', async () => {
    const supplier = await createAccount('fornecedor')
    const product = await createProduct(supplier)
    const paused = await createProduct(supplier)
    await supplier.client.patch(`/api/supplier/products/${paused.id}/toggle-active`)

    const response = await supplier.client.get(
      `/api/products/lookup?ids=${product.id},${paused.id}`,
    )

    expect(response.status).toBe(200)
    expect(response.body.products.map((item) => item.id)).toEqual([product.id])
    expect(Number(response.body.products[0].preco)).toBe(99.9)
  })

  it('recusa ids invalidos na consulta do carrinho', async () => {
    const supplier = await createAccount('fornecedor')

    const invalido = await supplier.client.get('/api/products/lookup?ids=nao-e-uuid')
    expect(invalido.status).toBe(400)

    const vazio = await supplier.client.get('/api/products/lookup?ids=')
    expect(vazio.status).toBe(400)
  })

  it('impede que clientes publiquem produtos', async () => {
    const customer = await createAccount('cliente')

    const response = await customer.client.post('/api/products').send({
      nome: 'Produto indevido',
      categoria: 'bolos',
      descricao: 'Produto que um cliente nao deveria conseguir publicar.',
      preco: 10,
    })

    expect(response.status).toBe(403)
  })

  it('impede que um fornecedor altere produtos de outro fornecedor', async () => {
    const owner = await createAccount('fornecedor')
    const stranger = await createAccount('fornecedor')
    const product = await createProduct(owner)

    const response = await stranger.client.patch(`/api/supplier/products/${product.id}/toggle-active`)

    expect(response.status).toBe(404)
  })

  it('devolve o catalogo completo do fornecedor, incluindo produtos pausados', async () => {
    const supplier = await createAccount('fornecedor')
    const product = await createProduct(supplier)

    await supplier.client.patch(`/api/supplier/products/${product.id}/toggle-active`)

    const response = await supplier.client.get('/api/supplier/products')

    expect(response.status).toBe(200)
    const found = response.body.products.find((item) => item.id === product.id)
    expect(found).toBeDefined()
    expect(found.ativo).toBe(false)
  })

  it('pausa e reativa o produto sem depender do estado anterior', async () => {
    const supplier = await createAccount('fornecedor')
    const product = await createProduct(supplier)

    const paused = await supplier.client
      .patch(`/api/supplier/products/${product.id}/toggle-active`)
      .send({ ativo: false })
    expect(paused.status).toBe(200)
    expect(paused.body.product.ativo).toBe(false)

    // Repetir o mesmo pedido nao deve reativar o produto por engano.
    const pausedAgain = await supplier.client
      .patch(`/api/supplier/products/${product.id}/toggle-active`)
      .send({ ativo: false })
    expect(pausedAgain.body.product.ativo).toBe(false)

    const activeAgain = await supplier.client
      .patch(`/api/supplier/products/${product.id}/toggle-active`)
      .send({ ativo: true })
    expect(activeAgain.body.product.ativo).toBe(true)
  })
})

describe('gestão do catálogo do fornecedor', () => {
  it('edita um produto do próprio fornecedor', async () => {
    const supplier = await createAccount('fornecedor')
    const product = await createProduct(supplier)

    const response = await supplier.client.patch(`/api/supplier/products/${product.id}`).send({
      nome: 'Bolo de chocolate actualizado',
      preco: 129.9,
    })

    expect(response.status).toBe(200)
    expect(response.body.product.nome).toBe('Bolo de chocolate actualizado')
    expect(Number(response.body.product.preco)).toBe(129.9)
    expect(response.body.product.categoria).toBe(product.categoria)
  })

  it('impede que um fornecedor edite produto de outro', async () => {
    const owner = await createAccount('fornecedor')
    const stranger = await createAccount('fornecedor')
    const product = await createProduct(owner)

    const response = await stranger.client.patch(`/api/supplier/products/${product.id}`).send({
      nome: 'Produto roubado',
    })

    expect(response.status).toBe(404)
  })

  it('exclui um produto do próprio fornecedor', async () => {
    const supplier = await createAccount('fornecedor')
    const product = await createProduct(supplier)

    const response = await supplier.client.delete(`/api/supplier/products/${product.id}`)

    expect(response.status).toBe(200)
    expect(response.body.message).toContain(product.nome)

    const list = await supplier.client.get('/api/supplier/products')
    expect(list.body.products.some((item) => item.id === product.id)).toBe(false)
  })

  it('impede que um fornecedor exclua produto de outro', async () => {
    const owner = await createAccount('fornecedor')
    const stranger = await createAccount('fornecedor')
    const product = await createProduct(owner)

    const response = await stranger.client.delete(`/api/supplier/products/${product.id}`)

    expect(response.status).toBe(404)
  })

  it('recusa imagem fora de https', async () => {
    const supplier = await createAccount('fornecedor')

    const response = await supplier.client.post('/api/products').send({
      nome: 'Produto com imagem insegura',
      categoria: 'bolos',
      descricao: 'Produto com link de imagem que nao usa https.',
      preco: 50,
      imagem_url: 'http://exemplo.com/foto.jpg',
    })

    expect(response.status).toBe(400)
    expect(response.body.message).toContain('https')
  })

  it('aceita imagem em https', async () => {
    const supplier = await createAccount('fornecedor')

    const response = await supplier.client.post('/api/products').send({
      nome: 'Produto com imagem segura',
      categoria: 'bolos',
      descricao: 'Produto com link de imagem que usa https.',
      preco: 50,
      imagem_url: 'https://exemplo.com/foto.jpg',
    })

    expect(response.status).toBe(201)
    expect(response.body.product.imagem_url).toBe('https://exemplo.com/foto.jpg')
  })
})
