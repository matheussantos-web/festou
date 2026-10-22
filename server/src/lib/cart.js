import { computed, ref, watch } from 'vue'

const storageKey = 'festou-cart'

function readCart() {
  try {
    const storedItems = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    if (!Array.isArray(storedItems)) return []

    return storedItems.filter((item) => (
      typeof item.id === 'string'
      && typeof item.nome === 'string'
      && Number.isFinite(Number(item.preco))
      && Number.isInteger(item.quantidade)
      && item.quantidade >= 1
      && item.quantidade <= 20
    )).map((item) => ({ ...item, preco: Number(item.preco) }))
  } catch {
    return []
  }
}

export const cartItems = ref(readCart())

watch(cartItems, (items) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(items))
  } catch {
    // Keep the in-memory cart usable when browser storage is unavailable.
  }
}, { deep: true })

export const cartCount = computed(() => cartItems.value.reduce((count, item) => count + item.quantidade, 0))
export const cartTotalCents = computed(() => cartItems.value.reduce(
  (total, item) => total + Math.round(item.preco * 100) * item.quantidade,
  0,
))

export function addToCart(product) {
  const existingItem = cartItems.value.find((item) => item.id === product.id)

  if (existingItem) {
    existingItem.quantidade = Math.min(existingItem.quantidade + 1, 20)
    return
  }

  cartItems.value.push({
    id: product.id,
    nome: product.nome,
    categoria: product.categoria,
    preco: Number(product.preco),
    imagem_url: product.imagem_url,
    quantidade: 1,
  })
}

export function setCartQuantity(productId, quantity) {
  const item = cartItems.value.find((cartItem) => cartItem.id === productId)
  if (!item) return

  item.quantidade = Math.min(20, Math.max(1, Math.trunc(Number(quantity) || 1)))
}

export function removeFromCart(productId) {
  cartItems.value = cartItems.value.filter((item) => item.id !== productId)
}

// Compara o carrinho salvo no navegador com a vitrine atual. O servidor sempre
// recalcula os precos no envio do orcamento; aqui o aviso chega antes, para o
// cliente nao descobrir a diferenca so na resposta.
export function syncWithCatalog(products) {
  const byId = new Map(products.map((product) => [product.id, product]))
  const changed = []
  const removed = []

  for (const item of cartItems.value) {
    const product = byId.get(item.id)

    if (!product) {
      removed.push(item)
      continue
    }

    const currentPrice = Number(product.preco)
    if (Math.round(currentPrice * 100) !== Math.round(item.preco * 100)) {
      changed.push({ nome: item.nome, de: item.preco, para: currentPrice })
      item.preco = currentPrice
    }

    item.nome = product.nome
  }

  if (removed.length > 0) {
    const removedIds = new Set(removed.map((item) => item.id))
    cartItems.value = cartItems.value.filter((item) => !removedIds.has(item.id))
  }

  return { changed, removed }
}

export function clearCart() {
  cartItems.value = []
}