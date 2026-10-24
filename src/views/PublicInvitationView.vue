<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import FestouDecor from '../components/FestouDecor.vue'
import InvitationThemeCard from '../components/InvitationThemeCard.vue'
import { api } from '../lib/api'
import { getInvitationTheme } from '../lib/invitationThemes'
import { invitationImageVersion } from '../../shared/invitationImageVersion.js'

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
  { value: 'confirmado', label: '✓ Vou com certeza', color: 'peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:border-emerald-600' },
  { value: 'talvez', label: '? Talvez', color: 'peer-checked:bg-festou-yellow peer-checked:text-festou-dark peer-checked:border-festou-yellow' },
  { value: 'recusado', label: '✕ Não poderei ir', color: 'peer-checked:bg-rose-600 peer-checked:text-white peer-checked:border-rose-600' },
]

const currentTheme = computed(() => getInvitationTheme(invitation.value?.tema))

function setMeta(selector, attribute, key, content) {
  let tag = document.head.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attribute, key)
    document.head.append(tag)
  }
  tag.setAttribute('content', content)
}

function resetPageMeta() {
  if (typeof document === 'undefined') return
  const title = 'Festou! | Festas do seu jeito'
  const description = 'Descubra fornecedores, monte seu orçamento e envie convites digitais com RSVP em poucos cliques.'
  const image = `${window.location.origin}/festou-marca.png`

  document.title = title
  setMeta('meta[name="description"]', 'name', 'description', description)
  setMeta('meta[property="og:title"]', 'property', 'og:title', title)
  setMeta('meta[property="og:description"]', 'property', 'og:description', description)
  setMeta('meta[property="og:url"]', 'property', 'og:url', window.location.origin)
  setMeta('meta[property="og:image"]', 'property', 'og:image', image)
  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
  setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image)
}

function syncInvitationMeta(value) {
  if (typeof document === 'undefined') return
  if (!value) {
    resetPageMeta()
    return
  }

  const title = `${value.titulo} — convite de ${value.anfitriao}`
  const when = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value.data_evento))
  const description = `${when} · ${value.local_evento}. Confirme sua presença.`
  const url = `${window.location.origin}/convite/${encodeURIComponent(value.slug)}`
  const image = `${url}/imagem.png?v=${invitationImageVersion(value)}`

  document.title = title
  setMeta('meta[name="description"]', 'name', 'description', description)
  setMeta('meta[property="og:title"]', 'property', 'og:title', title)
  setMeta('meta[property="og:description"]', 'property', 'og:description', description)
  setMeta('meta[property="og:url"]', 'property', 'og:url', url)
  setMeta('meta[property="og:image"]', 'property', 'og:image', image)
  setMeta('meta[property="og:image:type"]', 'property', 'og:image:type', 'image/png')
  setMeta('meta[property="og:image:width"]', 'property', 'og:image:width', '1200')
  setMeta('meta[property="og:image:height"]', 'property', 'og:image:height', '630')
  setMeta('meta[property="og:image:alt"]', 'property', 'og:image:alt', `Convite de ${value.titulo} para ${value.anfitriao}`)
  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
  setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image)
}

function getGoogleCalendarUrl(inv) {
  if (!inv) return '#'
  const startDate = new Date(inv.data_evento)
  const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000) // +4h
  const formatTime = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '')
  const title = encodeURIComponent(inv.titulo)
  const details = encodeURIComponent(`${inv.mensagem || ''}\n\nConvite digital por Festou!`)
  const location = encodeURIComponent(inv.local_evento)
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatTime(startDate)}/${formatTime(endDate)}&details=${details}&location=${location}`
}

async function loadInvitation() {
  isLoading.value = true
  errorMessage.value = ''
  invitation.value = null
  summary.value = null

  try {
    const result = await api(`/invitations/${encodeURIComponent(route.params.slug)}`)
    invitation.value = { ...result.invitation, slug: route.params.slug }
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
      body: JSON.stringify(form),
    })
    summary.value = result.summary
    successMessage.value = 'Resposta confirmada com sucesso! Você pode usar o mesmo e-mail caso precise alterar depois.'
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível registrar sua resposta.'
  } finally {
    isSubmitting.value = false
  }
}

watch(() => route.params.slug, loadInvitation, { immediate: true })
watch(invitation, syncInvitationMeta)

onBeforeUnmount(() => {
  resetPageMeta()
})
</script>

<template>
  <main class="relative min-h-screen overflow-hidden px-4 py-8 transition-colors duration-500 sm:px-8 sm:py-14" :class="currentTheme.bg">
    <!-- Decoração festiva dos temas noturnos -->
    <template v-if="currentTheme.kind === 'colorido'">
      <div class="festou-confetti-field pointer-events-none absolute inset-0 opacity-20"></div>
      <FestouDecor />
    </template>

    <!-- Carregando -->
    <div v-if="isLoading" role="status" class="relative z-10 mx-auto max-w-2xl py-24 text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent"></div>
      <p class="mt-4 text-sm font-semibold">Carregando convite...</p>
    </div>

    <!-- Convite Não Encontrado -->
    <section v-else-if="errorMessage && !invitation" class="card-gradient relative z-10 mx-auto max-w-md p-8 text-center text-slate-800 shadow-xl">
      <span class="text-4xl">🔍</span>
      <h1 class="mt-4 font-heading text-2xl font-bold text-festou-dark">Convite não encontrado</h1>
      <p class="mt-2 text-sm text-slate-600">{{ errorMessage }}</p>
      <RouterLink to="/" class="btn btn-primary mt-6 text-xs font-bold">
        Ir para página inicial
      </RouterLink>
    </section>

    <!-- Convite Carregado -->
    <div v-else-if="invitation" class="relative z-10 mx-auto max-w-2xl">
      <!-- Topo -->
      <header class="flex items-center justify-between pb-6">
        <RouterLink to="/" class="font-heading text-xl font-extrabold tracking-tight">
          Festou<span class="text-festou-yellow">!</span>
        </RouterLink>
        <span class="rounded-full px-3 py-1 text-xs font-bold" :class="currentTheme.tag">
          Convite Digital
        </span>
      </header>

      <!-- Cartão Principal do Convite -->
      <InvitationThemeCard :invitation="invitation">
        <template #actions>
          <div class="mt-6 flex flex-wrap justify-center gap-3">
            <a
              :href="getGoogleCalendarUrl(invitation)"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 rounded-full border border-current/20 bg-white/20 px-4 py-1.5 text-xs font-bold shadow-sm backdrop-blur transition hover:bg-white/30"
            >
              <span>+ Adicionar ao Google Agenda</span>
            </a>
          </div>
        </template>
      </InvitationThemeCard>

      <!-- Seção do Formulário RSVP -->
      <section class="card-gradient mt-8 p-6 text-slate-900 shadow-xl sm:p-8">
        <div class="text-center">
          <h2 class="font-heading text-2xl font-bold text-festou-dark">Confirmação de Presença</h2>
          <p class="mt-1 text-xs text-slate-500">
            Responda para ajudar os anfitriões no planejamento da festa.
          </p>
        </div>

        <div v-if="successMessage" role="status" class="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-xs font-semibold text-green-900">
          {{ successMessage }}
        </div>
        <div v-if="errorMessage" role="alert" class="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-900">
          {{ errorMessage }}
        </div>

        <form v-if="invitation.aceita_rsvp" class="mt-6 space-y-4" @submit.prevent="submitRsvp">
          <div>
            <label for="guest-name" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Seu nome completo</label>
            <input
              id="guest-name"
              v-model.trim="form.nome"
              type="text"
              minlength="2"
              maxlength="100"
              autocomplete="name"
              required
              placeholder="Ex: Carlos Eduardo"
              class="w-full text-sm"
            />
          </div>

          <div>
            <label for="guest-email" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Seu e-mail</label>
            <input
              id="guest-email"
              v-model.trim="form.email"
              type="email"
              autocomplete="email"
              required
              placeholder="seuemail@exemplo.com"
              class="w-full text-sm"
            />
            <p class="mt-1 text-[11px] text-slate-400">Usado caso você precise atualizar sua resposta depois.</p>
          </div>

          <!-- Opções de Confirmação -->
          <fieldset>
            <legend class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Você vai?</legend>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label v-for="option in rsvpOptions" :key="option.value" class="cursor-pointer">
                <input
                  v-model="form.resposta"
                  class="peer sr-only"
                  type="radio"
                  name="rsvp"
                  :value="option.value"
                />
                <span
                  class="block rounded-xl border border-slate-200 px-3 py-2.5 text-center text-xs font-bold text-slate-700 transition"
                  :class="option.color"
                >
                  {{ option.label }}
                </span>
              </label>
            </div>
          </fieldset>

          <div v-if="form.resposta === 'confirmado'">
            <label for="guest-count" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Quantas pessoas com você?</label>
            <input
              id="guest-count"
              v-model.number="form.quantidade_pessoas"
              type="number"
              min="1"
              max="10"
              required
              class="w-28 text-sm"
            />
          </div>

          <div>
            <label for="guest-note" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Deixe um recado para o anfitrião (opcional)</label>
            <textarea
              id="guest-note"
              v-model.trim="form.mensagem"
              rows="2"
              maxlength="300"
              placeholder="Mal posso esperar pela festa! Parabéns!"
              class="w-full text-sm"
            ></textarea>
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="btn btn-primary w-full text-sm font-bold shadow-festive"
          >
            {{ isSubmitting ? 'Registrando presença...' : 'Enviar minha resposta' }}
          </button>
        </form>

        <div v-else class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
          <p class="font-bold">As confirmações de presença para este convite foram encerradas pelo anfitrião.</p>
        </div>

        <!-- Resumo de Convidados -->
        <div v-if="summary" class="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          <p>
            Já confirmados: <strong class="text-slate-800">{{ summary.pessoas_confirmadas }}</strong> {{ Number(summary.pessoas_confirmadas) === 1 ? 'pessoa' : 'pessoas' }}
            <span v-if="summary.talvez > 0"> · {{ summary.talvez }} talvez</span>
          </p>
        </div>
      </section>

      <footer class="py-8 text-center text-xs opacity-60">
        Plataforma Festou! · Planeje celebrações inesquecíveis
      </footer>
    </div>
  </main>
</template>
