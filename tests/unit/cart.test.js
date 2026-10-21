import { beforeEach, describe, expect, it, vi } from 'vitest'

class MemoryStorage {
  constructor() {
    this.store = new Map()
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null
  }

  setItem(key, value) {
    this.store.set(key, String(value))
  }

  removeItem(key) {
    this.store.delete(key)
  }

  clear() {
    this.store.clear()
  }

  key(index) {
    return [...this.store.keys()][index] ?? null
  }

  get length() {
    return this.store.size
  }
}

const storage = new MemoryStorage()

async function loadCart() {
  vi.resetModules()
  vi.stubGlobal('localStorage', storage)

  return import('../../src/lib/cart.js')
}

const produto = {
  id: '11111111-1111-1111-1111-111111111111',
  nome: 'Bolo de chocolate',
  categoria: 'bolos',
  preco: 49.9,
  imagem_url: null,
}

beforeEach(() => {
  storage.clear()
})

describe('carrinho', () => {
  it('adiciona produtos ao carrinho e soma quantidades', async () => {
    const { addToCart, cartCount, cartItems } = await loadCart()

    addToCart(produto)
    addToCart(produto)

    expect(cartItems.value).toHaveLength(1)
    expect(cartItems.value[0].quantidade).toBe(2)
    expect(cartCount.value).toBe(2)
  })

  it('respeita o limite de 20 unidades por produto', async () => {
    const { addToCart, cartItems } = await loadCart()

    for (let index = 0; index < 25; index += 1) addToCart(produto)

    expect(cartItems.value[0].quantidade).toBe(20)
  })

  it('altera e remove itens', async () => {
    const { addToCart, cartItems, removeFromCart, setCartQuantity } = await loadCart()

    addToCart(produto)
    setCartQuantity(produto.id, 3)
    expect(cartItems.value[0].quantidade).toBe(3)

    setCartQuantity(produto.id, 0)
    expect(cartItems.value[0].quantidade).toBe(1)

    removeFromCart(produto.id)
    expect(cartItems.value).toHaveLength(0)
  })

  it('calcula o total em centavos sem erro de ponto flutuante', async () => {
    const { addToCart, cartTotalCents } = await loadCart()

    addToCart({ ...produto, id: 'a', preco: 0.1 })
    addToCart({ ...produto, id: 'b', preco: 0.2 })

    expect(cartTotalCents.value).toBe(30)
  })

  it('ignora carrinhos corrompidos gravados no armazenamento', async () => {
    storage.setItem('festou-cart', '{nao-e-json')

    const { cartItems } = await loadCart()

    expect(cartItems.value).toEqual([])
  })

  it('descarta itens invalidos vindos do armazenamento', async () => {
    storage.setItem('festou-cart', JSON.stringify([
      { id: 1, nome: 'Sem id string', preco: 10, quantidade: 1 },
      { id: 'b', nome: 'ok', preco: 10, quantidade: 1 },
      { id: 'c', nome: 'sem preco', preco: 'abc', quantidade: 1 },
      { id: 'd', nome: 'quantidade zero', preco: 10, quantidade: 0 },
    ]))

    const { cartItems } = await loadCart()

    expect(cartItems.value.map((item) => item.id)).toEqual(['b'])
  })
})
