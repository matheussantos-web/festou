<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, asArray } from '../lib/api'
import { addToCart } from '../lib/cart'
import { formatPrice } from '../lib/format'

const route = useRoute()
const router = useRouter()
const products = ref([])
const categoryFilter = ref('')
const searchQuery = ref('')
const isLoading = ref(true)
const errorMessage = ref('')
const addedProductId = ref(null)

const categories = [
  { value: '', label: 'Todos os produtos', icon: '✨' },
  { value: 'bolos', label: 'Bolos', icon: '🎂' },
  { value: 'doces', label: 'Doces', icon: '🍬' },
  { value: 'brinquedos', label: 'Brinquedos', icon: '🎈' },
  { value: 'convites', label: 'Convites digitais', icon: '💌' },
]

async function loadProducts() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const query = categoryFilter.value
      ? `?categoria=${encodeURIComponent(categoryFilter.value)}`
      : ''
    const { products: result } = await api(`/products${query}`)
    products.value = asArray(result)
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível carregar os produtos.'
  } finally {
    isLoading.value = false
  }
}

const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) return products.value
  const term = searchQuery.value.toLowerCase()
  return products.value.filter((p) => {
    const nome = String(p.nome ?? '').toLowerCase()
    const descricao = String(p.descricao ?? '').toLowerCase()
    const cidade = String(p.cidade ?? '').toLowerCase()

    return nome.includes(term) || descricao.includes(term) || cidade.includes(term)
  })
})

function handleAddToCart(product) {
  addToCart(product)
  addedProductId.value = product.id
  window.setTimeout(() => {
    if (addedProductId.value === product.id) {
      addedProductId.value = null
    }
  }, 1800)
}

function syncCategoryFromRoute() {
  const requested = typeof route.query.categoria === 'string' ? route.query.categoria : ''
  const known = categories.some((category) => category.value === requested)

  categoryFilter.value = known ? requested : ''
}

watch(
  () => route.query.categoria,
  () => {
    syncCategoryFromRoute()
    loadProducts()
  },
  { immediate: true },
)

watch(categoryFilter, (value) => {
  const current = typeof route.query.categoria === 'string' ? route.query.categoria : ''
  if (value === current) return

  router.replace({ query: { ...route.query, categoria: value || undefined } })
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">

    <!-- Hero Header da Vitrine -->
    <section class="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-orange-50/60 via-white to-slate-50 py-12 md:py-16">
      <div class="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-festou-primary">
          <span>✨</span> Vitrine Oficial
        </span>
        <h1 class="mt-4 font-heading text-3xl font-extrabold text-festou-midnight sm:text-4xl lg:text-5xl">
          Tudo para tornar sua festa inesquecível
        </h1>
        <p class="mt-3 max-w-2xl text-base text-slate-600 sm:text-lg">
          Encontre bolos confeitados, docinhos, aluguel de brinquedos e convites de fornecedores da sua região.
        </p>

        <!-- Barra de Busca -->
        <div class="mt-8 max-w-xl">
          <label for="busca-vitrine" class="sr-only">Buscar produtos na vitrine</label>
          <div class="relative">
            <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400" aria-hidden="true">
              🔍
            </span>
            <input
              id="busca-vitrine"
              v-model="searchQuery"
              type="search"
              placeholder="Buscar por bolo, brigadeiro, pula-pula, cidade..."
              class="w-full rounded-full border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-festou-primary focus:ring-2 focus:ring-pink-100"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Conteúdo da Vitrine -->
    <main id="conteudo-principal" class="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
      <!-- Filtro de Categorias (Pills) -->
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-6" role="group" aria-label="Filtrar produtos por categoria">
        <button
          v-for="cat in categories"
          :key="cat.value"
          type="button"
          :aria-pressed="categoryFilter === cat.value"
          class="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all sm:text-sm"
          :class="categoryFilter === cat.value ? 'bg-festou-midnight text-white shadow-md' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'"
          @click="categoryFilter = cat.value"
        >
          <span aria-hidden="true">{{ cat.icon }}</span>
          <span>{{ cat.label }}</span>
        </button>
      </div>

      <!-- Alertas de perfil se houver -->
      <div v-if="route.query.aviso === 'fornecedor'" class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
        💡 O cadastro de produtos é exclusivo para contas de fornecedor. Crie uma conta de fornecedor ou faça login para anunciar.
      </div>
      <div v-else-if="route.query.aviso === 'carrinho'" class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
        💡 O carrinho e os orçamentos são exclusivos para clientes. Faça login com perfil de cliente para finalizar seu pedido.
      </div>

      <!-- Estados de Carregamento e Erro -->
      <div v-if="isLoading" role="status" class="py-20 text-center text-slate-600">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-festou-primary border-t-transparent" aria-hidden="true"></div>
        <p class="mt-3 text-sm font-medium">Carregando catálogo festivo...</p>
      </div>

      <div v-else-if="errorMessage" class="my-8 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
        <p class="font-bold">{{ errorMessage }}</p>
        <button type="button" class="mt-3 text-xs font-bold underline hover:text-rose-900" @click="loadProducts">
          Tentar novamente
        </button>
      </div>

      <!-- Grid de Produtos -->
      <div v-else-if="filteredProducts.length" class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <article
          v-for="product in filteredProducts"
          :key="product.id"
          class="festou-card group flex flex-col justify-between overflow-hidden"
        >
          <div>
            <!-- Imagem do Produto -->
            <div class="relative aspect-[4/3] w-full overflow-hidden bg-orange-100">
              <img
                v-if="product.imagem_url"
                :src="product.imagem_url"
                :alt="product.nome"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div v-else class="grid h-full w-full place-items-center bg-gradient-to-br from-pink-100 via-amber-50 to-orange-100 text-4xl font-extrabold text-festou-primary">
                {{ product.nome.slice(0, 2).toUpperCase() }}
              </div>
              <span class="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold text-festou-midnight shadow-sm backdrop-blur">
                {{ categories.find((c) => c.value === product.categoria)?.label || product.categoria }}
              </span>
            </div>

            <!-- Informações -->
            <div class="p-5">
              <h2 class="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-festou-primary">
                {{ product.nome }}
              </h2>
              <p class="mt-1.5 text-xs leading-relaxed text-slate-600 line-clamp-2">
                {{ product.descricao }}
              </p>
              <p v-if="product.cidade" class="mt-2 text-xs text-slate-400">
                📍 {{ product.cidade }}
              </p>
            </div>
          </div>

          <!-- Preço e Ação -->
          <div class="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 p-4">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preço</span>
              <p class="text-lg font-extrabold text-festou-primary">
                {{ formatPrice(product.preco) }}
              </p>
            </div>
            <button
              type="button"
              class="rounded-full px-4 py-2 text-xs font-bold transition shadow-sm"
              :class="addedProductId === product.id ? 'bg-emerald-600 text-white' : 'bg-festou-primary text-white hover:bg-rose-600'"
              @click="handleAddToCart(product)"
            >
              <span aria-live="polite">{{ addedProductId === product.id ? '✓ Adicionado' : '+ Carrinho' }}</span>
            </button>
          </div>
        </article>
      </div>

      <!-- Estado Vazio -->
      <div v-else class="my-12 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
        <span class="text-4xl">🎈</span>
        <h3 class="mt-4 font-heading text-2xl font-bold text-festou-midnight">Nenhum produto encontrado</h3>
        <p class="mt-2 text-sm text-slate-600">
          Não encontramos produtos para os filtros selecionados. Tente buscar por outro termo ou categoria.
        </p>
        <button
          type="button"
          class="mt-5 text-sm font-bold text-festou-primary underline hover:text-festou-purple"
          @click="searchQuery = ''; categoryFilter = ''"
        >
          Limpar busca e filtros
        </button>
      </div>
    </main>
  </div>
</template>
