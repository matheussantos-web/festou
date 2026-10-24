<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { api } from '../lib/api'

const props = defineProps({
  orderId: { type: String, required: true },
  perspective: { type: String, required: true, validator: (value) => ['cliente', 'fornecedor'].includes(value) },
})

const review = ref(null)
const canReview = ref(false)
const nota = ref(5)
const comentario = ref('')
const isLoading = ref(true)
const isSubmitting = ref(false)
const loadFailed = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const star = '\u2605'
let refreshTimer
let isFetching = false

async function loadReview({ silent = false } = {}) {
  if (isFetching || isSubmitting.value) return
  isFetching = true
  if (!silent) {
    isLoading.value = true
    loadFailed.value = false
    errorMessage.value = ''
  }

  try {
    const result = await api(`/orders/${props.orderId}/review`)
    review.value = result.review
    canReview.value = result.can_review
    nota.value = result.review?.nota ?? 5
    comentario.value = result.review?.comentario ?? ''
  } catch (error) {
    if (!silent) {
      loadFailed.value = true
      errorMessage.value = error.message || 'Nao foi possivel carregar a avaliacao.'
    }
  } finally {
    isFetching = false
    if (!silent) isLoading.value = false
  }
}

async function saveReview() {
  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const result = await api(`/orders/${props.orderId}/review`, {
      method: 'POST',
      body: JSON.stringify({ nota: nota.value, comentario: comentario.value }),
    })
    review.value = result.review
    successMessage.value = result.message || 'Avaliacao salva com sucesso.'
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel salvar sua avaliacao.'
  } finally {
    isSubmitting.value = false
  }
}

watch(() => props.orderId, () => loadReview(), { immediate: true })

onMounted(() => {
  if (props.perspective === 'fornecedor') {
    refreshTimer = window.setInterval(() => loadReview({ silent: true }), 15000)
  }
})

onBeforeUnmount(() => window.clearInterval(refreshTimer))
</script>

<template>
  <section class="mt-5 rounded-2xl border border-festou-secondary/15 bg-festou-secondary/5 p-4 sm:p-5" aria-label="Avaliacao do servico">
    <h3 class="font-heading text-lg font-bold text-festou-dark">
      {{ perspective === 'cliente' ? 'Avalie este fornecedor' : 'Feedback do cliente' }}
    </h3>

    <p v-if="isLoading" role="status" class="mt-3 text-sm text-slate-600">Carregando avaliacao...</p>
    <div v-else-if="loadFailed" role="alert" class="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-900">
      <p>{{ errorMessage }}</p>
      <button type="button" class="mt-2 underline" @click="loadReview()">Tentar novamente</button>
    </div>
    <div v-else-if="perspective === 'fornecedor'">
      <div v-if="review" class="mt-3">
        <p class="text-lg tracking-widest text-amber-500" :aria-label="`${review.nota} de 5 estrelas`">
          {{ star.repeat(review.nota) }}<span class="text-slate-300">{{ star.repeat(5 - review.nota) }}</span>
        </p>
        <p v-if="review.comentario" class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{{ review.comentario }}</p>
        <p v-else class="mt-2 text-sm text-slate-500">O cliente nao deixou um comentario.</p>
      </div>
      <p v-else class="mt-2 text-sm text-slate-600">O cliente ainda nao enviou uma avaliacao.</p>
    </div>

    <form v-else-if="canReview" class="mt-3 space-y-4" @submit.prevent="saveReview">
      <div>
        <p class="mb-2 text-sm font-semibold text-slate-700">Como foi sua experiencia?</p>
        <div class="flex gap-2" role="group" aria-label="Nota de 1 a 5 estrelas">
          <button
            v-for="value in 5"
            :key="value"
            type="button"
            :aria-label="`${value} ${value === 1 ? 'estrela' : 'estrelas'}`"
            :aria-pressed="nota === value"
            class="text-3xl leading-none transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-festou-primary"
            :class="value <= nota ? 'text-amber-500' : 'text-slate-300'"
            @click="nota = value"
          >{{ star }}</button>
        </div>
      </div>

      <label class="block text-sm font-semibold text-slate-700">
        Comentario (opcional)
        <textarea v-model.trim="comentario" rows="3" maxlength="1000" class="form-control mt-2 w-full" placeholder="Conte como foi sua experiencia com o fornecedor."></textarea>
      </label>

      <p v-if="successMessage" role="status" class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{{ successMessage }}</p>
      <p v-if="errorMessage" role="alert" class="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-900">{{ errorMessage }}</p>
      <button type="submit" :disabled="isSubmitting" class="btn btn-primary text-sm disabled:cursor-wait disabled:opacity-60">
        {{ isSubmitting ? 'Salvando avaliacao...' : review ? 'Atualizar avaliacao' : 'Enviar avaliacao' }}
      </button>
    </form>

    <p v-else-if="review" class="mt-3 text-sm text-slate-600">Sua avaliacao ja foi registrada.</p>
    <p v-else class="mt-3 text-sm text-slate-600">A avaliacao ficara disponivel apos a conclusao do servico.</p>
  </section>
</template>
