<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../lib/api'

const route = useRoute()
const invitation = ref(null)
const summary = ref(null)
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const form = reactive({
  nome: '',
  email: '',
  resposta: 'confirmado',
  quantidade_pessoas: 1,
  mensagem: '',
})

const rsvpOptions = [
  { value: 'confirmado', label: 'Vou' },
  { value: 'talvez', label: 'Talvez' },
  { value: 'recusado', label: 'Não vou' },
]

const themeStyles = {
  jardim: 'bg-gradient-to-br from-emerald-100 via-lime-50 to-white text-emerald-950',
  colorido: 'bg-gradient-to-br from-festou-magenta via-festou-purple to-festou-midnight text-white',
  'ceu-estrelado': 'bg-gradient-to-br from-festou-midnight via-indigo-950 to-festou-purple text-white',
}

const themeClass = computed(() => themeStyles[invitation.value?.tema] || themeStyles.jardim)

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(value))
}

async function loadInvitation() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await api(`/invitations/${encodeURIComponent(route.params.slug)}`)
    invitation.value = result.invitation
    summary.value = result.summary
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível carregar este convite.'
  } finally {
    isLoading.value = false
  }
}

async function submitRsvp() {
  errorMessage.value = ''
  successMessage.value = ''
  isSubmitting.value = true

  try {
    const result = await api(`/invitations/${encodeURIComponent(route.params.slug)}/rsvp`, {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        quantidade_pessoas: form.resposta === 'confirmado' ? Number(form.quantidade_pessoas) : 1,
      }),
    })

    summary.value = result.summary
    successMessage.value = 'Resposta registrada! Você pode usar o mesmo e-mail para atualizar sua confirmação.'
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível registrar sua resposta.'
  } finally {
    isSubmitting.value = false
  }
}

watch(() => route.params.slug, loadInvitation, { immediate: true })
</script>

<template>
  <main class="min-h-screen px-5 py-10 sm:px-8 sm:py-16" :class="themeClass">
    <div v-if="isLoading" role="status" class="mx-auto max-w-2xl py-20 text-center">Carregando convite...</div>
    <section v-else-if="errorMessage && !invitation" class="mx-auto max-w-xl py-20 text-center">
      <p class="text-sm font-bold uppercase tracking-widest">Festou!</p>
      <h1 class="mt-4 text-3xl font-bold">Convite não encontrado</h1>
      <p class="mt-3">{{ errorMessage }}</p>
      <RouterLink to="/" class="mt-6 inline-block font-semibold underline">Ir para Festou!</RouterLink>
    </section>

    <div v-else-if="invitation" class="mx-auto max-w-3xl">
      <header class="flex items-center justify-between">
        <RouterLink to="/" class="festou-wordmark">Festou!</RouterLink>
        <span class="text-sm font-semibold">Convite digital</span>
      </header>

      <article class="mx-auto mt-10 max-w-2xl border-y border-current/20 px-5 py-10 text-center sm:mt-14 sm:px-12 sm:py-14">
        <p class="text-sm font-bold uppercase tracking-widest opacity-70">Você está convidado</p>
        <h1 class="mt-5 text-4xl font-bold leading-tight sm:text-6xl">{{ invitation.titulo }}</h1>
        <p class="mt-5 text-xl">{{ invitation.anfitriao }} espera por você.</p>
        <p v-if="invitation.mensagem" class="mx-auto mt-7 max-w-lg text-lg leading-8">{{ invitation.mensagem }}</p>
        <dl class="mx-auto mt-9 grid max-w-lg gap-5 text-left sm:grid-cols-2">
          <div>
            <dt class="text-xs font-bold uppercase tracking-wider opacity-70">Quando</dt>
            <dd class="mt-1 font-semibold">{{ formatDate(invitation.data_evento) }}</dd>
          </div>
          <div>
            <dt class="text-xs font-bold uppercase tracking-wider opacity-70">Onde</dt>
            <dd class="mt-1 font-semibold">{{ invitation.local_evento }}</dd>
          </div>
        </dl>
      </article>

      <section class="mx-auto mt-10 max-w-xl rounded-lg border border-current/15 bg-white/80 p-6 text-slate-900 shadow-sm sm:p-8">
        <h2 class="text-2xl font-bold">Você vem?</h2>
        <p class="mt-2 text-sm text-slate-600">Confirme sua presença para ajudar na organização.</p>

        <p v-if="successMessage" role="status" class="mt-5 rounded-md bg-green-100 px-4 py-3 text-sm text-green-900">
          {{ successMessage }}
        </p>
        <p v-if="errorMessage" role="alert" class="mt-5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
          {{ errorMessage }}
        </p>

        <form v-if="invitation.aceita_rsvp" class="mt-6 space-y-5" @submit.prevent="submitRsvp">
          <div>
            <label for="guest-name" class="mb-1 block text-sm font-semibold">Seu nome</label>
            <input
              id="guest-name"
              v-model.trim="form.nome"
              type="text"
              minlength="2"
              maxlength="100"
              autocomplete="name"
              required
              class="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
            />
          </div>
          <div>
            <label for="guest-email" class="mb-1 block text-sm font-semibold">E-mail</label>
            <input
              id="guest-email"
              v-model.trim="form.email"
              type="email"
              autocomplete="email"
              required
              class="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
            />
            <p class="mt-1 text-xs text-slate-500">Usaremos o e-mail para localizar e atualizar sua resposta.</p>
          </div>
          <fieldset>
            <legend class="mb-2 text-sm font-semibold">Confirmação</legend>
            <div class="grid grid-cols-3 gap-2">
              <label v-for="option in rsvpOptions" :key="option.value" class="cursor-pointer">
                <input v-model="form.resposta" class="peer sr-only" type="radio" name="rsvp" :value="option.value" />
                <span class="block rounded-md border border-slate-300 px-2 py-2 text-center text-sm font-semibold peer-checked:border-rose-700 peer-checked:bg-rose-700 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-rose-300">
                  {{ option.label }}
                </span>
              </label>
            </div>
          </fieldset>
          <div v-if="form.resposta === 'confirmado'">
            <label for="guest-count" class="mb-1 block text-sm font-semibold">Quantidade de pessoas</label>
            <input
              id="guest-count"
              v-model.number="form.quantidade_pessoas"
              type="number"
              min="1"
              max="10"
              required
              class="w-28 rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
            />
          </div>
          <div>
            <label for="guest-note" class="mb-1 block text-sm font-semibold">Mensagem (opcional)</label>
            <textarea
              id="guest-note"
              v-model.trim="form.mensagem"
              rows="2"
              maxlength="300"
              class="w-full resize-y rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
            ></textarea>
          </div>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full rounded-md bg-rose-700 px-4 py-3 font-semibold text-white hover:bg-rose-800 disabled:cursor-wait disabled:opacity-60"
          >
            {{ isSubmitting ? 'Enviando...' : 'Enviar resposta' }}
          </button>
        </form>
        <p v-else class="mt-5 text-sm text-slate-600">As confirmações para este convite foram encerradas.</p>

        <div v-if="summary" class="mt-7 border-t border-slate-200 pt-5">
          <h3 class="text-sm font-bold">Presenças até agora</h3>
          <p class="mt-2 text-sm text-slate-600">
            {{ summary.pessoas_confirmadas }} {{ Number(summary.pessoas_confirmadas) === 1 ? 'pessoa confirmada' : 'pessoas confirmadas' }}
            · {{ summary.talvez }} talvez
          </p>
        </div>
      </section>
      <footer class="py-8 text-center text-xs opacity-70">Feito com Festou!</footer>
    </div>
  </main>
</template>