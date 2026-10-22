<script setup>
import { onMounted, ref } from 'vue'
import { api, asArray } from '../lib/api'
import {
  cartCount,
  cartItems,
  cartTotalCents,
  clearCart,
  removeFromCart,
  setCartQuantity,
  syncWithCatalog,
} from '../lib/cart'
import { formatDate, formatPrice } from '../lib/format'
import { orderStatusLabel, orderStatusStyle } from '../lib/orderStatus'

const orders = ref([])
const note = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const priceNotice = ref('')
const isLoadingOrders = ref(true)
const isLoadingMore = ref(false)
const isSubmitting = ref(false)
const updatingOrderId = ref(null)
const page = ref(1)
const pagination = ref(null)

const pageSize = 10

async function updateOrderStatus(order, nextStatus) {
  if (nextStatus === 'cancelado') {
    const confirmed = window.confirm('Deseja realmente cancelar esta solicitação de orçamento?')
    if (!confirmed) return
  }

  errorMessage.value = ''
  successMessage.value = ''
  updatingOrderId.value = order.id

  try {
    const result = await api(`/orders/${order.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    })
    order.status = nextStatus
    successMessage.value = result.message || 'Status do pedido atualizado com sucesso.'
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível atualizar o status do pedido.'
  } finally {
    updatingOrderId.value = null
  }
}

async function loadOrders({ append = false } = {}) {
  if (append) {
    isLoadingMore.value = true
  } else {
    isLoadingOrders.value = true
    page.value = 1
  }

  try {
    const result = await api(`/orders?pagina=${page.value}&limite=${pageSize}`)
    const items = asArray(result.orders)

    orders.value = append ? [...orders.value, ...items] : items
    pagination.value = result.pagination ?? null
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível carregar seus pedidos.'
  } finally {
    isLoadingOrders.value = false
    isLoadingMore.value = false
  }
}

async function loadMoreOrders() {
  if (isLoadingMore.value || !pagination.value?.temMais) return

  page.value += 1
  await loadOrders({ append: true })
}

async function requestQuote() {
  errorMessage.value = ''
  successMessage.value = ''
  isSubmitting.value = true

  try {
    const { order } = await api('/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: cartItems.value.map((item) => ({ produto_id: item.id, quantidade: item.quantidade })),
        observacao: note.value,
      }),
    })

    orders.value.unshift(order)
    clearCart()
    note.value = ''
    successMessage.value = `Solicitação enviada! Total estimado: ${formatPrice(order.total_estimado)}.`
    await loadOrders()
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível enviar a solicitação.'
  } finally {
    isSubmitting.value = false
  }
}

async function syncCartWithCatalog() {
  if (cartItems.value.length === 0) return

  try {
    const result = await api('/products')
    const { changed, removed } = syncWithCatalog(asArray(result.products))
    const notices = []

    if (changed.length > 0) {
      const details = changed
        .map((item) => `${item.nome} (${formatPrice(item.de)} → ${formatPrice(item.para)})`)
        .join(', ')
      notices.push(`O preço de ${details} mudou e o carrinho foi atualizado.`)
    }

    if (removed.length > 0) {
      const names = removed.map((item) => item.nome).join(', ')
      notices.push(`${names} saiu da vitrine e foi removido do carrinho.`)
    }

    priceNotice.value = notices.join(' ')
  } catch {
    // O aviso é informativo: se a vitrine falhar, o envio continua validando
    // os preços no servidor.
  }
}

onMounted(() => {
  loadOrders()
  syncCartWithCatalog()
})
</script>

<template>
  <div class="min-h-screen bg-festou-soft text-slate-900">

    <main id="conteudo-principal" class="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
      <!-- Cabeçalho da página -->
      <div class="border-b border-slate-200/80 pb-6">
        <h1 class="font-heading text-3xl font-extrabold text-festou-midnight sm:text-4xl">
          Carrinho & Orçamentos
        </h1>
        <p class="mt-2 text-slate-600">
          Revise os itens selecionados e envie solicitações aos fornecedores da sua festa.
        </p>
      </div>

      <div v-if="successMessage" role="status" class="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-900 shadow-sm">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" role="alert" class="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900 shadow-sm">
        {{ errorMessage }}
      </div>
      <div v-if="priceNotice" role="status" class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 shadow-sm">
        {{ priceNotice }}
      </div>

      <!-- Seção do Carrinho Atual -->
      <section class="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <!-- Itens no Carrinho -->
        <div>
          <div v-if="cartItems.length" class="space-y-4">
            <article
              v-for="item in cartItems"
              :key="item.id"
              class="card-gradient flex flex-wrap items-center justify-between gap-4 p-5"
            >
              <div class="flex items-center gap-4">
                <img
                  v-if="item.imagem_url"
                  :src="item.imagem_url"
                  :alt="item.nome"
                  class="h-20 w-20 rounded-xl object-cover"
                />
                <div v-else class="grid h-20 w-20 place-items-center rounded-xl bg-gradient-to-br from-festou-magenta/20 to-festou-secondary/10 text-2xl font-bold text-festou-primary">
                  {{ item.nome.slice(0, 2).toUpperCase() }}
                </div>
                <div>
                  <h2 class="font-bold text-slate-900">{{ item.nome }}</h2>
                  <p class="mt-0.5 text-xs text-slate-500">{{ formatPrice(item.preco) }} por unidade</p>
                  <p class="mt-2 text-sm font-extrabold text-festou-primary">
                    Subtotal: {{ formatPrice(item.preco * item.quantidade) }}
                  </p>
                </div>
              </div>

              <!-- Controles de Quantidade e Excluir -->
              <div class="flex items-center gap-4">
                <div class="flex items-center rounded-lg border border-slate-200 bg-white shadow-sm">
                  <label :for="`quantity-${item.id}`" class="sr-only">Quantidade</label>
                  <input
                    :id="`quantity-${item.id}`"
                    :value="item.quantidade"
                    type="number"
                    min="1"
                    max="20"
                    class="w-16 border-none py-1.5 text-center text-sm font-bold text-slate-800 outline-none focus:ring-0"
                    @change="setCartQuantity(item.id, $event.target.value)"
                  />
                </div>
                <button
                  type="button"
                  class="rounded-lg p-2 text-xs font-semibold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Remover item"
                  @click="removeFromCart(item.id)"
                >
                  ✕ Remover
                </button>
              </div>
            </article>

            <!-- Observação para os fornecedores -->
            <div class="card mt-6 p-6">
              <label for="order-note" class="mb-2 block text-sm font-bold text-festou-midnight">
                Observações gerais para os fornecedores (opcional)
              </label>
              <textarea
                id="order-note"
                v-model="note"
                maxlength="500"
                rows="3"
                placeholder="Exemplo: Data pretendida do evento, horário, tema da festa ou restrições alimentares..."
                class="w-full text-sm"
              ></textarea>
            </div>
          </div>

          <!-- Carrinho Vazio -->
          <div v-else class="card-gradient p-12 text-center">
            <span class="text-4xl">🛒</span>
            <h2 class="mt-4 font-heading text-2xl font-bold text-festou-midnight">Seu carrinho está vazio</h2>
            <p class="mt-2 text-sm text-slate-600">
              Navegue pelos produtos e serviços da vitrine e monte seu orçamento para a festa.
            </p>
            <RouterLink to="/vitrine" class="btn btn-primary mt-6 text-sm">
              Explorar a vitrine
            </RouterLink>
          </div>
        </div>

        <!-- Resumo Lateral -->
        <aside v-if="cartItems.length" class="h-fit">
          <div class="card-gradient sticky top-28 p-6">
            <h2 class="font-heading text-xl font-bold text-festou-midnight">Resumo do Orçamento</h2>
            <div class="mt-4 space-y-2.5 border-b border-slate-100 pb-4 text-sm text-slate-600">
              <div class="flex justify-between">
                <span>Total de itens</span>
                <span class="font-bold text-slate-900">{{ cartCount }} {{ cartCount === 1 ? 'item' : 'itens' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Subtotal estimado</span>
                <span class="font-bold text-slate-900">{{ formatPrice(cartTotalCents / 100) }}</span>
              </div>
            </div>

            <div class="mt-4 flex items-baseline justify-between">
              <span class="text-base font-bold text-festou-midnight">Total estimado</span>
              <span class="font-heading text-2xl font-extrabold text-festou-primary">
                {{ formatPrice(cartTotalCents / 100) }}
              </span>
            </div>

            <p class="mt-3 text-xs leading-relaxed text-slate-500">
              O valor final será revisado e confirmado pelos fornecedores. Não há cobrança no envio da solicitação.
            </p>

            <button
              type="button"
              :disabled="isSubmitting || !cartItems.length"
              class="btn btn-primary mt-6 w-full text-sm"
              @click="requestQuote"
            >
              {{ isSubmitting ? 'Enviando solicitação...' : 'Solicitar orçamento' }}
            </button>
          </div>
        </aside>
      </section>

      <!-- Histórico de Solicitações do Cliente -->
      <section class="mt-16 border-t border-slate-200/80 pt-10">
        <h2 class="font-heading text-2xl font-extrabold text-festou-midnight sm:text-3xl">
          Minhas Solicitações Anteriores
        </h2>
        <p class="mt-1 text-sm text-slate-600">
          Acompanhe o retorno dos fornecedores e o status de cada orçamento solicitado.
        </p>

        <div v-if="isLoadingOrders" role="status" class="py-12 text-center text-slate-500">
          Carregando histórico de pedidos...
        </div>

        <div v-else-if="!orders.length" class="card mt-6 p-8 text-center text-slate-600">
          Você ainda não realizou nenhuma solicitação de orçamento.
        </div>

        <div v-else class="mt-6 space-y-4">
          <article
            v-for="order in orders"
            :key="order.id"
            class="card p-6 transition-all hover:shadow-md"
          >
            <div class="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div class="flex items-center gap-3">
                  <h3 class="font-bold text-slate-900">Solicitação #{{ order.id.slice(0, 8) }}</h3>
                  <span
                    class="rounded-full px-3 py-1 text-xs font-semibold"
                    :class="orderStatusStyle(order.status)"
                  >
                    {{ orderStatusLabel(order.status, 'customer') }}
                  </span>
                </div>
                <p class="mt-1 text-xs text-slate-500">Enviada em {{ formatDate(order.created_at) }}</p>
              </div>

              <div class="text-right">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Estimado</span>
                <p class="text-lg font-extrabold text-festou-primary">{{ formatPrice(order.total_estimado) }}</p>
              </div>
            </div>

            <!-- Lista de itens do pedido -->
            <ul class="mt-4 divide-y divide-slate-100 text-sm">
              <li v-for="item in asArray(order.itens)" :key="item.id" class="flex justify-between py-2 text-slate-700">
                <span>
                  <strong class="text-slate-900">{{ item.quantidade }}x</strong> {{ item.nome }}
                  <span class="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{{ item.categoria }}</span>
                </span>
                <span class="font-semibold text-slate-900">{{ formatPrice(item.subtotal) }}</span>
              </li>
            </ul>

            <div v-if="order.observacao" class="mt-3 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
              <span class="font-bold">Sua observação:</span> {{ order.observacao }}
            </div>

            <!-- Ações -->
            <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <div class="flex flex-wrap items-center gap-3">
                <button
                  v-if="['solicitado', 'em_negociacao'].includes(order.status)"
                  type="button"
                  :disabled="updatingOrderId === order.id"
                  class="text-xs font-bold text-rose-600 transition hover:underline disabled:opacity-50"
                  @click="updateOrderStatus(order, 'cancelado')"
                >
                  {{ updatingOrderId === order.id ? 'Cancelando...' : '✕ Cancelar solicitação' }}
                </button>
                <button
                  v-else-if="order.status === 'confirmado'"
                  type="button"
                  :disabled="updatingOrderId === order.id"
                  class="rounded-full bg-festou-turquoise px-4 py-1.5 text-xs font-bold text-white shadow-festive-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-800 disabled:opacity-50"
                  @click="updateOrderStatus(order, 'concluido')"
                >
                  {{ updatingOrderId === order.id ? 'Atualizando...' : '✓ Marcar como concluído' }}
                </button>

                <template v-if="order.status === 'confirmado' && Array.isArray(order.fornecedor_contato)">
                  <a
                    v-for="(contact, idx) in order.fornecedor_contato"
                    :key="idx"
                    v-show="contact && (contact.whatsapp || contact.email)"
                    :href="contact.whatsapp ? `https://wa.me/${String(contact.whatsapp).replace(/[^0-9]/g,'')}?text=${encodeURIComponent('Olá! Gostaria de falar sobre o orçamento #' + order.id.slice(0,8) + ' solicitado pelo Festou!.')}` : `mailto:${contact.email}?subject=${encodeURIComponent('Festou! - Orçamento #' + order.id.slice(0,8))}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-900 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-100"
                  >
                    {{ contact.whatsapp ? '💬 Falar com o fornecedor pelo WhatsApp' : '✉️ Falar com o fornecedor por e-mail' }}
                  </a>
                </template>
              </div>
              <span class="text-xs text-slate-400">Status atualizado pelo fornecedor</span>
            </div>
          </article>

          <div v-if="pagination?.temMais" class="flex flex-col items-center gap-2 pt-2">
            <p class="text-xs font-semibold text-slate-500">
              Mostrando {{ orders.length }} de {{ pagination.total }} solicitações
            </p>
            <button
              type="button"
              :disabled="isLoadingMore"
              class="btn btn-outline-dark text-sm disabled:opacity-60"
              @click="loadMoreOrders"
            >
              {{ isLoadingMore ? 'Carregando...' : 'Carregar mais solicitações' }}
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
