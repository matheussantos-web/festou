<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { cartCount } from '../lib/cart'
import { useSession } from '../lib/session'
import { clearNotificationCounts, refreshNotificationCounts, setNotificationUser, useNotifications } from '../lib/notifications'

const { user: currentUser } = useSession()
const route = useRoute()
const { pendingOrderCount, unreadMessageCount } = useNotifications()

const isSupplier = computed(() => currentUser.value?.tipo_perfil === 'fornecedor')
const orderNavigationLabel = computed(() => {
  const destination = isSupplier.value ? 'Painel de pedidos' : 'Meus Orçamentos'
  return `${destination}: ${pendingOrderCount.value} pendentes e ${unreadMessageCount.value} mensagens não lidas`
})

let refreshTimer

function refreshIfVisible() {
  if (currentUser.value && document.visibilityState === 'visible') refreshNotificationCounts()
}

watch(currentUser, (user) => {
  if (user?.id) {
    setNotificationUser(user.id)
    refreshNotificationCounts()
  }
  else clearNotificationCounts()
}, { immediate: true })

// Revalida ao entrar nas telas que contêm os pedidos e suas conversas.
watch(() => route.path, (path) => {
  if (currentUser.value?.id && ['/orcamentos', '/fornecedor/painel'].includes(path)) {
    refreshNotificationCounts()
  }
}, { immediate: true })

onMounted(() => {
  document.addEventListener('visibilitychange', refreshIfVisible)
  refreshTimer = window.setInterval(refreshIfVisible, 30_000)
})

onBeforeUnmount(() => {
  window.clearInterval(refreshTimer)
  document.removeEventListener('visibilitychange', refreshIfVisible)
})
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-festou-dark/95 pb-[env(safe-area-inset-bottom)] text-white backdrop-blur-xl md:hidden"
    aria-label="Atalhos do aplicativo"
  >
    <div class="mx-auto grid max-w-md px-2" :class="isSupplier ? 'grid-cols-4' : 'grid-cols-5'">
      <RouterLink
        to="/"
        class="flex min-h-[4.25rem] flex-col items-center justify-center gap-1 text-[11px] font-bold text-white/70 transition-colors duration-200"
        active-class="text-festou-pink"
        aria-label="Início"
      >
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="m3 10.5 9-7.5 9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
        </svg>
        Início
      </RouterLink>

      <RouterLink
        to="/vitrine"
        class="flex min-h-[4.25rem] flex-col items-center justify-center gap-1 text-[11px] font-bold text-white/70 transition-colors duration-200"
        active-class="text-festou-pink"
        aria-label="Vitrine"
      >
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 9V5h16v4M4 9v11h16V9M4 9h16M9 20v-6h6v6" />
        </svg>
        Vitrine
      </RouterLink>

      <RouterLink
        :to="isSupplier ? '/fornecedor/painel' : '/carrinho'"
        class="relative flex min-h-[4.25rem] flex-col items-center justify-center gap-1 text-[11px] font-bold text-white/70 transition-colors duration-200"
        active-class="text-festou-pink"
        :aria-label="isSupplier ? orderNavigationLabel : 'Carrinho'"
      >
        <span class="relative">
          <svg v-if="isSupplier" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h10" />
          </svg>
          <svg v-else class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6" />
            <circle cx="10" cy="20" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" />
          </svg>
          <span
            v-if="!isSupplier && cartCount > 0"
            class="absolute -right-2.5 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-festou-primary px-1 text-[10px] font-extrabold text-white"
          >
            {{ cartCount }}
          </span>
          <span
            v-if="isSupplier && pendingOrderCount > 0"
            class="absolute -right-3 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-festou-pink px-1 text-[10px] font-extrabold text-festou-dark ring-2 ring-festou-dark"
            aria-hidden="true"
          >
            {{ pendingOrderCount > 99 ? '99+' : pendingOrderCount }}
          </span>
          <span
            v-if="isSupplier && unreadMessageCount > 0"
            class="absolute -left-3 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-festou-cyan px-1 text-[10px] font-extrabold text-festou-dark ring-2 ring-festou-dark"
            aria-hidden="true"
          >
            {{ unreadMessageCount > 99 ? '99+' : unreadMessageCount }}
          </span>
        </span>
        {{ isSupplier ? 'Painel' : 'Carrinho' }}
      </RouterLink>

      <RouterLink
        :to="isSupplier ? '/fornecedor/produtos/novo' : '/convites'"
        class="flex min-h-[4.25rem] flex-col items-center justify-center gap-1 text-[11px] font-bold text-white/70 transition-colors duration-200"
        active-class="text-festou-pink"
        :aria-label="isSupplier ? 'Anunciar produto' : 'Meus convites'"
      >
        <svg v-if="isSupplier" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14" />
        </svg>
        <svg v-else class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="m3 7 9 6 9-6" />
        </svg>
        {{ isSupplier ? 'Anunciar' : 'Convites' }}
      </RouterLink>

      <RouterLink
        v-if="!isSupplier"
        to="/orcamentos"
        class="flex min-h-[4.25rem] flex-col items-center justify-center gap-1 text-[11px] font-bold text-white/70 transition-colors duration-200"
        active-class="text-festou-pink"
        :aria-label="orderNavigationLabel"
      >
        <span class="relative">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
          <span
            v-if="pendingOrderCount > 0"
            class="absolute -right-3 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-festou-pink px-1 text-[10px] font-extrabold text-festou-dark ring-2 ring-festou-dark"
            aria-hidden="true"
          >
            {{ pendingOrderCount > 99 ? '99+' : pendingOrderCount }}
          </span>
          <span
            v-if="unreadMessageCount > 0"
            class="absolute -left-3 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-festou-cyan px-1 text-[10px] font-extrabold text-festou-dark ring-2 ring-festou-dark"
            aria-hidden="true"
          >
            {{ unreadMessageCount > 99 ? '99+' : unreadMessageCount }}
          </span>
        </span>
        Orçamentos
      </RouterLink>
    </div>
  </nav>
</template>
