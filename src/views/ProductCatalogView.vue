<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../lib/api'

const route = useRoute()
const products = ref([])
const categoryFilter = ref('')
const isLoading = ref(true)
const errorMessage = ref('')

const categories = [
  { value: 'bolos', label: 'Bolos' },
  { value: 'doces', label: 'Doces' },
  { value: 'brinquedos', label: 'Brinquedos' },
  { value: 'convites', label: 'Convites digitais' },
]

function formatPrice(price) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

async function loadProducts() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const query = categoryFilter.value
      ? `?categoria=${encodeURIComponent(categoryFilter.value)}`
      : ''
    const { products: result } = await api(`/products${query}`)
    products.value = result
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível carregar os produtos.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadProducts)
watch(categoryFilter, loadProducts)
</script>

<template>
  <main class="min-h-screen bg-orange-50 text-slate-900">
    <header class="flex items-center justify-between border-b border-orange-100 bg-white px-6 py-5 md:px-12">
      <RouterLink to="/" class="text-2xl font-bold text-rose-700">Festou!</RouterLink>
      <nav class="flex items-center gap-4 text-sm font-semibold">
        <RouterLink to="/fornecedor/produtos/novo" class="hidden hover:text-rose-700 sm:inline">
          Anunciar produto
        </RouterLink>
        <RouterLink to="/login" class="hover:text-rose-700">Entrar</RouterLink>
      </nav>
    </header>

    <section class="bg-gradient-to-br from-orange-100 via-rose-50 to-white">
      <div class="mx-auto max-w-6xl px-6 py-14 md:px-12 md:py-20">
        <p class="text-sm font-bold uppercase tracking-widest text-rose-700">Encontre o que falta</p>
        <h1 class="mt-3 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">Detalhes que fazem a festa.</h1>
        <p class="mt-4 max-w-xl text-lg leading-8 text-slate-600">
          Explore bolos, doces, brinquedos e convites digitais de fornecedores da sua região.
        </p>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-6 py-10 md:px-12">
      <div class="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-2xl font-bold">Vitrine de produtos e serviços</h2>
          <p class="mt-1 text-sm text-slate-600">Escolha uma categoria para encontrar o que procura.</p>
        </div>
        <label class="text-sm font-semibold">
          Categoria
          <select
            v-model="categoryFilter"
            class="mt-1 block min-w-52 rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
          >
            <option value="">Todas as categorias</option>
            <option v-for="category in categories" :key="category.value" :value="category.value">
              {{ category.label }}
            </option>
          </select>
        </label>
      </div>

      <p v-if="route.query.aviso === 'fornecedor'" role="status" class="mb-5 rounded-md bg-amber-100 px-4 py-3 text-sm text-amber-900">
        O cadastro de produtos está disponível para contas de fornecedor.
      </p>
      <p v-if="isLoading" role="status" class="py-12 text-center text-slate-600">Carregando produtos...</p>
      <p v-else-if="errorMessage" role="alert" class="rounded-md border border-amber-200 bg-amber-50 px-5 py-4 text-slate-700">
        {{ errorMessage }}
      </p>
      <div v-else-if="products.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <article v-for="product in products" :key="product.id" class="overflow-hidden rounded-lg border border-orange-100 bg-white shadow-sm">
          <img
            v-if="product.imagem_url"
            :src="product.imagem_url"
            :alt="product.nome"
            class="aspect-[4/3] w-full object-cover"
            loading="lazy"
          />
          <div v-else class="grid aspect-[4/3] place-items-center bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100">
            <span class="text-6xl font-bold text-rose-700/70">{{ product.nome.slice(0, 1).toUpperCase() }}</span>
          </div>
          <div class="p-5">
            <p class="text-xs font-bold uppercase tracking-wider text-rose-700">
              {{ categories.find((category) => category.value === product.categoria)?.label }}
            </p>
            <h3 class="mt-2 text-lg font-bold">{{ product.nome }}</h3>
            <p class="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{{ product.descricao }}</p>
            <p v-if="product.cidade" class="mt-3 text-sm text-slate-500">{{ product.cidade }}</p>
            <p class="mt-4 text-lg font-bold text-slate-900">{{ formatPrice(product.preco) }}</p>
          </div>
        </article>
      </div>
      <div v-else class="rounded-lg border border-dashed border-orange-300 bg-white/70 px-6 py-14 text-center">
        <h3 class="text-xl font-bold">Ainda não há produtos nesta categoria</h3>
        <p class="mt-2 text-slate-600">Volte em breve para descobrir novas opções para sua festa.</p>
        <RouterLink to="/fornecedor/produtos/novo" class="mt-5 inline-flex font-semibold text-rose-700 hover:underline">
          Sou fornecedor: anunciar produto
        </RouterLink>
      </div>
    </section>
  </main>
</template>