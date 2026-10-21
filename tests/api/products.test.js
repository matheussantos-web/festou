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
})
