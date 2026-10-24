<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api, asArray } from '../lib/api'
import { formatDate, formatPrice } from '../lib/format'
import { orderStatusLabel, orderStatusStyle } from '../lib/orderStatus'
import OrderChat from '../components/OrderChat.vue'
import { useSession } from '../lib/session'

const route = useRoute()
const { user } = useSession()
const orders = ref([])
const errorMessage = ref('')
const successMessage = ref(route.query.enviado ? 'Sua solicitação foi enviada aos fornecedores.' : '')
const isLoading = ref(true)
const isLoadingMore = ref(false)
const updatingOrderId = ref(null)
const currentPage = ref(1)
const pagination = ref(null)
const filter = ref('todos')
const filters = [
  { id: 'todos', label: 'Todos' },
  { id: 'ativos', label: 'Pendentes e em negociação' },
  { id: 'fechados', label: 'Fechados e concluídos' },
  { id: 'encerrados', label: 'Cancelados e recusados' },
]
const pageSize = 10
let refreshTimer
let isFetching = false

const filteredOrders = computed(() => orders.value.filter((order) => {
  if (filter.value === 'ativos') return ['solicitado', 'em_negociacao'].includes(order.status)
  if (filter.value === 'fechados') return ['negocio_fechado', 'servico_concluido'].includes(order.status)
  if (filter.value === 'encerrados') return ['cancelado', 'recusado'].includes(order.status)
  return true
}))

async function loadOrders({ append = false, silent = false } = {}) {
  if (isFetching) return
  isFetching = true
  if (append) isLoadingMore.value = true
  else if (!silent) {
    isLoading.value = true
    currentPage.value = 1
  }
  if (!silent) errorMessage.value = ''

  try {
    const pagesToLoad = append ? [currentPage.value] : Array.from({ length: silent ? currentPage.value : 1 }, (_, index) => index + 1)
    const results = await Promise.all(pagesToLoad.map((page) => api(`/orders?pagina=${page}&limite=${pageSize}`)))
    const loadedOrders = results.flatMap((result) => asArray(result.orders))
    const uniqueOrders = [...new Map(loadedOrders.map((order) => [order.id, order])).values()]

    orders.value = append ? [...orders.value, ...uniqueOrders] : uniqueOrders
    pagination.value = results[0]?.pagination ?? pagination.value
  } catch (error) {
    if (!silent) errorMessage.value = error.message || 'Não foi possível carregar seus orçamentos.'
  } finally {
    isFetching = false
    isLoading.value = false
    isLoadingMore.value = false
  }
}

async function loadMoreOrders() {
  if (isLoadingMore.value || !pagination.value?.temMais) return
  currentPage.value += 1
  await loadOrders({ append: true })
}

async function updateOrderStatus(order, nextStatus) {
  if (nextStatus === 'cancelado' && !window.confirm('Deseja cancelar esta solicitação de orçamento?')) return
  if (nextStatus === 'servico_concluido' && !window.confirm('Confirma que o serviço foi concluído?')) return

  updatingOrderId.value = order.id
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const result = await api(`/orders/${order.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    })
    order.status = result.order?.status || nextStatus
    successMessage.value = result.message || 'Status do orçamento atualizado.'
    await loadOrders({ silent: true })
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível atualizar o orçamento.'
  } finally {
    updatingOrderId.value = null
  }
}

function refreshWhenVisible() {
  if (document.visibilityState === 'visible') loadOrders({ silent: true })
}

onMounted(() => {
  loadOrders()
  refreshTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible') loadOrders({ silent: true })
  }, 15000)
  document.addEventListener('visibilitychange', refreshWhenVisible)
  window.addEventListener('focus', refreshWhenVisible)
})

onBeforeUnmount(() => {
  window.clearInterval(refreshTimer)
  document.removeEventListener('visibilitychange', refreshWhenVisible)
  window.removeEventListener('focus', refreshWhenVisible)
})
</script>

<template>
  <main id="conteudo-principal" class="min-h-screen bg-festou-soft px-5 py-10 text-slate-900 sm:px-8 lg:px-12">
    <div class="mx-auto max-w-7xl">
      <header class="flex flex-wrap items-end justify-between gap-5 border-b border-slate-200/80 pb-6">
        <div>
          <span class="badge bg-festou-secondary/12 text-festou-secondary">Área do cliente</span>
          <h1 class="mt-3 font-heading text-3xl font-extrabold text-festou-midnight sm:text-4xl">Meus Orçamentos</h1>
          <p class="mt-2 max-w-2xl text-slate-600">Acompanhe conversas, negociações e a conclusão dos serviços com cada fornecedor.</p>
        </div>
        <RouterLink to="/carrinho" class="btn btn-primary text-sm">Ir para o carrinho</RouterLink>
      </header>

      <p v-if="successMessage" role="status" class="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
        {{ successMessage }}
      </p>
      <p v-if="errorMessage" role="alert" class="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900">
        {{ errorMessage }}
      </p>

      <div class="mt-8 flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar orçamentos por status">
        <button
          v-for="option in filters"
          :key="option.id"
          type="button"
          class="min-h-10 rounded-full border px-4 text-sm font-bold transition"
          :class="filter === option.id ? 'border-festou-primary bg-festou-primary text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-festou-primary/40'"
          :aria-pressed="filter === option.id"
          @click="filter = option.id"
        >
          {{ option.label }}
        </button>
        <span class="ml-auto text-xs text-slate-500">Atualização automática a cada 15 segundos</span>
      </div>

      <div v-if="isLoading" role="status" class="py-16 text-center text-slate-500">Carregando seus orçamentos...</div>
      <div v-else-if="!orders.length" class="card-gradient mt-6 p-10 text-center">
        <h2 class="font-heading text-xl font-bold text-festou-midnight">Você ainda não enviou um orçamento</h2>
        <p class="mt-2 text-sm text-slate-600">Adicione produtos ao carrinho e envie sua solicitação para começar uma conversa.</p>
        <RouterLink to="/vitrine" class="btn btn-primary mt-5 text-sm">Explorar fornecedores</RouterLink>
      </div>
      <div v-else-if="!filteredOrders.length" class="card mt-6 p-8 text-center text-slate-600">
        Não há orçamentos nesta categoria.
      </div>

      <section v-else class="mt-6 space-y-5" aria-label="Lista de orçamentos">
        <article v-for="order in filteredOrders" :key="order.id" class="card p-5 sm:p-6">
          <header class="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div class="flex flex-wrap items-center gap-3">
                <h2 class="font-bold text-slate-900">Orçamento #{{ order.id.slice(0, 8) }}</h2>
                <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="orderStatusStyle(order.status)">
                  {{ orderStatusLabel(order.status, 'customer') }}
                </span>
              </div>
              <p class="mt-1 text-xs text-slate-500">Enviado em {{ formatDate(order.created_at) }}</p>
              <p v-if="order.fornecedor_nome" class="mt-1 text-sm font-semibold text-festou-secondary">{{ order.fornecedor_nome }}</p>
            </div>
            <div class="text-right">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total estimado</span>
              <p class="text-lg font-extrabold text-festou-primary">{{ formatPrice(order.total_estimado) }}</p>
            </div>
          </header>

          <ul class="mt-4 divide-y divide-slate-100 text-sm">
            <li v-for="item in asArray(order.itens)" :key="item.id" class="flex justify-between gap-4 py-2 text-slate-700">
              <span><strong class="text-slate-900">{{ item.quantidade }}×</strong> {{ item.nome }}</span>
              <span class="shrink-0 font-semibold">{{ formatPrice(item.subtotal) }}</span>
            </li>
          </ul>
          <p v-if="order.observacao" class="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <strong>Sua observação:</strong> {{ order.observacao }}
          </p>

          <div class="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
            <button
              v-if="['solicitado', 'em_negociacao'].includes(order.status)"
              type="button"
              :disabled="updatingOrderId === order.id"
              class="rounded-full border border-rose-200 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              @click="updateOrderStatus(order, 'cancelado')"
            >
              Cancelar orçamento
            </button>
            <button
              v-if="order.status === 'negocio_fechado'"
              type="button"
              :disabled="updatingOrderId === order.id"
              class="rounded-full bg-festou-turquoise px-4 py-2 text-xs font-bold text-white hover:bg-cyan-800 disabled:opacity-50"
              @click="updateOrderStatus(order, 'servico_concluido')"
            >
              {{ updatingOrderId === order.id ? 'Atualizando...' : 'Confirmar serviço concluído' }}
            </button>
            <template v-if="['negocio_fechado', 'servico_concluido'].includes(order.status) && Array.isArray(order.fornecedor_contato)">
              <a
                v-for="(contact, index) in order.fornecedor_contato.filter((item) => item && (item.whatsapp || item.email))"
                :key="index"
                :href="contact.whatsapp ? `https://wa.me/${String(contact.whatsapp).replace(/[^0-9]/g, '')}` : `mailto:${contact.email}`"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100"
              >
                Falar com fornecedor
              </a>
            </template>
            <span v-if="order.status === 'servico_concluido'" class="text-xs font-semibold text-festou-turquoise">Serviço concluído</span>
          </div>

          <OrderChat
            :order-id="order.id"
            :current-user-id="user?.id || ''"
            :disabled="['cancelado', 'recusado'].includes(order.status)"
          />
        </article>

        <div v-if="pagination?.temMais" class="flex justify-center pt-2">
          <button type="button" :disabled="isLoadingMore" class="btn btn-outline-dark text-sm disabled:opacity-60" @click="loadMoreOrders">
            {{ isLoadingMore ? 'Carregando...' : 'Carregar mais orçamentos' }}
          </button>
        </div>
      </section>
    </div>
  </main>
</template>
