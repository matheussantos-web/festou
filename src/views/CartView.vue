<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../lib/api'
import {
  cartCount,
  cartItems,
  cartTotalCents,
  clearCart,
  removeFromCart,
  setCartQuantity,
} from '../lib/cart'

const orders = ref([])
const note = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoadingOrders = ref(true)
const isSubmitting = ref(false)

function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

const orderStatuses = {
  solicitado: 'Aguardando fornecedor',
  em_negociacao: 'Em negociação',
  confirmado: 'Confirmado',
  recusado: 'Recusado',
  cancelado: 'Cancelado',
  concluido: 'Concluído',
}

async function loadOrders() {
  isLoadingOrders.value = true

  try {
    const result = await api('/orders')
    orders.value = result.orders
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível carregar seus pedidos.'
  } finally {
    isLoadingOrders.value = false
  }
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
    successMessage.value = `Solicitação enviada. Total estimado: ${formatPrice(order.total_estimado)}.`
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível enviar a solicitação.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(loadOrders)
</script>

<template>
  <main class="min-h-screen bg-orange-50 text-slate-900">
    <header class="flex items-center justify-between border-b border-orange-100 bg-white px-6 py-5 md:px-12">
      <RouterLink to="/" class="text-2xl font-bold text-rose-700">Festou!</RouterLink>
      <RouterLink to="/vitrine" class="text-sm font-semibold text-rose-700 hover:underline">Continuar escolhendo</RouterLink>
    </header>

    <div class="mx-auto max-w-6xl px-6 py-10 md:px-12">
      <h1 class="text-3xl font-bold">Carrinho e orçamentos</h1>
      <p class="mt-2 text-slate-600">Revise os itens e envie uma solicitação aos fornecedores.</p>

      <p v-if="successMessage" role="status" class="mt-6 rounded-md bg-green-100 px-4 py-3 text-sm text-green-900">
        {{ successMessage }}
      </p>
      <p v-if="errorMessage" role="alert" class="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
        {{ errorMessage }}
      </p>

      <section class="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <div v-if="cartItems.length" class="divide-y divide-orange-100 border-y border-orange-200">
            <article v-for="item in cartItems" :key="item.id" class="flex gap-4 py-5">
              <img
                v-if="item.imagem_url"
                :src="item.imagem_url"
                :alt="item.nome"
                class="size-20 rounded-md object-cover"
              />
              <div v-else class="grid size-20 shrink-0 place-items-center rounded-md bg-orange-100 text-2xl font-bold text-rose-700">
                {{ item.nome.slice(0, 1).toUpperCase() }}
              </div>
              <div class="min-w-0 flex-1">
                <h2 class="font-bold">{{ item.nome }}</h2>
                <p class="mt-1 text-sm text-slate-600">{{ formatPrice(item.preco) }} por unidade</p>
                <div class="mt-3 flex flex-wrap items-center gap-3">
                  <label :for="`quantity-${item.id}`" class="text-sm font-medium">Quantidade</label>
                  <input
                    :id="`quantity-${item.id}`"
                    :value="item.quantidade"
                    type="number"
                    min="1"
                    max="20"
                    class="w-20 rounded-md border border-slate-300 px-2 py-1"
                    @change="setCartQuantity(item.id, $event.target.value)"
                  />
                  <button
                    type="button"
                    class="text-sm font-semibold text-rose-700 hover:underline"
                    @click="removeFromCart(item.id)"
                  >
                    Remover
                  </button>
                </div>
              </div>
              <p class="shrink-0 font-bold">{{ formatPrice(item.preco * item.quantidade) }}</p>
            </article>
          </div>
          <div v-else class="rounded-lg border border-dashed border-orange-300 bg-white/70 px-6 py-12 text-center">
            <h2 class="text-xl font-bold">Seu carrinho está vazio</h2>
            <p class="mt-2 text-slate-600">Adicione produtos da vitrine para montar um orçamento.</p>
            <RouterLink to="/vitrine" class="mt-5 inline-flex font-semibold text-rose-700 hover:underline">
              Explorar a vitrine
            </RouterLink>
          </div>

          <section v-if="cartItems.length" class="mt-8">
            <label for="order-note" class="mb-2 block text-sm font-semibold">Observação para os fornecedores (opcional)</label>
            <textarea
              id="order-note"
              v-model="note"
              maxlength="500"
              rows="3"
              placeholder="Data da festa, tema ou detalhes importantes..."
              class="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
            ></textarea>
          </section>
        </div>

        <aside v-if="cartItems.length" class="h-fit border-t border-orange-200 pt-5 lg:border-t-0 lg:pt-0">
          <h2 class="text-xl font-bold">Resumo</h2>
          <div class="mt-4 flex justify-between text-sm text-slate-600">
            <span>{{ cartCount }} {{ cartCount === 1 ? 'item' : 'itens' }}</span>
            <span>{{ formatPrice(cartTotalCents / 100) }}</span>
          </div>
          <div class="mt-4 flex justify-between border-t border-orange-200 pt-4 text-lg font-bold">
            <span>Total estimado</span>
            <span>{{ formatPrice(cartTotalCents / 100) }}</span>
          </div>
          <p class="mt-3 text-xs leading-5 text-slate-500">O valor será confirmado pelo fornecedor. O preço final é calculado novamente ao enviar.</p>
          <button
            type="button"
            :disabled="isSubmitting || !cartItems.length"
            class="mt-6 w-full rounded-md bg-rose-700 px-4 py-3 font-semibold text-white hover:bg-rose-800 disabled:cursor-wait disabled:opacity-60"
            @click="requestQuote"
          >
            {{ isSubmitting ? 'Enviando...' : 'Solicitar orçamento' }}
          </button>
        </aside>
      </section>

      <section class="mt-14 border-t border-orange-200 pt-8">
        <h2 class="text-2xl font-bold">Minhas solicitações</h2>
        <p v-if="isLoadingOrders" role="status" class="mt-4 text-sm text-slate-600">Carregando solicitações...</p>
        <p v-else-if="!orders.length" class="mt-4 text-sm text-slate-600">Você ainda não enviou solicitações de orçamento.</p>
        <div v-else class="mt-5 divide-y divide-orange-100 border-y border-orange-200">
          <article v-for="order in orders" :key="order.id" class="py-5">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="font-bold">Solicitação #{{ order.id.slice(0, 8) }}</p>
                <p class="mt-1 text-sm text-slate-600">{{ formatDate(order.created_at) }}</p>
              </div>
              <span class="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">
                {{ orderStatuses[order.status] || order.status }}
              </span>
            </div>
            <ul class="mt-4 space-y-2 text-sm">
              <li v-for="item in order.itens" :key="item.id" class="flex justify-between gap-4">
                <span>{{ item.quantidade }}x {{ item.nome }}</span>
                <span>{{ formatPrice(item.subtotal) }}</span>
              </li>
            </ul>
            <p class="mt-4 text-right font-bold">Estimativa: {{ formatPrice(order.total_estimado) }}</p>
            <p v-if="order.observacao" class="mt-2 text-sm text-slate-600">{{ order.observacao }}</p>
          </article>
        </div>
      </section>
    </div>
  </main>
</template>