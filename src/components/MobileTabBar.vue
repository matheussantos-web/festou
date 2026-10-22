<script setup>
import { computed } from 'vue'
import { cartCount } from '../lib/cart'
import { useSession } from '../lib/session'

const { user: currentUser } = useSession()

const isSupplier = computed(() => currentUser.value?.tipo_perfil === 'fornecedor')
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    aria-label="Atalhos do aplicativo"
  >
    <div class="mx-auto grid max-w-md grid-cols-4 px-2">
      <RouterLink
        to="/"
        class="flex min-h-[4.25rem] flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-500 transition-colors duration-200"
        active-class="text-festou-primary"
        aria-label="Início"
      >
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="m3 10.5 9-7.5 9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
        </svg>
        Início
      </RouterLink>

      <RouterLink
        to="/vitrine"
        class="flex min-h-[4.25rem] flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-500 transition-colors duration-200"
        active-class="text-festou-primary"
        aria-label="Vitrine"
      >
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 9V5h16v4M4 9v11h16V9M4 9h16M9 20v-6h6v6" />
        </svg>
        Vitrine
      </RouterLink>

      <RouterLink
        :to="isSupplier ? '/fornecedor/painel' : '/carrinho'"
        class="relative flex min-h-[4.25rem] flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-500 transition-colors duration-200"
        active-class="text-festou-primary"
        :aria-label="isSupplier ? 'Painel de pedidos' : 'Carrinho'"
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
        </span>
        {{ isSupplier ? 'Painel' : 'Carrinho' }}
      </RouterLink>

      <RouterLink
        :to="isSupplier ? '/fornecedor/produtos/novo' : '/convites'"
        class="flex min-h-[4.25rem] flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-500 transition-colors duration-200"
        active-class="text-festou-primary"
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
    </div>
  </nav>
</template>
