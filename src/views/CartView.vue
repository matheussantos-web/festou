<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
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
import { formatPrice } from '../lib/format'

const router = useRouter()
const note = ref('')
const errorMessage = ref('')
const priceNotice = ref('')
const isSubmitting = ref(false)

async function requestQuote() {
  errorMessage.value = ''
  isSubmitting.value = true
  try {
    await api('/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: cartItems.value.map((item) => ({ produto_id: item.id, quantidade: item.quantidade })),
        observacao: note.value,
      }),
    })
    clearCart()
    note.value = ''
    await router.push({ name: 'meus-orcamentos', query: { enviado: '1' } })
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível enviar a solicitação.'
  } finally {
    isSubmitting.value = false
  }
}

async function syncCartWithCatalog() {
  if (!cartItems.value.length) return
  try {
    const result = await api('/products')
    const { changed, removed } = syncWithCatalog(asArray(result.products))
    const notices = []
    if (changed.length) {
      const details = changed.map((item) => `${item.nome} (${formatPrice(item.de)} → ${formatPrice(item.para)})`).join(', ')
      notices.push(`O preço de ${details} mudou e o carrinho foi atualizado.`)
    }
    if (removed.length) notices.push(`${removed.map((item) => item.nome).join(', ')} saiu da vitrine e foi removido do carrinho.`)
    priceNotice.value = notices.join(' ')
  } catch {
    // O servidor continua validando produtos e preços no envio do orçamento.
  }
}

onMounted(syncCartWithCatalog)
</script>

<template>
  <main id="conteudo-principal" class="min-h-screen bg-festou-soft px-5 py-10 text-slate-900 sm:px-8 lg:px-12">
    <div class="mx-auto max-w-7xl">
      <header class="flex flex-wrap items-end justify-between gap-5 border-b border-slate-200/80 pb-6">
        <div>
          <span class="badge bg-festou-secondary/12 text-festou-secondary">Sua seleção</span>
          <h1 class="mt-3 font-heading text-3xl font-extrabold text-festou-dark sm:text-4xl">Carrinho</h1>
          <p class="mt-2 text-slate-600">Revise os itens antes de enviar pedidos de orçamento aos fornecedores.</p>
        </div>
        <RouterLink to="/orcamentos" class="btn btn-outline-dark text-sm">Meus Orçamentos</RouterLink>
      </header>

      <p v-if="errorMessage" role="alert" class="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900">{{ errorMessage }}</p>
      <p v-if="priceNotice" role="status" class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{{ priceNotice }}</p>

      <section class="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div>
          <div v-if="cartItems.length" class="space-y-4">
            <article v-for="item in cartItems" :key="item.id" class="card-gradient flex flex-wrap items-center justify-between gap-4 p-5">
              <div class="flex items-center gap-4">
                <img v-if="item.imagem_url" :src="item.imagem_url" :alt="item.nome" class="h-20 w-20 rounded-xl object-cover" />
                <div v-else class="grid h-20 w-20 place-items-center rounded-xl bg-gradient-to-br from-festou-magenta/20 to-festou-secondary/10 text-2xl font-bold text-festou-primary">
                  {{ item.nome.slice(0, 2).toUpperCase() }}
                </div>
                <div>
                  <h2 class="font-bold text-slate-900">{{ item.nome }}</h2>
                  <p class="mt-0.5 text-xs text-slate-500">{{ formatPrice(item.preco) }} por unidade</p>
                  <p class="mt-2 text-sm font-extrabold text-festou-primary">Subtotal: {{ formatPrice(item.preco * item.quantidade) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="flex items-center rounded-lg border border-slate-200 bg-white shadow-sm">
                  <label :for="`quantity-${item.id}`" class="sr-only">Quantidade</label>
                  <input :id="`quantity-${item.id}`" :value="item.quantidade" type="number" min="1" max="20" class="w-16 border-none py-1.5 text-center text-sm font-bold outline-none focus:ring-0" @change="setCartQuantity(item.id, $event.target.value)" />
                </div>
                <button type="button" class="rounded-lg p-2 text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600" :aria-label="`Remover ${item.nome}`" @click="removeFromCart(item.id)">Remover</button>
              </div>
            </article>

            <div class="card mt-6 p-6">
              <label for="order-note" class="mb-2 block text-sm font-bold text-festou-dark">Observações para os fornecedores (opcional)</label>
              <textarea id="order-note" v-model="note" maxlength="500" rows="3" placeholder="Data do evento, horário, tema da festa ou detalhes importantes..." class="w-full text-sm"></textarea>
            </div>
          </div>

          <div v-else class="card-gradient p-12 text-center">
            <span class="text-4xl" aria-hidden="true">🛒</span>
            <h2 class="mt-4 font-heading text-2xl font-bold text-festou-dark">Seu carrinho está vazio</h2>
            <p class="mt-2 text-sm text-slate-600">Explore a vitrine para encontrar produtos e serviços para sua festa.</p>
            <RouterLink to="/vitrine" class="btn btn-primary mt-6 text-sm">Explorar a vitrine</RouterLink>
          </div>
        </div>

        <aside v-if="cartItems.length" class="h-fit">
          <div class="card-gradient sticky top-28 p-6">
            <h2 class="font-heading text-xl font-bold text-festou-dark">Resumo</h2>
            <div class="mt-4 space-y-2.5 border-b border-slate-100 pb-4 text-sm text-slate-600">
              <div class="flex justify-between"><span>Total de itens</span><span class="font-bold text-slate-900">{{ cartCount }} {{ cartCount === 1 ? 'item' : 'itens' }}</span></div>
              <div class="flex justify-between"><span>Subtotal estimado</span><span class="font-bold text-slate-900">{{ formatPrice(cartTotalCents / 100) }}</span></div>
            </div>
            <div class="mt-4 flex items-baseline justify-between">
              <span class="font-bold text-festou-dark">Total estimado</span>
              <span class="font-heading text-2xl font-extrabold text-festou-primary">{{ formatPrice(cartTotalCents / 100) }}</span>
            </div>
            <p class="mt-3 text-xs leading-relaxed text-slate-500">O fornecedor confirmará o valor final. Não há cobrança ao enviar a solicitação.</p>
            <button type="button" :disabled="isSubmitting || !cartItems.length" class="btn btn-primary mt-6 w-full" :class="isSubmitting ? 'is-loading' : ''" @click="requestQuote">
              {{ isSubmitting ? 'Enviando solicitação...' : 'Solicitar orçamento' }}
            </button>
          </div>
        </aside>
      </section>

      <div v-if="cartItems.length" class="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.25rem)] z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div class="mx-auto flex max-w-md items-center justify-between gap-3">
          <div><p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total estimado</p><p class="font-heading text-lg font-extrabold text-festou-primary">{{ formatPrice(cartTotalCents / 100) }}</p></div>
          <button type="button" :disabled="isSubmitting" class="btn btn-primary btn-sm min-w-[9rem]" :class="isSubmitting ? 'is-loading' : ''" @click="requestQuote">
            {{ isSubmitting ? 'Enviando...' : 'Solicitar orçamento' }}
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
