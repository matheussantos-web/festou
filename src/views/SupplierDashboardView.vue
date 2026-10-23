<script setup>
import { onMounted, ref } from 'vue'
import { api, asArray } from '../lib/api'
import { formatDate, formatPrice } from '../lib/format'
import { orderStatusLabel, orderStatusStyle } from '../lib/orderStatus'
import OrderChat from '../components/OrderChat.vue'
import { useSession } from '../lib/session'

const { user } = useSession()

const activeTab = ref('pedidos') // 'pedidos' | 'produtos'
const orders = ref([])
const products = ref([])
const isLoadingOrders = ref(true)
const isLoadingMoreOrders = ref(false)
const isLoadingProducts = ref(true)
const ordersError = ref('')
const productsError = ref('')
const actionError = ref('')
const successMessage = ref('')
const updatingOrderId = ref(null)
const togglingProductId = ref(null)
const deletingProductId = ref(null)
const loadedTabs = new Set()
const ordersPage = ref(1)
const ordersPagination = ref(null)
const ordersTotal = ref(0)
const pendingCount = ref(0)

const ordersPageSize = 10

// O backend mascara o e-mail até a confirmação; só libera o mailto quando o
// endereço completo chega na resposta.
function canContactClient(order) {
  const email = order.cliente_email || ''
  const confirmed = order.status === 'confirmado' || order.status === 'concluido'
  return confirmed && email !== '' && !email.includes('***')
}

async function loadOrders({ append = false } = {}) {
  if (append) {
    isLoadingMoreOrders.value = true
  } else {
    isLoadingOrders.value = true
    ordersPage.value = 1
  }
  ordersError.value = ''

  try {
    const result = await api(`/orders?pagina=${ordersPage.value}&limite=${ordersPageSize}`)
    const items = asArray(result.orders)

    orders.value = append ? [...orders.value, ...items] : items
    ordersPagination.value = result.pagination ?? null
    ordersTotal.value = result.pagination?.total ?? items.length
    pendingCount.value = result.summary?.pendentes ?? 0
    loadedTabs.add('pedidos')
  } catch (error) {
    ordersError.value = error.message || 'Não foi possível carregar os pedidos recebidos.'
  } finally {
    isLoadingOrders.value = false
    isLoadingMoreOrders.value = false
  }
}

async function loadMoreOrders() {
  if (isLoadingMoreOrders.value || !ordersPagination.value?.temMais) return

  ordersPage.value += 1
  await loadOrders({ append: true })
}

async function loadProducts() {
  isLoadingProducts.value = true
  productsError.value = ''

  try {
    const result = await api('/supplier/products')
    products.value = asArray(result.products)
    loadedTabs.add('produtos')
  } catch (error) {
    productsError.value = error.message || 'Não foi possível carregar seus produtos cadastrados.'
  } finally {
    isLoadingProducts.value = false
  }
}

function selectTab(tab) {
  activeTab.value = tab

  if (tab === 'pedidos' && !loadedTabs.has('pedidos')) loadOrders()
  if (tab === 'produtos' && !loadedTabs.has('produtos')) loadProducts()
}

async function updateOrderStatus(order, nextStatus) {
  if (nextStatus === 'recusado') {
    const confirmed = window.confirm('Deseja realmente recusar este orçamento? O cliente será notificado da recusa.')
    if (!confirmed) return
  }

  actionError.value = ''
  successMessage.value = ''
  updatingOrderId.value = order.id

  try {
    const result = await api(`/orders/${order.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    })

    if (order.status === 'solicitado' && nextStatus !== 'solicitado') {
      pendingCount.value = Math.max(0, pendingCount.value - 1)
    }
    order.status = nextStatus
    successMessage.value = result.message || 'Status do pedido atualizado com sucesso.'
  } catch (error) {
    actionError.value = error.message || 'Não foi possível atualizar o status do pedido.'
  } finally {
    updatingOrderId.value = null
  }
}

async function toggleProductActive(product) {
  actionError.value = ''
  successMessage.value = ''
  togglingProductId.value = product.id

  try {
    const result = await api(`/supplier/products/${product.id}/toggle-active`, {
      method: 'PATCH',
    })
    product.ativo = result.product.ativo
    successMessage.value = result.message
  } catch (error) {
    actionError.value = error.message || 'Não foi possível alterar a visibilidade do produto.'
  } finally {
    togglingProductId.value = null
  }
}

async function deleteProduct(product) {
  const confirmed = window.confirm(
    `Excluir o produto "${product.nome}"? Ele sai do catálogo e da vitrine. Os pedidos já feitos continuam registrados.`,
  )
  if (!confirmed) return

  actionError.value = ''
  successMessage.value = ''
  deletingProductId.value = product.id

  try {
    const result = await api(`/supplier/products/${product.id}`, { method: 'DELETE' })
    products.value = products.value.filter((item) => item.id !== product.id)
    successMessage.value = result.message
  } catch (error) {
    actionError.value = error.message || 'Não foi possível excluir o produto.'
  } finally {
    deletingProductId.value = null
  }
}

onMounted(loadOrders)
</script>

<template>
  <div class="min-h-screen bg-festou-soft text-slate-900">

    <main id="conteudo-principal" class="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span class="badge bg-festou-secondary/12 text-festou-secondary">
            <span aria-hidden="true">💼</span> Gestão do Fornecedor
          </span>
          <h1 class="mt-2 font-heading text-3xl font-extrabold text-festou-midnight sm:text-4xl">
            Painel de Controle
          </h1>
          <p class="mt-1 text-sm text-slate-600">
            Acompanhe orçamentos de clientes e gerencie a visibilidade dos seus produtos na vitrine.
          </p>
        </div>
        <RouterLink
          to="/fornecedor/produtos/novo"
          class="btn btn-primary text-xs font-bold"
        >
          + Cadastrar novo produto
        </RouterLink>
      </div>

      <p v-if="successMessage" role="status" class="mt-6 rounded-md bg-green-100 px-4 py-3 text-sm text-green-900">
        {{ successMessage }}
      </p>
      <p v-if="actionError" role="alert" class="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
        {{ actionError }}
      </p>

      <!-- Abas de navegação -->
      <div class="mt-8 flex overflow-x-auto border-b border-slate-200" role="tablist" aria-label="Painel do fornecedor">
        <button
          id="tab-pedidos"
          type="button"
          role="tab"
          :aria-selected="activeTab === 'pedidos'"
          aria-controls="panel-pedidos"
          class="flex shrink-0 items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-all duration-300"
          :class="activeTab === 'pedidos' ? 'border-festou-magenta text-festou-primary' : 'border-transparent text-slate-500 hover:text-slate-900'"
          @click="selectTab('pedidos')"
        >
          <span>Orçamentos Recebidos</span>
          <span
            v-if="pendingCount > 0"
            class="rounded-full bg-festou-yellow/20 px-2 py-0.5 text-xs font-bold text-festou-accent"
          >
            {{ pendingCount }} novo{{ pendingCount > 1 ? 's' : '' }}
          </span>
          <span v-else class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {{ ordersTotal }}
          </span>
        </button>
        <button
          id="tab-produtos"
          type="button"
          role="tab"
          :aria-selected="activeTab === 'produtos'"
          aria-controls="panel-produtos"
          class="flex shrink-0 items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-all duration-300"
          :class="activeTab === 'produtos' ? 'border-festou-magenta text-festou-primary' : 'border-transparent text-slate-500 hover:text-slate-900'"
          @click="selectTab('produtos')"
        >
          <span>Meus Produtos</span>
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {{ products.length }}
          </span>
        </button>
      </div>

      <!-- Conteúdo da Aba: Pedidos -->
      <section v-if="activeTab === 'pedidos'" id="panel-pedidos" role="tabpanel" aria-labelledby="tab-pedidos" class="mt-6">
        <div v-if="isLoadingOrders" role="status" class="py-12 text-center text-slate-600">
          Carregando solicitações de orçamento...
        </div>
        <div v-else-if="ordersError" role="alert" class="rounded-lg border border-rose-200 bg-rose-50 px-6 py-8 text-center text-rose-800">
          <p class="font-bold">{{ ordersError }}</p>
          <button type="button" class="mt-3 text-xs font-bold underline hover:text-rose-900" @click="loadOrders">
            Tentar novamente
          </button>
        </div>
        <div v-else-if="!orders.length" class="rounded-2xl border border-dashed border-festou-secondary/30 bg-festou-secondary/5 px-6 py-12 text-center">
          <p class="text-lg font-bold">Nenhum orçamento recebido ainda</p>
          <p class="mt-1 text-sm text-slate-600">Quando clientes adicionarem seus produtos ao carrinho e solicitarem orçamento, eles aparecerão aqui.</p>
        </div>
        <div v-else class="space-y-6">
          <article
            v-for="order in orders"
            :key="order.id"
            class="card card-hover p-6"
          >
            <div class="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div class="flex items-center gap-3">
                  <h2 class="text-lg font-bold">Pedido #{{ order.id.slice(0, 8) }}</h2>
                  <span
                    class="rounded-full px-3 py-1 text-xs font-semibold"
                    :class="orderStatusStyle(order.status)"
                  >
                    {{ orderStatusLabel(order.status, 'supplier') }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-slate-600">
                  Solicitado em {{ formatDate(order.created_at) }} por
                  <strong class="text-slate-900">{{ order.cliente_nome }}</strong>
                  <span v-if="order.cliente_email" class="ml-1 text-slate-500">
                    (<a
                      v-if="canContactClient(order)"
                      :href="`mailto:${order.cliente_email}`"
                      class="text-festou-primary hover:underline"
                    >{{ order.cliente_email }}</a>
                    <span
                      v-else
                      title="O contato completo é liberado quando o pedido é confirmado."
                      class="text-slate-400"
                    >{{ order.cliente_email }}</span>)
                  </span>
                </p>
              </div>
              <div class="text-right">
                <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Total dos seus itens</p>
                <p class="text-xl font-extrabold text-festou-primary">{{ formatPrice(order.total_fornecedor) }}</p>
              </div>
            </div>

            <!-- Itens do pedido -->
            <div class="mt-4">
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Itens solicitados:</h3>
              <ul class="mt-2 divide-y divide-slate-100">
                <li
                  v-for="item in asArray(order.itens)"
                  :key="item.id"
                  class="flex items-center justify-between py-2 text-sm"
                >
                  <div>
                    <span class="font-bold text-slate-900">{{ item.quantidade }}x</span> {{ item.nome }}
                    <span class="ml-2 rounded bg-festou-magenta/10 px-2 py-0.5 text-xs text-festou-primary">{{ item.categoria }}</span>
                  </div>
                  <div class="text-slate-700">
                    {{ formatPrice(item.subtotal) }}
                    <span class="text-xs text-slate-400">({{ formatPrice(item.preco_unitario) }} cada)</span>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Observação do cliente -->
            <div v-if="order.observacao" class="mt-4 rounded-md bg-festou-soft p-3 text-sm text-slate-700">
              <span class="font-bold">Observação do cliente:</span> {{ order.observacao }}
            </div>

            <!-- Ações do Fornecedor -->
            <div class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div class="flex flex-wrap items-center gap-3">
                <template v-if="order.status === 'solicitado'">
                  <button
                    type="button"
                    :disabled="updatingOrderId === order.id"
                    class="rounded-full bg-festou-secondary px-3.5 py-2 text-xs font-bold text-white shadow-festive-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 disabled:opacity-50"
                    @click="updateOrderStatus(order, 'em_negociacao')"
                  >
                    Iniciar negociação
                  </button>
                  <button
                    type="button"
                    :disabled="updatingOrderId === order.id"
                    class="rounded-full bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-50"
                    @click="updateOrderStatus(order, 'confirmado')"
                  >
                    Confirmar pedido
                  </button>
                  <button
                    type="button"
                    :disabled="updatingOrderId === order.id"
                    class="rounded-full border border-rose-300 bg-white px-3.5 py-2 text-xs font-bold text-rose-700 transition-all duration-300 hover:bg-rose-50 disabled:opacity-50"
                    @click="updateOrderStatus(order, 'recusado')"
                  >
                    Recusar
                  </button>
                </template>

                <template v-else-if="order.status === 'em_negociacao'">
                  <button
                    type="button"
                    :disabled="updatingOrderId === order.id"
                    class="rounded-full bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-50"
                    @click="updateOrderStatus(order, 'confirmado')"
                  >
                    Confirmar pedido
                  </button>
                  <button
                    type="button"
                    :disabled="updatingOrderId === order.id"
                    class="rounded-full border border-rose-300 bg-white px-3.5 py-2 text-xs font-bold text-rose-700 transition-all duration-300 hover:bg-rose-50 disabled:opacity-50"
                    @click="updateOrderStatus(order, 'recusado')"
                  >
                    Recusar
                  </button>
                </template>

                <span v-else-if="order.status === 'confirmado'" class="text-xs font-semibold text-emerald-800">
                  ✓ Pedido confirmado! Entre em contato com o cliente para combinar entrega/detalhes.
                </span>
                <span v-else-if="order.status === 'concluido'" class="text-xs font-semibold text-festou-turquoise">
                  ✓ Pedido finalizado e concluído pelo cliente.
                </span>
                <span v-else-if="order.status === 'recusado'" class="text-xs text-rose-700">
                  Pedido recusado por você.
                </span>
                <span v-else-if="order.status === 'cancelado'" class="text-xs text-slate-500">
                  Solicitação cancelada pelo cliente.
                </span>
              </div>

              <a
                v-if="canContactClient(order)"
                :href="`mailto:${order.cliente_email}?subject=Festou! - Orçamento #${order.id.slice(0, 8)}`"
                class="text-xs font-bold text-festou-primary hover:underline"
              >
                Falar com o cliente por e-mail ↗
              </a>
              <span v-else-if="order.cliente_email" class="text-xs text-slate-400">
                O e-mail do cliente aparece aqui após a confirmação do pedido.
              </span>
            </div>
            <OrderChat
              :order-id="order.id"
              :current-user-id="user?.id || ''"
              :disabled="['cancelado', 'recusado'].includes(order.status)"
            />
          </article>

          <div v-if="ordersPagination?.temMais" class="flex flex-col items-center gap-2 pt-2">
            <p class="text-xs font-semibold text-slate-500">
              Mostrando {{ orders.length }} de {{ ordersTotal }} pedidos
            </p>
            <button
              type="button"
              :disabled="isLoadingMoreOrders"
              class="btn btn-outline-dark text-sm disabled:opacity-60"
              @click="loadMoreOrders"
            >
              {{ isLoadingMoreOrders ? 'Carregando...' : 'Carregar mais pedidos' }}
            </button>
          </div>
        </div>
      </section>

      <!-- Conteúdo da Aba: Produtos -->
      <section v-if="activeTab === 'produtos'" id="panel-produtos" role="tabpanel" aria-labelledby="tab-produtos" class="mt-6">
        <div v-if="isLoadingProducts" role="status" class="py-12 text-center text-slate-600">
          Carregando seus produtos...
        </div>
        <div v-else-if="productsError" role="alert" class="rounded-lg border border-rose-200 bg-rose-50 px-6 py-8 text-center text-rose-800">
          <p class="font-bold">{{ productsError }}</p>
          <button type="button" class="mt-3 text-xs font-bold underline hover:text-rose-900" @click="loadProducts">
            Tentar novamente
          </button>
        </div>
        <div v-else-if="!products.length" class="rounded-2xl border border-dashed border-festou-secondary/30 bg-festou-secondary/5 px-6 py-12 text-center">
          <p class="text-lg font-bold">Nenhum produto anunciado</p>
          <p class="mt-1 text-sm text-slate-600">Comece anunciando seus bolos, doces, brinquedos ou convites na vitrine.</p>
          <RouterLink
            to="/fornecedor/produtos/novo"
            class="btn btn-primary mt-5 text-sm"
          >
            Cadastrar primeiro produto
          </RouterLink>
        </div>
        <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="product in products"
            :key="product.id"
            class="card-gradient flex flex-col justify-between overflow-hidden"
          >
            <div>
              <div class="relative h-44 w-full bg-festou-soft">
                <img
                  v-if="product.imagem_url"
                  :src="product.imagem_url"
                  :alt="product.nome"
                  class="h-full w-full object-cover"
                />
                <div v-else class="grid h-full w-full place-items-center bg-gradient-to-br from-festou-magenta/20 to-festou-secondary/10 text-3xl font-extrabold text-festou-primary">
                  {{ product.nome.slice(0, 2).toUpperCase() }}
                </div>
                <span
                  class="absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm"
                  :class="product.ativo ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-700'"
                >
                  {{ product.ativo ? 'Ativo na vitrine' : 'Pausado' }}
                </span>
              </div>
              <div class="p-5">
                <span class="rounded bg-festou-magenta/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-festou-primary">
                  {{ product.categoria }}
                </span>
                <h3 class="mt-2 font-heading text-lg font-bold text-slate-900">{{ product.nome }}</h3>
                <p class="mt-1 line-clamp-2 text-sm text-slate-600">{{ product.descricao }}</p>
                <p class="mt-3 font-heading text-lg font-extrabold text-festou-primary">{{ formatPrice(product.preco) }}</p>
                <p v-if="product.cidade" class="mt-1 text-xs text-slate-500">📍 {{ product.cidade }}</p>
              </div>
            </div>

            <div class="border-t border-slate-100 bg-festou-soft/70 p-4">
              <div class="flex flex-wrap items-center gap-2">
                <RouterLink
                  :to="`/fornecedor/produtos/${product.id}/editar`"
                  class="flex-1 rounded-full border border-slate-300 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-festou-magenta/50 hover:text-festou-primary"
                >
                  Editar
                </RouterLink>
                <button
                  type="button"
                  :disabled="togglingProductId === product.id"
                  class="flex-1 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-festou-magenta/50 hover:text-festou-primary disabled:opacity-50"
                  @click="toggleProductActive(product)"
                >
                  {{ togglingProductId === product.id ? 'Atualizando...' : (product.ativo ? 'Pausar anúncio' : 'Reativar na vitrine') }}
                </button>
                <button
                  type="button"
                  :disabled="deletingProductId === product.id"
                  class="rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-50 disabled:opacity-50"
                  @click="deleteProduct(product)"
                >
                  {{ deletingProductId === product.id ? 'Excluindo...' : 'Excluir' }}
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>
