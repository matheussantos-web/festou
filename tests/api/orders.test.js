import { afterAll, describe, expect, it } from 'vitest'
import { cleanupTestData, createAccount, createProduct } from '../helpers/api.js'

afterAll(cleanupTestData)

describe('pedidos de orcamento', () => {
  it('cria um pedido e devolve o mesmo formato da listagem', async () => {
    const supplier = await createAccount('fornecedor')
    const customer = await createAccount('cliente')
    const product = await createProduct(supplier, { preco: 120.5 })

    const created = await customer.client.post('/api/orders').send({
      items: [{ produto_id: product.id, quantidade: 2 }],
      observacao: 'Entrega combinada para o dia da festa.',
    })

    expect(created.status).toBe(201)
    expect(created.body.order).toMatchObject({
      status: 'solicitado',
      observacao: 'Entrega combinada para o dia da festa.',
    })

    // Regressão: a resposta de criação precisa trazer created_at e o id dos itens,
    // senao a tela do carrinho quebra ao formatar a data do pedido recem-criado.
    expect(created.body.order.created_at).toBeTruthy()
    expect(Number.isNaN(new Date(created.body.order.created_at).getTime())).toBe(false)
    expect(created.body.order.itens).toHaveLength(1)
    expect(created.body.order.itens[0].id).toBeTruthy()
    expect(Number(created.body.order.total_estimado)).toBe(241)

    const listed = await customer.client.get('/api/orders')
    const persisted = listed.body.orders.find((order) => order.id === created.body.order.id)

    expect(persisted).toBeDefined()
    expect(persisted.created_at).toBeTruthy()
    expect(persisted.itens[0].id).toBe(created.body.order.itens[0].id)
  })

  it('recusa pedido sem itens ou com quantidade invalida', async () => {
    const customer = await createAccount('cliente')

    const empty = await customer.client.post('/api/orders').send({ items: [] })
    expect(empty.status).toBe(400)

    const supplier = await createAccount('fornecedor')
    const product = await createProduct(supplier)

    const invalid = await customer.client.post('/api/orders').send({
      items: [{ produto_id: product.id, quantidade: 0 }],
    })
    expect(invalid.status).toBe(400)
  })

  it('recusa pedido com produto pausado', async () => {
    const supplier = await createAccount('fornecedor')
    const customer = await createAccount('cliente')
    const product = await createProduct(supplier)

    await supplier.client.patch(`/api/supplier/products/${product.id}/toggle-active`)

    const response = await customer.client.post('/api/orders').send({
      items: [{ produto_id: product.id, quantidade: 1 }],
    })

    expect(response.status).toBe(400)
  })

  it('impede que fornecedores criem pedidos', async () => {
    const supplier = await createAccount('fornecedor')
    const product = await createProduct(supplier)

    const response = await supplier.client.post('/api/orders').send({
      items: [{ produto_id: product.id, quantidade: 1 }],
    })

    expect(response.status).toBe(403)
  })

  it('permite ao fornecedor negociar, confirmar e recusar o pedido', async () => {
    const supplier = await createAccount('fornecedor')
    const customer = await createAccount('cliente')
    const product = await createProduct(supplier)

    const created = await customer.client.post('/api/orders').send({
      items: [{ produto_id: product.id, quantidade: 1 }],
    })
    const orderId = created.body.order.id

    const negotiating = await supplier.client.patch(`/api/orders/${orderId}/status`)
      .send({ status: 'em_negociacao' })
    expect(negotiating.status).toBe(200)
    expect(negotiating.body.order.status).toBe('em_negociacao')

    const confirmed = await supplier.client.patch(`/api/orders/${orderId}/status`)
      .send({ status: 'confirmado' })
    expect(confirmed.body.order.status).toBe('confirmado')

    const refused = await supplier.client.patch(`/api/orders/${orderId}/status`)
      .send({ status: 'recusado' })
    expect(refused.status).toBe(400)
  })

  it('restringe o cliente a cancelar ou concluir o proprio pedido', async () => {
    const supplier = await createAccount('fornecedor')
    const customer = await createAccount('cliente')
    const stranger = await createAccount('cliente')
    const product = await createProduct(supplier)

    const created = await customer.client.post('/api/orders').send({
      items: [{ produto_id: product.id, quantidade: 1 }],
    })
    const orderId = created.body.order.id

    const forbidden = await customer.client.patch(`/api/orders/${orderId}/status`)
      .send({ status: 'confirmado' })
    expect(forbidden.status).toBe(403)

    const otherCustomer = await stranger.client.patch(`/api/orders/${orderId}/status`)
      .send({ status: 'cancelado' })
    expect(otherCustomer.status).toBe(403)

    const cancelled = await customer.client.patch(`/api/orders/${orderId}/status`)
      .send({ status: 'cancelado' })
    expect(cancelled.body.order.status).toBe('cancelado')
  })

  it('mostra ao fornecedor apenas os pedidos com produtos dele', async () => {
    const supplier = await createAccount('fornecedor')
    const otherSupplier = await createAccount('fornecedor')
    const customer = await createAccount('cliente')
    const product = await createProduct(supplier)

    await customer.client.post('/api/orders').send({
      items: [{ produto_id: product.id, quantidade: 1 }],
    })

    const mine = await otherSupplier.client.get('/api/orders')
    expect(mine.status).toBe(200)
    expect(mine.body.orders).toEqual([])
  })

  it('mascara o e-mail do cliente ate o pedido ser confirmado', async () => {
    const supplier = await createAccount('fornecedor')
    const customer = await createAccount('cliente')
    const product = await createProduct(supplier)

    const created = await customer.client.post('/api/orders').send({
      items: [{ produto_id: product.id, quantidade: 1 }],
    })
    const orderId = created.body.order.id

    const pendente = await supplier.client.get('/api/orders')
    const pedidoPendente = pendente.body.orders.find((o) => o.id === orderId)
    expect(pedidoPendente.cliente_email).toBe(`t***${customer.email.slice(customer.email.indexOf('@'))}`)

    await supplier.client.patch(`/api/orders/${orderId}/status`).send({ status: 'confirmado' })

    const confirmado = await supplier.client.get('/api/orders')
    expect(confirmado.body.orders.find((o) => o.id === orderId).cliente_email).toBe(customer.email)
  })
})
