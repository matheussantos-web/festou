<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
import MobileTabBar from './components/MobileTabBar.vue'
import { useSession } from './lib/session'
import { clearNotificationCounts, refreshNotificationCounts, setNotificationUser } from './lib/notifications'

const route = useRoute()
const { user: currentUser, loadSession } = useSession()

const showChrome = computed(() => route.meta?.chrome !== false)
let notificationRefreshTimer

watch(currentUser, (user) => {
  if (user?.id) {
    setNotificationUser(user.id)
    refreshNotificationCounts()
  } else {
    clearNotificationCounts()
  }
}, { immediate: true })

watch(() => route.path, (path) => {
  if (currentUser.value?.id && ['/orcamentos', '/fornecedor/painel'].includes(path)) {
    refreshNotificationCounts()
  }
}, { immediate: true })

function refreshNotificationsWhenVisible() {
  if (currentUser.value?.id && document.visibilityState === 'visible') refreshNotificationCounts()
}

onMounted(() => {
  // A sessão e as contagens são iniciadas no layout raiz, não dependem da rota.
  loadSession()
  document.addEventListener('visibilitychange', refreshNotificationsWhenVisible)
  notificationRefreshTimer = window.setInterval(refreshNotificationsWhenVisible, 30_000)
})

onBeforeUnmount(() => {
  window.clearInterval(notificationRefreshTimer)
  document.removeEventListener('visibilitychange', refreshNotificationsWhenVisible)
})
</script>

<template>
  <a
    v-if="showChrome"
    href="#conteudo-principal"
    class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-festou-dark focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
  >
    Pular para o conteúdo principal
  </a>

  <AppHeader v-if="showChrome" />

  <!-- Espaçador do header fixo (64px + 3px do fio de gradiente) -->
  <div v-if="showChrome" class="h-[67px]" aria-hidden="true"></div>

  <div :class="showChrome ? 'pb-[4.75rem] md:pb-0' : ''">
    <RouterView />
  </div>

  <AppFooter v-if="showChrome" />
  <MobileTabBar v-if="showChrome" />
</template>
