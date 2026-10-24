<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
import { cartCount } from '../lib/cart'
import { useNotifications } from '../lib/notifications'
import { clearSession, useSession } from '../lib/session'

const router = useRouter()
const { user: currentUser } = useSession()
const { pendingOrderCount, unreadMessageCount } = useNotifications()
const isMobileMenuOpen = ref(false)
const isUserMenuOpen = ref(false)
const userMenuRef = ref(null)

const firstName = computed(() => String(currentUser.value?.nome ?? '').split(' ')[0])
const userInitial = computed(() => (
  String(currentUser.value?.nome ?? '?').trim().charAt(0).toUpperCase() || '?'
))

const menuButtonLabel = computed(() => (
  isMobileMenuOpen.value ? 'Fechar menu' : 'Abrir menu'
))
const orderNavigationLabel = computed(() => {
  const destination = currentUser.value?.tipo_perfil === 'fornecedor'
    ? 'Painel de pedidos'
    : 'Meus Orçamentos'
  return `${destination}: ${pendingOrderCount.value} pendentes e ${unreadMessageCount.value} mensagens não lidas`
})

function displayCount(count) {
  return count > 99 ? '99+' : count
}

async function handleLogout() {
  try {
    await api('/auth/logout', { method: 'POST' })
  } finally {
    clearSession()
    isMobileMenuOpen.value = false
    isUserMenuOpen.value = false
    await router.push('/')
  }
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
  isUserMenuOpen.value = false
}

function handleKeydown(event) {
  if (event.key === 'Escape') closeMobileMenu()
}

function handlePointerDown(event) {
  if (!isUserMenuOpen.value) return
  if (!userMenuRef.value?.contains(event.target)) isUserMenuOpen.value = false
}

watch(() => router.currentRoute.value.fullPath, closeMobileMenu)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('pointerdown', handlePointerDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('pointerdown', handlePointerDown)
})
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50 bg-festou-dark/95 text-white shadow-[0_18px_40px_-24px_rgba(15,10,44,0.9)] backdrop-blur-xl">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
      <!-- Marca -->
      <RouterLink
        to="/"
        class="shrink-0 transition-transform duration-300 hover:scale-105"
        aria-label="Festou! — página inicial"
      >
        <img
          src="/festou-logo-horizontal.png"
          alt=""
          aria-hidden="true"
          decoding="async"
          class="h-10 w-auto max-w-[8rem] bg-transparent object-contain sm:h-11 sm:max-w-[8.5rem]"
        />
      </RouterLink>

      <!-- Navegação desktop -->
      <nav class="hidden items-center gap-1 md:flex" aria-label="Navegação principal">
        <RouterLink to="/vitrine" class="nav-link" active-class="nav-link-active">
          Vitrine
        </RouterLink>

        <template v-if="!currentUser || currentUser.tipo_perfil === 'cliente'">
          <RouterLink to="/convites" class="nav-link" active-class="nav-link-active">
            Meus convites
          </RouterLink>
          <RouterLink
            v-if="currentUser"
            to="/orcamentos"
            class="nav-link relative pr-12"
            active-class="nav-link-active"
            :aria-label="orderNavigationLabel"
          >
            Meus Orçamentos
            <span class="pointer-events-none absolute right-1 top-0 z-10 inline-flex -translate-y-1/4 items-center gap-0.5" aria-hidden="true">
              <span
                v-if="pendingOrderCount > 0"
                class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-festou-pink px-1 text-[10px] font-extrabold leading-none text-festou-dark ring-2 ring-festou-dark"
              >{{ displayCount(pendingOrderCount) }}</span>
              <span
                v-if="unreadMessageCount > 0"
                class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-festou-cyan px-1 text-[10px] font-extrabold leading-none text-festou-dark ring-2 ring-festou-dark"
              >{{ displayCount(unreadMessageCount) }}</span>
            </span>
          </RouterLink>
          <RouterLink
            to="/carrinho"
            class="ml-1 inline-flex min-h-11 items-center gap-2 rounded-full bg-festou-pink px-4 text-sm font-extrabold text-festou-dark shadow-festive transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#FF5EAF]"
            active-class="ring-2 ring-white/70"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6" />
              <circle cx="10" cy="20" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" />
            </svg>
            <span>Carrinho</span>
            <span
              v-if="cartCount > 0"
              class="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-festou-primary px-1 text-[11px] font-extrabold text-white"
            >
              {{ cartCount }}
            </span>
          </RouterLink>
        </template>

        <template v-if="currentUser && currentUser.tipo_perfil === 'fornecedor'">
          <RouterLink
            to="/fornecedor/painel"
            class="nav-link relative pr-12"
            active-class="nav-link-active"
            :aria-label="orderNavigationLabel"
          >
            Painel de pedidos
            <span class="pointer-events-none absolute right-1 top-0 z-10 inline-flex -translate-y-1/4 items-center gap-0.5" aria-hidden="true">
              <span
                v-if="pendingOrderCount > 0"
                class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-festou-pink px-1 text-[10px] font-extrabold leading-none text-festou-dark ring-2 ring-festou-dark"
              >{{ displayCount(pendingOrderCount) }}</span>
              <span
                v-if="unreadMessageCount > 0"
                class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-festou-cyan px-1 text-[10px] font-extrabold leading-none text-festou-dark ring-2 ring-festou-dark"
              >{{ displayCount(unreadMessageCount) }}</span>
            </span>
          </RouterLink>
          <RouterLink
            to="/fornecedor/produtos/novo"
            class="nav-link"
            active-class="nav-link-active"
          >
            Anunciar produto
          </RouterLink>
        </template>
      </nav>

      <!-- Sessão desktop -->
      <div class="hidden items-center gap-2 border-l border-white/15 pl-3 md:flex">
        <div v-if="currentUser" ref="userMenuRef" class="relative">
          <button
            type="button"
            class="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 py-1 pl-1 pr-3 text-sm font-semibold text-white/90 transition-colors duration-200 hover:border-white/40 hover:bg-white/10"
            :aria-expanded="isUserMenuOpen"
            aria-haspopup="menu"
            @click="isUserMenuOpen = !isUserMenuOpen"
          >
            <img v-if="currentUser.avatar_url" :src="currentUser.avatar_url" alt="" class="h-9 w-9 rounded-full object-cover" />
            <span v-else class="grid h-9 w-9 place-items-center rounded-full bg-festou-yellow font-heading text-base font-extrabold text-festou-dark">
              {{ userInitial }}
            </span>
            <span class="max-w-[7rem] truncate">{{ firstName }}</span>
            <svg
              class="h-4 w-4 transition-transform duration-200"
              :class="isUserMenuOpen ? 'rotate-180' : ''"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <div
            v-if="isUserMenuOpen"
            role="menu"
            class="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-2xl"
          >
            <p class="px-3 py-2 text-xs leading-relaxed text-slate-500">
              Conectado como<br />
              <strong class="text-sm text-slate-900">{{ currentUser.nome }}</strong>
            </p>
            <div class="my-1 h-px bg-slate-100"></div>
            <RouterLink
              to="/perfil"
              class="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold transition-colors hover:bg-festou-soft hover:text-festou-primary"
              role="menuitem"
            >
              Meu perfil
            </RouterLink>
            <RouterLink
              v-if="currentUser.tipo_perfil === 'cliente'"
              to="/convites"
              class="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold transition-colors hover:bg-festou-soft hover:text-festou-primary"
              role="menuitem"
            >
              Meus convites
            </RouterLink>
            <RouterLink
              v-if="currentUser.tipo_perfil === 'cliente'"
              to="/orcamentos"
              class="flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 text-sm font-semibold transition-colors hover:bg-festou-soft hover:text-festou-primary"
              role="menuitem"
              :aria-label="orderNavigationLabel"
            >
              <span>Meus Orçamentos</span>
              <span class="inline-flex items-center gap-1.5" aria-hidden="true">
                <span v-if="pendingOrderCount > 0" class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-festou-pink px-1 text-[10px] font-extrabold text-festou-dark">{{ displayCount(pendingOrderCount) }}</span>
                <span v-if="unreadMessageCount > 0" class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-festou-cyan px-1 text-[10px] font-extrabold text-festou-dark">{{ displayCount(unreadMessageCount) }}</span>
              </span>
            </RouterLink>
            <RouterLink
              v-if="currentUser.tipo_perfil === 'cliente'"
              to="/carrinho"
              class="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold transition-colors hover:bg-festou-soft hover:text-festou-primary"
              role="menuitem"
            >
              Meu carrinho
            </RouterLink>
            <RouterLink
              v-if="currentUser.tipo_perfil === 'fornecedor'"
              to="/fornecedor/painel"
              class="flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 text-sm font-semibold transition-colors hover:bg-festou-soft hover:text-festou-primary"
              role="menuitem"
              :aria-label="orderNavigationLabel"
            >
              <span>Painel de pedidos</span>
              <span class="inline-flex items-center gap-1.5" aria-hidden="true">
                <span v-if="pendingOrderCount > 0" class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-festou-pink px-1 text-[10px] font-extrabold text-festou-dark">{{ displayCount(pendingOrderCount) }}</span>
                <span v-if="unreadMessageCount > 0" class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-festou-cyan px-1 text-[10px] font-extrabold text-festou-dark">{{ displayCount(unreadMessageCount) }}</span>
              </span>
            </RouterLink>
            <button
              type="button"
              class="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-bold text-festou-primary transition-colors hover:bg-[#FFF0F7]"
              role="menuitem"
              @click="handleLogout"
            >
              Sair da conta
            </button>
          </div>
        </div>

        <template v-else>
          <RouterLink to="/login" class="nav-link">Entrar</RouterLink>
          <RouterLink to="/cadastro" class="btn btn-primary btn-sm shadow-festive">
            Criar conta
          </RouterLink>
        </template>
      </div>

      <!-- Menu mobile -->
      <button
        type="button"
        class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-white/90 transition-colors duration-200 hover:bg-white/10 md:hidden"
        :aria-label="menuButtonLabel"
        :aria-expanded="isMobileMenuOpen"
        aria-controls="menu-mobile"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
      >
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path v-if="!isMobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div
      v-if="isMobileMenuOpen"
      id="menu-mobile"
      class="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-white/10 bg-festou-dark px-5 pb-6 pt-3 md:hidden"
    >
      <nav class="flex flex-col gap-1 text-sm font-semibold" aria-label="Navegação mobile">
        <RouterLink to="/vitrine" class="nav-link w-full" active-class="nav-link-active" @click="closeMobileMenu">
          Vitrine
        </RouterLink>
        <template v-if="!currentUser || currentUser.tipo_perfil === 'cliente'">
          <RouterLink to="/convites" class="nav-link w-full" active-class="nav-link-active" @click="closeMobileMenu">
            Meus convites
          </RouterLink>
          <RouterLink v-if="currentUser" to="/orcamentos" class="nav-link w-full justify-between" active-class="nav-link-active" @click="closeMobileMenu" :aria-label="orderNavigationLabel">
            Meus Orçamentos
            <span class="inline-flex items-center gap-1.5" aria-hidden="true">
              <span v-if="pendingOrderCount > 0" class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-festou-pink px-1 text-[10px] font-extrabold text-festou-dark">{{ displayCount(pendingOrderCount) }}</span>
              <span v-if="unreadMessageCount > 0" class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-festou-cyan px-1 text-[10px] font-extrabold text-festou-dark">{{ displayCount(unreadMessageCount) }}</span>
            </span>
          </RouterLink>
          <RouterLink to="/carrinho" class="nav-link w-full" active-class="nav-link-active" @click="closeMobileMenu">
            Carrinho ({{ cartCount }})
          </RouterLink>
        </template>
        <template v-if="currentUser && currentUser.tipo_perfil === 'fornecedor'">
          <RouterLink to="/fornecedor/painel" class="nav-link w-full justify-between" active-class="nav-link-active" @click="closeMobileMenu" :aria-label="orderNavigationLabel">
            Painel de pedidos
            <span class="inline-flex items-center gap-1.5" aria-hidden="true">
              <span v-if="pendingOrderCount > 0" class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-festou-pink px-1 text-[10px] font-extrabold text-festou-dark">{{ displayCount(pendingOrderCount) }}</span>
              <span v-if="unreadMessageCount > 0" class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-festou-cyan px-1 text-[10px] font-extrabold text-festou-dark">{{ displayCount(unreadMessageCount) }}</span>
            </span>
          </RouterLink>
          <RouterLink to="/fornecedor/produtos/novo" class="nav-link w-full" active-class="nav-link-active" @click="closeMobileMenu">
            Anunciar produto
          </RouterLink>
        </template>
      </nav>

      <div class="mt-4 border-t border-white/10 pt-4">
        <template v-if="currentUser">
          <p class="mb-3 flex items-center gap-2 text-xs text-white/70">
            <img v-if="currentUser.avatar_url" :src="currentUser.avatar_url" alt="" class="h-8 w-8 rounded-full object-cover" />
            <span v-else class="grid h-8 w-8 place-items-center rounded-full bg-festou-yellow font-heading text-sm font-extrabold text-festou-dark">
              {{ userInitial }}
            </span>
            {{ currentUser.nome }}
          </p>
          <RouterLink to="/perfil" class="mb-3 inline-flex min-h-10 items-center rounded-full border border-white/25 px-4 text-sm font-bold text-white transition-colors hover:bg-white/10" @click="closeMobileMenu">
            Meu perfil
          </RouterLink>
          <button
            type="button"
            class="inline-flex min-h-11 items-center rounded-full border border-white/25 px-4 text-sm font-bold text-white transition-colors hover:bg-white/10"
            @click="handleLogout"
          >
            Sair da conta
          </button>
        </template>
        <div v-else class="flex flex-col gap-2">
          <RouterLink to="/login" class="btn btn-outline" @click="closeMobileMenu">
            Entrar
          </RouterLink>
          <RouterLink to="/cadastro" class="btn btn-primary" @click="closeMobileMenu">
            Criar conta
          </RouterLink>
        </div>
      </div>
    </div>

    <div class="h-[3px] w-full bg-festou-ring" aria-hidden="true"></div>
  </header>
</template>
