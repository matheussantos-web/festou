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
    const created = []

    for (let index = 0; index < 3; index += 1) {
      created.push(await createProduct(supplier, { categoria: 'brinquedos' }))
    }

    const firstPage = await supplier.client.get('/api/products?categoria=brinquedos&pagina=1&limite=2')
    expect(firstPage.status).toBe(200)
    expect(firstPage.body.products).toHaveLength(2)
    expect(firstPage.body.pagination).toMatchObject({ pagina: 1, limite: 2, total: 3, totalPaginas: 2, temMais: true })

    const secondPage = await supplier.client.get('/api/products?categoria=brinquedos&pagina=2&limite=2')
    expect(secondPage.body.products).toHaveLength(1)
    expect(secondPage.body.pagination).toMatchObject({ pagina: 2, temMais: false })

    const ids = [...firstPage.body.products, ...secondPage.body.products].map((item) => item.id)
    expect(new Set(ids).size).toBe(3)
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
