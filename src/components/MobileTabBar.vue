<script setup>
import { computed } from 'vue'
import { cartCount } from '../lib/cart'
import { useSession } from '../lib/session'
import { useNotifications } from '../lib/notifications'

const { user: currentUser } = useSession()
const { pendingOrderCount, unreadMessageCount } = useNotifications()

const isSupplier = computed(() => currentUser.value?.tipo_perfil === 'fornecedor')
const isCustomer = computed(() => currentUser.value?.tipo_perfil === 'cliente')

const orderNavigationLabel = computed(() => {
  const destination = isSupplier.value ? 'Painel de pedidos' : 'Meus Orçamentos'
  return `${destination}: ${pendingOrderCount.value} pendentes e ${unreadMessageCount.value} mensagens não lidas`
})

</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-festou-dark/90 pb-[env(safe-area-inset-bottom)] text-white shadow-[0_-12px_35px_rgba(10,7,35,.28)] backdrop-blur-2xl md:hidden" aria-label="Atalhos do aplicativo">
    <div class="mx-auto grid max-w-md grid-cols-5 px-1">
      <RouterLink to="/" class="flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-white/70 active:text-festou-pink" active-class="text-festou-pink">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m3 10.5 9-7.5 9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
        <span>Início</span>
      </RouterLink>
      <RouterLink to="/vitrine" class="flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-white/70" active-class="text-festou-pink">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 9V5h16v4M4 9v11h16V9M4 9h16M9 20v-6h6v6" /></svg>
        <span>Explorar</span>
      </RouterLink>
      <RouterLink to="/carrinho" class="relative flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-white/70" active-class="text-festou-pink">
        <span class="relative"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6" /><circle cx="10" cy="20" r="1.4" fill="currentColor" stroke="none" /><circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" /></svg><span v-if="cartCount > 0" class="absolute -right-3 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-festou-primary px-1 text-[9px] text-white">{{ cartCount }}</span></span>
        <span>Carrinho</span>
      </RouterLink>
      <RouterLink to="/chat" class="flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-white/70" active-class="text-festou-pink">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /><path stroke-linecap="round" d="M8 10h8M8 14h5" /></svg>
        <span>Chat</span>
      </RouterLink>
      <RouterLink :to="currentUser ? '/perfil' : '/login'" class="flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-white/70" active-class="text-festou-pink">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" /></svg>
        <span>{{ currentUser ? 'Perfil' : 'Conectar' }}</span>
      </RouterLink>
    </div>
  </nav>
</template>
