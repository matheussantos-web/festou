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

export function clearCart() {
  cartItems.value = []
}