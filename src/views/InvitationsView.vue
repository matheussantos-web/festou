<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api, asArray } from '../lib/api'
import { formatDate } from '../lib/format'

const appOrigin = window.location.origin
const invitations = ref([])
const createdInvitation = ref(null)
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(true)
const isSubmitting = ref(false)
const didCopy = ref(false)
const copiedSlug = ref(null)
const updatingRsvpId = ref(null)

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
  { value: 'jardim', label: '🌸 Jardim Encantado' },
  { value: 'colorido', label: '🎨 Colorido & Vibrante' },
  { value: 'ceu-estrelado', label: '✨ Céu Estrelado' },
]

function formatInvitationDate(value) {
  return formatDate(value, { dateStyle: 'full', timeStyle: 'short' })
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
    invitations.value = asArray(result.invitations)
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
    invitations.value.unshift({ ...invitation, aceita_rsvp: invitation.aceita_rsvp ?? true, confirmacoes: [] })
    successMessage.value = 'Convite criado com sucesso! Compartilhe o link com seus convidados.'
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
    copiedSlug.value = slug
    window.setTimeout(() => {
      didCopy.value = false
      if (copiedSlug.value === slug) {
        copiedSlug.value = null
      }
    }, 2000)
  } catch {
    errorMessage.value = 'Não foi possível copiar o link. Abra o convite e copie o endereço do navegador.'
  }
}

async function toggleRsvp(invitation) {
  errorMessage.value = ''
  successMessage.value = ''
  updatingRsvpId.value = invitation.id

  try {
    const nextStatus = !invitation.aceita_rsvp
    const result = await api(`/invitations/${invitation.id}/rsvp-status`, {
      method: 'PATCH',
      body: JSON.stringify({ aceita_rsvp: nextStatus }),
    })
    invitation.aceita_rsvp = nextStatus
    successMessage.value = result.message || 'Status de confirmações atualizado com sucesso.'
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível atualizar o status do convite.'
  } finally {
    updatingRsvpId.value = null
  }
}

onMounted(loadInvitations)
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">

    <main id="conteudo-principal" class="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
      <!-- Cabeçalho -->
      <div class="border-b border-slate-200/80 pb-6">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-festou-primary">
          <span>💌</span> Convites Interativos
        </span>
        <h1 class="mt-3 font-heading text-3xl font-extrabold text-festou-midnight sm:text-4xl">
          Meus Convites Digitais & RSVP
        </h1>
        <p class="mt-2 text-slate-600">
          Crie convites personalizados, envie o link pelo WhatsApp e acompanhe a lista de convidados em tempo real.
        </p>
      </div>

      <div v-if="successMessage" role="status" class="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-900 shadow-sm">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" role="alert" class="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900 shadow-sm">
        {{ errorMessage }}
      </div>

      <div class="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <!-- Formulário de Criação -->
        <section class="festou-surface p-6 sm:p-8">
          <h2 class="font-heading text-2xl font-bold text-festou-midnight">Criar Novo Convite</h2>
          <p class="mt-1 text-xs text-slate-500">Preencha as informações da celebração para gerar a página pública.</p>

          <form class="mt-6 space-y-4" @submit.prevent="createInvitation">
            <div>
              <label for="invite-title" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Nome da celebração</label>
              <input
                id="invite-title"
                v-model.trim="form.titulo"
                type="text"
                minlength="3"
                maxlength="100"
                required
                placeholder="Ex: Aniversário de 5 anos do Lucas"
                class="w-full text-sm"
              />
            </div>

            <div>
              <label for="host-name" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Quem convida (anfitrião)</label>
              <input
                id="host-name"
                v-model.trim="form.anfitriao"
                type="text"
                minlength="2"
                maxlength="100"
                required
                placeholder="Ex: Família Silva ou Marina & Pedro"
                class="w-full text-sm"
              />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label for="event-date" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Data e horário</label>
                <input
                  id="event-date"
                  v-model="form.data_evento"
                  type="datetime-local"
                  :min="minimumDate"
                  required
                  class="w-full text-sm"
                />
              </div>
              <div>
                <label for="invite-theme" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Tema visual</label>
                <select
                  id="invite-theme"
                  v-model="form.tema"
                  class="w-full text-sm"
                >
                  <option v-for="theme in themes" :key="theme.value" :value="theme.value">{{ theme.label }}</option>
                </select>
              </div>
            </div>

            <div>
              <label for="event-location" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Local ou endereço</label>
              <input
                id="event-location"
                v-model.trim="form.local_evento"
                type="text"
                minlength="3"
                maxlength="180"
                required
                placeholder="Ex: Buffet Estrela Mágica, Rua das Flores, 123"
                class="w-full text-sm"
              />
            </div>

            <div>
              <label for="invite-message" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Mensagem aos convidados (opcional)</label>
              <textarea
                id="invite-message"
                v-model.trim="form.mensagem"
                rows="3"
                maxlength="500"
                placeholder="Venha comemorar essa data tão especial com a gente! Traga seu sorriso."
                class="w-full text-sm"
              ></textarea>
            </div>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="btn-festou-primary w-full text-sm"
            >
              {{ isSubmitting ? 'Gerando convite digital...' : 'Criar convite digital' }}
            </button>
          </form>

          <!-- Banner de Sucesso com Link para Copiar -->
          <div v-if="createdInvitation" class="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
            <p class="text-xs font-bold uppercase tracking-wider text-green-900">Seu convite está pronto!</p>
            <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
              <RouterLink :to="`/convite/${createdInvitation.slug}`" target="_blank" class="break-all text-xs font-semibold text-festou-primary underline">
                {{ `${appOrigin}/convite/${createdInvitation.slug}` }}
              </RouterLink>
              <button
                type="button"
                class="rounded-full bg-green-700 px-3 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-green-800"
                @click="copyInvitationLink(createdInvitation.slug)"
              >
                {{ didCopy ? '✓ Copiado!' : 'Copiar link' }}
              </button>
            </div>
          </div>
        </section>

        <!-- Lista de Convites e Respostas -->
        <section>
          <div class="flex items-center justify-between">
            <h2 class="font-heading text-2xl font-bold text-festou-midnight">Meus Convites Gerados</h2>
            <span class="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
              {{ invitations.length }}
            </span>
          </div>

          <div v-if="isLoading" class="py-12 text-center text-slate-500">
            Carregando seus convites...
          </div>

          <div v-else-if="!invitations.length" class="festou-surface mt-6 p-8 text-center text-slate-600">
            <span class="text-3xl">💌</span>
            <p class="mt-2 text-sm font-semibold">Você ainda não criou convites.</p>
            <p class="text-xs text-slate-500">Preencha o formulário ao lado para gerar o seu primeiro convite digital.</p>
          </div>

          <div v-else class="mt-6 space-y-4">
            <article
              v-for="invitation in invitations"
              :key="invitation.id"
              class="festou-surface p-5 transition-all hover:shadow-md"
            >
              <div class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="font-bold text-slate-900">{{ invitation.titulo }}</h3>
                    <span
                      v-if="invitation.aceita_rsvp !== false"
                      class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800"
                    >
                      <span class="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                      RSVP Aberto
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700"
                    >
                      <span class="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
                      RSVP Encerrado
                    </span>
                  </div>
                  <p class="mt-1 text-xs text-slate-500">{{ formatInvitationDate(invitation.data_evento) }}</p>
                  <p class="mt-1.5 text-xs font-bold text-festou-primary">
                    {{ getConfirmationSummary(invitation.confirmacoes) }}
                  </p>
                </div>

                <!-- Ações do Convite -->
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    @click="copyInvitationLink(invitation.slug)"
                  >
                    {{ copiedSlug === invitation.slug ? '✓ Copiado' : 'Copiar link' }}
                  </button>
                  <button
                    type="button"
                    :disabled="updatingRsvpId === invitation.id"
                    class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                    @click="toggleRsvp(invitation)"
                  >
                    {{ updatingRsvpId === invitation.id ? '...' : (invitation.aceita_rsvp !== false ? 'Encerrar' : 'Reabrir') }}
                  </button>
                  <RouterLink
                    :to="`/convite/${invitation.slug}`"
                    target="_blank"
                    class="rounded-lg bg-pink-50 px-2.5 py-1 text-xs font-bold text-festou-primary transition hover:bg-pink-100"
                  >
                    Abrir ↗
                  </RouterLink>
                </div>
              </div>

              <!-- Lista de convidados que responderam -->
              <div v-if="invitation.confirmacoes?.length" class="mt-3 divide-y divide-slate-100 text-xs">
                <div
                  v-for="conf in invitation.confirmacoes"
                  :key="conf.email"
                  class="flex items-center justify-between py-1.5"
                >
                  <span class="text-slate-800">
                    <strong class="font-semibold">{{ conf.nome }}</strong> ({{ conf.quantidade_pessoas }} {{ conf.quantidade_pessoas === 1 ? 'pessoa' : 'pessoas' }})
                  </span>
                  <span
                    class="rounded-full px-2 py-0.5 font-bold"
                    :class="{
                      'bg-emerald-100 text-emerald-800': conf.resposta === 'confirmado',
                      'bg-amber-100 text-amber-800': conf.resposta === 'talvez',
                      'bg-rose-100 text-rose-800': conf.resposta === 'recusado',
                    }"
                  >
                    {{ { confirmado: 'Confirmado', recusado: 'Não vai', talvez: 'Talvez' }[conf.resposta] }}
                  </span>
                </div>
              </div>
              <p v-else class="mt-3 text-xs text-slate-400">Nenhuma confirmação de presença registrada ainda.</p>
            </article>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
