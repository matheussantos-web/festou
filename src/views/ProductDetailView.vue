<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { addToCart } from '../lib/cart'
import { api } from '../lib/api'
import { formatDate, formatPrice } from '../lib/format'
import { useSession } from '../lib/session'

const route = useRoute()
const router = useRouter()
const { user } = useSession()
const product = ref(null)
const supplier = ref(null)
const reviews = ref([])
const reviewSummary = ref({ total: 0, media: 0 })
const activeImageIndex = ref(0)
const isLoading = ref(true)
const errorMessage = ref('')
const noticeMessage = ref('')
const images = computed(() => {
  const sources = [...(product.value?.imagens_url ?? []), product.value?.imagem_url]
  return [...new Set(sources.filter(Boolean))]
})
const activeImage = computed(() => images.value[activeImageIndex.value] || '')
const canRequestQuote = computed(() => user.value?.tipo_perfil !== 'fornecedor')

async function loadProduct() {
  isLoading.value = true
  errorMessage.value = ''
  activeImageIndex.value = 0
  try {
    const result = await api(`/products/${encodeURIComponent(route.params.id)}`)
    product.value = result.product
    supplier.value = result.supplier
    reviews.value = Array.isArray(result.reviews) ? result.reviews : []
    reviewSummary.value = result.review_summary ?? { total: 0, media: 0 }
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel carregar os detalhes deste produto.'
  } finally {
    isLoading.value = false
  }
}

function addProductToCart() {
  if (!product.value) return
  if (!canRequestQuote.value) {
    noticeMessage.value = 'O carrinho e os orcamentos sao exclusivos para clientes.'
    return
  }
  noticeMessage.value = ''
  addToCart(product.value)
}

async function requestQuote() {
  if (!product.value || !canRequestQuote.value) {
    noticeMessage.value = 'Entre com uma conta de cliente para solicitar um orcamento.'
    return
  }
  addToCart(product.value)
  await router.push('/carrinho')
}

function scrollToSupplier() {
  document.getElementById('perfil-fornecedor')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

onMounted(loadProduct)
watch(() => route.params.id, loadProduct)
</script>

<template>
  <main id="conteudo-principal" class="min-h-screen bg-festou-soft px-4 py-8 text-slate-900 sm:px-8 sm:py-10">
    <div class="mx-auto max-w-6xl">
      <RouterLink to="/vitrine" class="inline-flex min-h-11 items-center font-bold text-festou-primary hover:underline">← Voltar à vitrine</RouterLink>

      <div v-if="isLoading" class="card-gradient mt-6 p-12 text-center" role="status">
        <span class="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-festou-pink/25 border-t-festou-pink"></span>
        <p class="mt-3 font-semibold text-slate-600">Carregando produto...</p>
      </div>

      <section v-else-if="errorMessage" class="card-gradient mt-6 p-10 text-center">
        <h1 class="font-heading text-2xl font-extrabold text-festou-dark">Não encontramos este produto</h1>
        <p class="mt-2 text-slate-600">{{ errorMessage }}</p>
        <RouterLink to="/vitrine" class="btn btn-primary mt-5">Explorar a vitrine</RouterLink>
      </section>

      <template v-else-if="product">
        <div class="mt-5 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section class="overflow-hidden rounded-3xl bg-white shadow-xl shadow-festou-dark/10" aria-label="Fotos do produto">
            <div class="relative aspect-[4/3] bg-gradient-to-br from-festou-dark/10 to-festou-purple/20 sm:aspect-[16/10]">
              <img v-if="activeImage" :src="activeImage" :alt="`${product.nome} — foto ${activeImageIndex + 1}`" class="h-full w-full object-cover" />
              <div v-else class="grid h-full place-items-center bg-gradient-to-br from-festou-dark to-festou-purple text-6xl font-extrabold text-white">{{ product.nome.slice(0, 2).toUpperCase() }}</div>
              <span class="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold text-festou-dark shadow">{{ product.categoria }}</span>
            </div>
            <div v-if="images.length > 1" class="flex gap-3 overflow-x-auto p-4">
              <button v-for="(image, index) in images" :key="image" type="button" :aria-label="`Ver foto ${index + 1}`" :aria-pressed="activeImageIndex === index" class="h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition" :class="activeImageIndex === index ? 'border-festou-pink' : 'border-transparent opacity-70 hover:opacity-100'" @click="activeImageIndex = index">
                <img :src="image" :alt="`Miniatura ${index + 1} de ${product.nome}`" class="h-full w-full object-cover" />
              </button>
            </div>
          </section>

          <section class="flex flex-col rounded-3xl bg-white p-6 shadow-xl shadow-festou-dark/10 sm:p-8">
            <span class="text-xs font-extrabold uppercase tracking-wider text-festou-purple">{{ product.categoria }}</span>
            <h1 class="mt-2 font-heading text-3xl font-extrabold leading-tight text-festou-dark sm:text-4xl">{{ product.nome }}</h1>
            <p class="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{{ product.descricao }}</p>
            <p v-if="product.cidade" class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><span aria-hidden="true">📍</span>{{ product.cidade }}</p>

            <div class="mt-6 rounded-2xl bg-festou-soft p-5">
              <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Preço sugerido</p>
              <p class="mt-1 font-heading text-3xl font-extrabold text-festou-pink">{{ formatPrice(product.preco) }}</p>
              <p class="mt-1 text-xs text-slate-500">O fornecedor confirma os detalhes durante a negociação.</p>
            </div>

            <p v-if="noticeMessage" role="status" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">{{ noticeMessage }}</p>
            <div class="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" :disabled="!canRequestQuote" class="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-festou-pink px-5 font-extrabold text-festou-dark transition hover:bg-festou-pink disabled:cursor-not-allowed disabled:opacity-50" @click="addProductToCart">Adicionar ao carrinho</button>
              <button type="button" :disabled="!canRequestQuote" class="inline-flex min-h-12 items-center justify-center rounded-full bg-festou-pink px-5 font-extrabold text-festou-dark shadow-festive transition hover:-translate-y-0.5 hover:bg-[#ff5eaf] disabled:cursor-not-allowed disabled:opacity-50" @click="requestQuote">Solicitar orçamento</button>
            </div>
            <p class="mt-3 text-center text-xs text-slate-500">Após enviar o orçamento, você poderá conversar com o fornecedor no painel.</p>

            <button type="button" class="mt-6 inline-flex min-h-11 items-center justify-center gap-2 self-start font-bold text-festou-purple hover:text-festou-pink" @click="scrollToSupplier">
              <span aria-hidden="true">↓</span> Ver perfil do fornecedor
            </button>
          </section>
        </div>

        <section id="perfil-fornecedor" class="mt-6 scroll-mt-24 rounded-3xl bg-white p-6 shadow-xl shadow-festou-dark/10 sm:p-8">
          <div class="flex flex-col gap-5 sm:flex-row sm:items-center">
            <img v-if="supplier?.avatar_url" :src="supplier.avatar_url" :alt="`Foto de ${supplier.nome}`" class="h-20 w-20 rounded-full border-4 border-festou-cyan/20 object-cover" />
            <div v-else class="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-festou-yellow font-heading text-3xl font-extrabold text-festou-dark">{{ supplier?.nome?.slice(0, 1)?.toUpperCase() || '?' }}</div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-extrabold uppercase tracking-wide text-festou-cyan">Fornecedor</p>
              <h2 class="mt-1 font-heading text-2xl font-extrabold text-festou-dark">{{ supplier?.nome || 'Fornecedor Festou' }}</h2>
              <p v-if="reviewSummary.total" class="mt-1 text-sm font-semibold text-slate-600"><span class="text-festou-orange">★</span> {{ reviewSummary.media }} / 5 · {{ reviewSummary.total }} {{ reviewSummary.total === 1 ? 'avaliação' : 'avaliações' }}</p>
            </div>
            <a v-if="supplier?.site_url" :href="supplier.site_url" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-11 items-center justify-center rounded-full border border-festou-cyan px-5 text-sm font-bold text-festou-dark hover:bg-festou-cyan/10">Acessar site</a>
          </div>
          <p v-if="supplier?.biografia" class="mt-5 max-w-3xl whitespace-pre-line text-sm leading-7 text-slate-600">{{ supplier.biografia }}</p>
          <div v-if="supplier?.instagram_url || supplier?.facebook_url" class="mt-4 flex flex-wrap gap-3">
            <a v-if="supplier.instagram_url" :href="supplier.instagram_url" target="_blank" rel="noopener noreferrer" class="rounded-full bg-festou-soft px-4 py-2 text-sm font-bold text-festou-purple hover:text-festou-pink">Instagram</a>
            <a v-if="supplier.facebook_url" :href="supplier.facebook_url" target="_blank" rel="noopener noreferrer" class="rounded-full bg-festou-soft px-4 py-2 text-sm font-bold text-festou-purple hover:text-festou-pink">Facebook</a>
          </div>
        </section>

        <section class="mt-6 rounded-3xl bg-white p-6 shadow-xl shadow-festou-dark/10 sm:p-8">
          <div class="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-5">
            <div>
              <p class="text-xs font-extrabold uppercase tracking-wide text-festou-purple">Experiências de clientes</p>
              <h2 class="mt-1 font-heading text-2xl font-extrabold text-festou-dark">Avaliações</h2>
            </div>
            <p v-if="reviewSummary.total" class="font-bold text-slate-600"><span class="text-festou-orange">★</span> {{ reviewSummary.media }} / 5 ({{ reviewSummary.total }})</p>
          </div>
          <div v-if="reviews.length" class="divide-y divide-slate-100">
            <article v-for="review in reviews" :key="review.id" class="py-5 first:pt-5">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="font-bold text-slate-800">{{ review.cliente_nome }}</h3>
                <time class="text-xs text-slate-500">{{ formatDate(review.created_at, { dateStyle: 'medium', timeStyle: undefined }) }}</time>
              </div>
              <p class="mt-1 tracking-wide text-festou-orange" :aria-label="`${review.nota} de 5 estrelas`">{{ '★'.repeat(review.nota) }}<span class="text-slate-200">{{ '★'.repeat(5 - review.nota) }}</span></p>
              <p v-if="review.comentario" class="mt-2 text-sm leading-6 text-slate-600">{{ review.comentario }}</p>
            </article>
          </div>
          <div v-else class="py-8 text-center">
            <p class="text-2xl text-festou-yellow" aria-hidden="true">☆ ☆ ☆ ☆ ☆</p>
            <p class="mt-2 font-semibold text-slate-700">Este fornecedor ainda não recebeu avaliações.</p>
          </div>
          <p class="mt-2 rounded-xl bg-festou-soft p-3 text-xs leading-5 text-slate-500">As avaliações são feitas por clientes após a conclusão do serviço.</p>
        </section>
      </template>
    </div>
  </main>
</template>
