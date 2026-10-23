<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { api, asArray } from '../lib/api'
import { formatDate } from '../lib/format'

const props = defineProps({
  orderId: { type: String, required: true },
  currentUserId: { type: String, required: true },
  disabled: { type: Boolean, default: false },
})

const isOpen = ref(false)
const messages = ref([])
const text = ref('')
const error = ref('')
const isLoading = ref(false)
const isSending = ref(false)
let refreshTimer
const canSend = computed(() => !props.disabled && text.value.trim().length > 0 && !isSending.value)

async function loadMessages() {
  try {
    const result = await api(`/orders/${props.orderId}/messages`)
    messages.value = asArray(result.messages)
    error.value = ''
  } catch (loadError) {
    error.value = loadError.message || 'Nao foi possivel carregar a conversa.'
  } finally {
    isLoading.value = false
  }
}

function openChat() {
  isOpen.value = !isOpen.value
}

watch(isOpen, (open) => {
  if (open) {
    isLoading.value = true
    loadMessages()
    refreshTimer = window.setInterval(loadMessages, 5000)
  } else if (refreshTimer) {
    window.clearInterval(refreshTimer)
    refreshTimer = undefined
  }
})

async function sendMessage() {
  if (!canSend.value) return
  isSending.value = true
  error.value = ''
  try {
    await api(`/orders/${props.orderId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ texto: text.value.trim() }),
    })
    text.value = ''
    await loadMessages()
  } catch (sendError) {
    error.value = sendError.message || 'Nao foi possivel enviar a mensagem.'
  } finally {
    isSending.value = false
  }
}

onBeforeUnmount(() => {
  if (refreshTimer) window.clearInterval(refreshTimer)
})
</script>

<template>
  <section class="mt-5 border-t border-slate-100 pt-4">
    <button
      type="button"
      class="flex w-full items-center justify-between rounded-xl bg-festou-soft px-4 py-3 text-left font-bold text-festou-midnight transition hover:bg-festou-magenta/10"
      :aria-expanded="isOpen"
      @click="openChat"
    >
      <span>💬 Conversa do pedido</span>
      <span class="text-sm text-festou-primary">{{ isOpen ? 'Fechar' : 'Abrir conversa' }}</span>
    </button>

    <div v-if="isOpen" class="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div class="max-h-80 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-3" aria-live="polite" aria-label="Mensagens do pedido">
        <p v-if="isLoading && !messages.length" class="py-6 text-center text-sm text-slate-500">Carregando conversa...</p>
        <p v-else-if="!messages.length" class="py-6 text-center text-sm text-slate-500">Ainda nao ha mensagens. Combine os detalhes por aqui.</p>
        <article
          v-for="message in messages"
          :key="message.id"
          class="max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm"
          :class="message.autor_id === currentUserId ? 'ml-auto bg-festou-primary text-white' : 'bg-white text-slate-800 shadow-sm'"
        >
          <p class="mb-1 text-[11px] font-bold opacity-75">{{ message.autor_nome }} · {{ formatDate(message.created_at) }}</p>
          <p class="whitespace-pre-wrap break-words">{{ message.texto }}</p>
        </article>
      </div>

      <p v-if="error" role="alert" class="mt-3 text-sm font-semibold text-rose-700">{{ error }}</p>
      <form v-if="!disabled" class="mt-3 flex flex-col gap-2 sm:flex-row" @submit.prevent="sendMessage">
        <label class="sr-only" :for="`message-${orderId}`">Sua mensagem</label>
        <textarea
          :id="`message-${orderId}`"
          v-model="text"
          rows="2"
          maxlength="2000"
          placeholder="Escreva uma mensagem para o fornecedor..."
          class="min-h-14 flex-1 resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-festou-primary focus:outline-none focus:ring-2 focus:ring-festou-primary/20"
        ></textarea>
        <button type="submit" :disabled="!canSend" class="btn btn-primary self-end disabled:cursor-not-allowed disabled:opacity-50 sm:self-stretch">
          {{ isSending ? 'Enviando...' : 'Enviar' }}
        </button>
      </form>
      <p v-else class="mt-3 text-sm text-slate-500">Esta conversa estÃ¡ encerrada.</p>
      <p v-if="!disabled" class="mt-2 text-xs text-slate-400">A conversa atualiza automaticamente a cada 5 segundos.</p>
    </div>
  </section>
</template>
