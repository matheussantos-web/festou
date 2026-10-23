<script setup>
import { computed } from 'vue'
import { formatDate } from '../lib/format'
import { getInvitationTheme, invitationThemes } from '../lib/invitationThemes'

const props = defineProps({
  invitation: { type: Object, required: true },
  compact: { type: Boolean, default: false },
})

const theme = computed(() => getInvitationTheme(props.invitation.tema))
const themeName = computed(() => invitationThemes[props.invitation.tema]?.label || invitationThemes.jardim.label)
const eventDate = computed(() => {
  if (!props.invitation.data_evento) return 'Data e horário do evento'
  const date = new Date(props.invitation.data_evento)
  if (Number.isNaN(date.getTime())) return 'Data e horário do evento'
  return formatDate(date.toISOString(), { dateStyle: 'full', timeStyle: 'short' })
})
</script>

<template>
  <article
    class="invitation-theme-card relative isolate overflow-hidden text-center transition-colors duration-300"
    :class="[theme.card, compact ? 'rounded-2xl p-5 sm:p-6' : 'mt-4 rounded-3xl p-8 sm:p-12']"
  >
    <div v-if="invitation.tema === 'jardim'" class="invitation-card-garden-ornaments" aria-hidden="true">
      <span class="invitation-flower invitation-flower--one">✿</span>
      <span class="invitation-flower invitation-flower--two">❀</span>
      <span class="invitation-leaf invitation-leaf--one">❧</span>
      <span class="invitation-leaf invitation-leaf--two">❧</span>
    </div>

    <div v-else-if="invitation.tema === 'colorido'" class="invitation-card-colorido-ornaments" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span><span></span>
    </div>

    <div v-else class="invitation-card-sky-ornaments" aria-hidden="true">
      <span class="invitation-moon"></span>
      <span class="invitation-sparkle invitation-sparkle--one">✦</span>
      <span class="invitation-sparkle invitation-sparkle--two">✧</span>
      <span class="invitation-sparkle invitation-sparkle--three">✦</span>
    </div>

    <div class="relative z-10">
      <p class="text-[10px] font-bold uppercase tracking-[0.2em] opacity-75 sm:text-xs">
        {{ theme.eyebrow }}
      </p>
      <span class="mt-3 inline-flex rounded-full px-3 py-1 text-[10px] font-bold shadow-sm" :class="theme.tag">
        {{ themeName }}
      </span>

      <component
        :is="compact ? 'h3' : 'h1'"
        class="invitation-theme-title mx-auto mt-4 max-w-xl break-words font-heading font-extrabold leading-tight tracking-tight"
        :class="compact ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl'"
      >
        {{ invitation.titulo || 'Nome da celebração' }}
      </component>

      <p class="mt-3 text-base font-medium opacity-90 sm:text-lg">
        Com carinho,
        <strong class="invitation-host-name underline underline-offset-4">{{ invitation.anfitriao || 'Nome de quem convida' }}</strong>
      </p>

      <p v-if="invitation.mensagem" class="mx-auto mt-5 max-w-lg text-sm leading-relaxed opacity-85">
        “{{ invitation.mensagem }}”
      </p>

      <div class="invitation-event-details mt-7 grid gap-4 rounded-2xl p-4 text-left sm:grid-cols-2 sm:p-5">
        <div class="flex items-start gap-3">
          <span class="text-xl" aria-hidden="true">📅</span>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider opacity-70">Quando</p>
            <p class="mt-1 text-sm font-bold">{{ eventDate }}</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="text-xl" aria-hidden="true">📍</span>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider opacity-70">Onde</p>
            <p class="mt-1 break-words text-sm font-bold">{{ invitation.local_evento || 'Local do evento' }}</p>
          </div>
        </div>
      </div>

      <slot name="actions" />
    </div>
  </article>
</template>
