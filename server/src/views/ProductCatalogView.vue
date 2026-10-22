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
const isLoadingMore = ref(false)
const errorMessage = ref('')
const addedProductId = ref(null)
const page = ref(1)
const pagination = ref(null)

const pageSize = 12

const categories = [
  { value: '', label: 'Todos os produtos', icon: '✨' },
  { value: 'bolos', label: 'Bolos', icon: '🎂' },
  { value: 'doces', label: 'Doces', icon: '🍬' },
  { value: 'brinquedos', label: 'Brinquedos', icon: '🎈' },
  { value: 'convites', label: 'Convites digitais', icon: '💌' },
]

async function loadProducts({ append = false } = {}) {
  if (append) {
    isLoadingMore.value = true
  } else {
    isLoading.value = true
    page.value = 1
  }
  errorMessage.value = ''

  try {
    const params = new URLSearchParams()
    if (categoryFilter.value) params.set('categoria', categoryFilter.value)
    params.set('pagina', String(page.value))
    params.set('limite', String(pageSize))

    const result = await api(`/products?${params.toString()}`)
    const items = asArray(result.products)

    products.value = append ? [...products.value, ...items] : items
    pagination.value = result.pagination ?? null
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível carregar os produtos.'
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

async function loadMore() {
  if (isLoadingMore.value || !pagination.value?.temMais) return

  page.value += 1
  await loadProducts({ append: true })
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
  <div class="min-h-screen bg-festou-soft text-slate-900">

    <!-- Hero Header da Vitrine -->
    <section class="relative overflow-hidden bg-festou-night py-12 text-white md:py-16">
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-festou-midnight/70 via-festou-midnight/25 to-festou-midnight/35"></div>
      <div class="festou-confetti-field pointer-events-none absolute inset-0 opacity-20"></div>
      <div class="pointer-events-none absolute -right-16 top-0 h-64 w-64 animate-festou-float rounded-full bg-festou-magenta/30 blur-3xl"></div>

      <div class="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <span class="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur">
          <span aria-hidden="true">✨</span> Vitrine Oficial
        </span>
        <h1 class="mt-4 font-heading text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
          Tudo para tornar sua festa inesquecível
        </h1>
        <p class="mt-3 max-w-2xl text-base text-white/85 sm:text-lg">
          Encontre bolos confeitados, docinhos, aluguel de brinquedos e convites de fornecedores da sua região.
        </p>

        <!-- Barra de Busca -->
        <div class="mt-8 max-w-xl">
          <label for="busca-vitrine" class="sr-only">Buscar produtos na vitrine</label>
          <div class="relative">
            <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400" aria-hidden="true">
              🔍
            </span>
            <input
              id="busca-vitrine"
              v-model="searchQuery"
              type="search"
              placeholder="Buscar por bolo, brigadeiro, pula-pula, cidade..."
              class="w-full rounded-full border border-white/40 bg-white/90 py-3.5 pl-11 pr-4 text-sm text-slate-800 shadow-lg outline-none backdrop-blur transition focus:border-festou-magenta focus:ring-4 focus:ring-festou-magenta/25"
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
          class="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all duration-300 hover:-translate-y-0.5 sm:text-sm"
          :class="categoryFilter === cat.value ? 'bg-festou-night text-white shadow-festive-soft' : 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-festou-magenta/40 hover:text-festou-primary'"
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
          class="card-gradient group flex flex-col justify-between overflow-hidden"
        >
          <div>
            <!-- Imagem do Produto -->
            <div class="relative aspect-[4/3] w-full overflow-hidden bg-festou-soft">
              <img
                v-if="product.imagem_url"
                :src="product.imagem_url"
                :alt="product.nome"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div v-else class="grid h-full w-full place-items-center bg-gradient-to-br from-festou-magenta/20 via-festou-secondary/10 to-festou-cyan/20 text-4xl font-extrabold text-festou-primary">
                {{ product.nome.slice(0, 2).toUpperCase() }}
              </div>
              <span class="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold text-festou-midnight shadow-sm backdrop-blur">
                {{ categories.find((c) => c.value === product.categoria)?.label || product.categoria }}
              </span>
            </div>

            <!-- Informações -->
            <div class="p-5">
              <h2 class="font-heading text-base font-bold text-slate-900 line-clamp-1 transition-colors duration-300 group-hover:text-festou-primary">
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
          <div class="flex items-center justify-between border-t border-slate-100 bg-festou-soft/70 p-4">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preço</span>
              <p class="font-heading text-lg font-extrabold text-festou-primary">
                {{ formatPrice(product.preco) }}
              </p>
            </div>
            <button
              type="button"
              class="rounded-full px-4 py-2 text-xs font-bold transition-all duration-300 hover:scale-105"
              :class="addedProductId === product.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-festou-primary text-white shadow-festive hover:bg-festou-primary-strong'"
              @click="handleAddToCart(product)"
            >
              <span aria-live="polite">{{ addedProductId === product.id ? '✓ Adicionado' : '+ Carrinho' }}</span>
            </button>
          </div>
        </article>
      </div>

      <!-- Estado Vazio -->
      <div v-else class="card-gradient my-12 p-12 text-center">
        <span class="text-4xl">🎈</span>
        <h3 class="mt-4 font-heading text-2xl font-bold text-festou-midnight">Nenhum produto encontrado</h3>
        <p class="mt-2 text-sm text-slate-600">
          Não encontramos produtos para os filtros selecionados. Tente buscar por outro termo ou categoria.
        </p>
        <button
          type="button"
          class="btn btn-outline-dark mt-5 text-sm"
          @click="searchQuery = ''; categoryFilter = ''"
        >
          Limpar busca e filtros
        </button>
      </div>

      <!-- Paginação -->
      <div v-if="pagination?.temMais && !isLoading && !errorMessage" class="mt-10 flex flex-col items-center gap-3">
        <p class="text-xs font-semibold text-slate-500">
          Mostrando {{ products.length }} de {{ pagination.total }} produtos
        </p>
        <button
          type="button"
          :disabled="isLoadingMore"
          class="btn btn-primary text-sm disabled:opacity-60"
          @click="loadMore"
        >
          {{ isLoadingMore ? 'Carregando...' : 'Carregar mais produtos' }}
        </button>
      </div>
      <p
        v-else-if="pagination && !pagination.temMais && pagination.total > pageSize && !isLoading && !errorMessage"
        class="mt-10 text-center text-xs font-semibold text-slate-500"
      >
        Você chegou ao fim da vitrine · {{ pagination.total }} produtos
      </p>
    </main>
  </div>
</template>
