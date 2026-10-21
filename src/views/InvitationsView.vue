<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../lib/api'

const appOrigin = window.location.origin
const invitations = ref([])
const createdInvitation = ref(null)
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(true)
const isSubmitting = ref(false)
const didCopy = ref(false)

const form = reactive({
  titulo: '',
  anfitriao: '',
  data_evento: '',
  local_evento: '',
  mensagem: '',
  tema: 'jardim',
})

const minimumDate = computed(() => {
  const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
  return date.toISOString().slice(0, 16)
})

const themes = [
  { value: 'jardim', label: 'Jardim' },
  { value: 'colorido', label: 'Colorido' },
  { value: 'ceu-estrelado', label: 'Céu estrelado' },
]

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(value))
}

function getConfirmationSummary(confirmations = []) {
  const confirmed = confirmations.filter(({ resposta }) => resposta === 'confirmado')
  const maybe = confirmations.filter(({ resposta }) => resposta === 'talvez')
  const confirmedGuests = confirmed.reduce(
    (total, confirmation) => total + Number(confirmation.quantidade_pessoas),
    0,
  )

  const responsesLabel = confirmations.length === 1 ? 'resposta' : 'respostas'
  const guestsLabel = confirmedGuests === 1 ? 'pessoa confirmada' : 'pessoas confirmadas'

  return `${confirmations.length} ${responsesLabel} · ${confirmedGuests} ${guestsLabel} · ${maybe.length} talvez`
}

async function loadInvitations() {
  isLoading.value = true

  try {
    const result = await api('/invitations/mine')
    invitations.value = result.invitations
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível carregar seus convites.'
  } finally {
    isLoading.value = false
  }
}

async function createInvitation() {
  errorMessage.value = ''
  successMessage.value = ''
  createdInvitation.value = null
  isSubmitting.value = true

  try {
    const { invitation } = await api('/invitations', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        data_evento: new Date(form.data_evento).toISOString(),
      }),
    })

    createdInvitation.value = invitation
    invitations.value.unshift({ ...invitation, confirmacoes: [] })
    successMessage.value = 'Convite criado. Compartilhe o link com seus convidados.'
    Object.assign(form, {
      titulo: '',
      anfitriao: '',
      data_evento: '',
      local_evento: '',
      mensagem: '',
      tema: 'jardim',
    })
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível criar o convite.'
  } finally {
    isSubmitting.value = false
  }
}

async function copyInvitationLink(slug) {
  const url = `${window.location.origin}/convite/${slug}`

  try {
    await navigator.clipboard.writeText(url)
    didCopy.value = true
    window.setTimeout(() => { didCopy.value = false }, 2000)
  } catch {
    errorMessage.value = 'Não foi possível copiar o link. Abra o convite e copie o endereço do navegador.'
  }
}

onMounted(loadInvitations)
</script>

<template>
  <main class="min-h-screen bg-orange-50 text-slate-900">
    <header class="flex items-center justify-between border-b border-orange-100 bg-white px-6 py-5 md:px-12">
      <RouterLink to="/" class="text-2xl font-bold text-rose-700">Festou!</RouterLink>
      <RouterLink to="/vitrine" class="text-sm font-semibold text-rose-700 hover:underline">Vitrine</RouterLink>
    </header>

    <div class="festou-surface mx-auto max-w-6xl px-6 py-10 md:px-12">
      <p class="text-sm font-bold uppercase tracking-widest text-rose-700">Um dia especial</p>
      <h1 class="mt-2 text-3xl font-bold">Meus convites</h1>
      <p class="mt-2 text-slate-600">Crie um convite digital e acompanhe as confirmações de presença.</p>

      <p v-if="errorMessage" role="alert" class="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">{{ errorMessage }}</p>
      <p v-if="successMessage" role="status" class="mt-6 rounded-md bg-green-100 px-4 py-3 text-sm text-green-900">{{ successMessage }}</p>

      <section class="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.8fr)]">
        <div>
          <h2 class="text-xl font-bold">Criar convite</h2>
          <form class="mt-5 space-y-5" @submit.prevent="createInvitation">
            <div>
              <label for="invite-title" class="mb-1 block text-sm font-semibold">Nome da celebração</label>
              <input
                id="invite-title"
                v-model.trim="form.titulo"
                type="text"
                minlength="3"
                maxlength="100"
                required
                placeholder="Aniversário da Marina"
                class="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
              />
            </div>
            <div>
              <label for="host-name" class="mb-1 block text-sm font-semibold">Nome de quem convida</label>
              <input
                id="host-name"
                v-model.trim="form.anfitriao"
                type="text"
                minlength="2"
                maxlength="100"
                required
                class="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
              />
            </div>
            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label for="event-date" class="mb-1 block text-sm font-semibold">Data e hora</label>
                <input
                  id="event-date"
                  v-model="form.data_evento"
                  type="datetime-local"
                  :min="minimumDate"
                  required
                  class="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
                />
              </div>
              <div>
                <label for="invite-theme" class="mb-1 block text-sm font-semibold">Tema visual</label>
                <select
                  id="invite-theme"
                  v-model="form.tema"
                  class="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
                >
                  <option v-for="theme in themes" :key="theme.value" :value="theme.value">{{ theme.label }}</option>
                </select>
              </div>
            </div>
            <div>
              <label for="event-location" class="mb-1 block text-sm font-semibold">Local</label>
              <input
                id="event-location"
                v-model.trim="form.local_evento"
                type="text"
                minlength="3"
                maxlength="180"
                required
                placeholder="Espaço, endereço ou referência"
                class="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
              />
            </div>
            <div>
              <label for="invite-message" class="mb-1 block text-sm font-semibold">Mensagem (opcional)</label>
              <textarea
                id="invite-message"
                v-model.trim="form.mensagem"
                rows="3"
                maxlength="500"
                placeholder="Venha celebrar esse momento com a gente!"
                class="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
              ></textarea>
            </div>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="rounded-md bg-rose-700 px-5 py-3 font-semibold text-white hover:bg-rose-800 disabled:cursor-wait disabled:opacity-60"
            >
              {{ isSubmitting ? 'Criando...' : 'Criar convite digital' }}
            </button>
          </form>

          <div v-if="createdInvitation" class="mt-5 rounded-md border border-green-200 bg-green-50 p-4">
            <p class="text-sm font-semibold">Link do convite</p>
            <div class="mt-2 flex flex-wrap items-center gap-3">
              <RouterLink :to="`/convite/${createdInvitation.slug}`" class="break-all text-sm text-rose-700 underline">
                {{ `${appOrigin}/convite/${createdInvitation.slug}` }}
              </RouterLink>
              <button type="button" class="text-sm font-bold text-green-800 underline" @click="copyInvitationLink(createdInvitation.slug)">
                {{ didCopy ? 'Copiado' : 'Copiar link' }}
              </button>
            </div>
          </div>
        </div>

        <section>
          <h2 class="text-xl font-bold">Confirmações</h2>
          <p v-if="isLoading" role="status" class="mt-5 text-sm text-slate-600">Carregando convites...</p>
          <p v-else-if="!invitations.length" class="mt-5 text-sm text-slate-600">Seus convites e respostas aparecerão aqui.</p>
          <div v-else class="mt-5 divide-y divide-orange-200 border-y border-orange-200">
            <article v-for="invitation in invitations" :key="invitation.id" class="py-5">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h3 class="font-bold">{{ invitation.titulo }}</h3>
                  <p class="mt-1 text-sm text-slate-600">{{ formatDate(invitation.data_evento) }}</p>
                  <p class="mt-2 text-sm text-slate-600">
                    {{ getConfirmationSummary(invitation.confirmacoes) }}
                  </p>
                </div>
                <RouterLink :to="`/convite/${invitation.slug}`" class="shrink-0 text-sm font-semibold text-rose-700 hover:underline">
                  Ver convite
                </RouterLink>
              </div>
              <div v-if="invitation.confirmacoes?.length" class="mt-4 space-y-3">
                <div v-for="confirmation in invitation.confirmacoes" :key="confirmation.email" class="flex justify-between gap-4 text-sm">
                  <span>{{ confirmation.nome }} · {{ confirmation.quantidade_pessoas }} {{ confirmation.quantidade_pessoas === 1 ? 'pessoa' : 'pessoas' }}</span>
                  <span class="font-semibold">{{ { confirmado: 'Confirmado', recusado: 'Não vai', talvez: 'Talvez' }[confirmation.resposta] }}</span>
                </div>
              </div>
              <p v-else class="mt-3 text-sm text-slate-500">Ainda sem respostas.</p>
            </article>
          </div>
        </section>
      </section>
    </div>
  </main>
</template>