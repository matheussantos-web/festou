<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
import { cartCount } from '../lib/cart'
import { clearSession, loadSession, useSession } from '../lib/session'

const router = useRouter()
const { user: currentUser } = useSession()
const isMobileMenuOpen = ref(false)

const firstName = computed(() => String(currentUser.value?.nome ?? '').split(' ')[0])

const menuButtonLabel = computed(() => (
  isMobileMenuOpen.value ? 'Fechar menu' : 'Abrir menu'
))

async function handleLogout() {
  try {
    await api('/auth/logout', { method: 'POST' })
  } finally {
    clearSession()
    isMobileMenuOpen.value = false
    await router.push('/')
  }
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

function handleKeydown(event) {
  if (event.key === 'Escape') closeMobileMenu()
}

watch(() => router.currentRoute.value.fullPath, closeMobileMenu)

onMounted(() => {
  loadSession()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-40 border-b border-white/60 bg-white/80 shadow-[0_10px_30px_-18px_rgba(26,19,77,0.45)] backdrop-blur-xl">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
      <!-- Logo -->
      <RouterLink to="/" class="festou-wordmark group flex items-center gap-0.5 transition-transform duration-300 hover:scale-105">
        <span>Festou<span>!</span></span>
      </RouterLink>

      <!-- Desktop Nav -->
      <nav class="hidden items-center gap-6 text-sm font-semibold md:flex">
        <RouterLink
          to="/vitrine"
          class="text-slate-600 transition-all duration-300 hover:text-festou-primary"
          active-class="text-festou-primary font-bold"
        >
          Vitrine
        </RouterLink>

        <!-- Links para Cliente ou Visitante -->
        <template v-if="!currentUser || currentUser.tipo_perfil === 'cliente'">
          <RouterLink
            to="/convites"
            class="text-slate-600 transition-all duration-300 hover:text-festou-primary"
            active-class="text-festou-primary font-bold"
          >
            Meus convites
          </RouterLink>
          <RouterLink
            to="/carrinho"
            class="inline-flex items-center gap-1.5 text-slate-600 transition-all duration-300 hover:text-festou-primary"
            active-class="text-festou-primary font-bold"
          >
            <span>Carrinho</span>
            <span
              v-if="cartCount > 0"
              class="rounded-full bg-festou-primary px-2 py-0.5 text-xs font-bold text-white shadow-festive"
            >
              {{ cartCount }}
            </span>
          </RouterLink>
        </template>

        <!-- Links para Fornecedor -->
        <template v-if="currentUser && currentUser.tipo_perfil === 'fornecedor'">
          <RouterLink
            to="/fornecedor/painel"
            class="text-slate-600 transition-all duration-300 hover:text-festou-primary"
            active-class="text-festou-primary font-bold"
          >
            Painel de pedidos
          </RouterLink>
          <RouterLink
            to="/fornecedor/produtos/novo"
            class="text-slate-600 transition-all duration-300 hover:text-festou-primary"
            active-class="text-festou-primary font-bold"
          >
            + Anunciar produto
          </RouterLink>
        </template>

        <!-- Ações de Sessão -->
        <div class="flex items-center gap-3 border-l border-slate-200/70 pl-4">
          <template v-if="currentUser">
            <span class="text-xs text-slate-500">
              Olá, <strong class="text-slate-800">{{ firstName }}</strong>
            </span>
            <button
              type="button"
              class="rounded-full px-3 py-1.5 text-xs font-bold text-slate-500 transition-all duration-300 hover:bg-rose-50 hover:text-rose-600"
              @click="handleLogout"
            >
              Sair
            </button>
          </template>
          <template v-else>
            <RouterLink
              to="/login"
              class="rounded-full px-3 py-1.5 text-slate-700 transition-all duration-300 hover:bg-festou-soft hover:text-festou-primary"
            >
              Entrar
            </RouterLink>
            <RouterLink
              to="/cadastro"
              class="rounded-full bg-festou-primary px-5 py-2.5 text-sm font-bold text-white shadow-festive transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-festive-strong"
            >
              Criar conta
            </RouterLink>
          </template>
        </div>
      </nav>

      <!-- Botão Hambúrguer Mobile -->
      <button
        type="button"
        class="rounded-full p-2 text-slate-600 transition-all duration-300 hover:bg-festou-soft hover:text-festou-primary md:hidden"
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

    <!-- Menu Dropdown Mobile -->
    <div v-if="isMobileMenuOpen" id="menu-mobile" class="border-t border-white/60 bg-white/95 px-5 py-4 backdrop-blur-xl md:hidden">
      <div class="flex flex-col gap-3 font-semibold text-slate-700">
        <RouterLink to="/vitrine" class="rounded-lg py-1 transition hover:bg-festou-soft hover:text-festou-primary" @click="closeMobileMenu">
          Vitrine
        </RouterLink>
        <template v-if="!currentUser || currentUser.tipo_perfil === 'cliente'">
          <RouterLink to="/convites" class="rounded-lg py-1 transition hover:bg-festou-soft hover:text-festou-primary" @click="closeMobileMenu">
            Meus convites
          </RouterLink>
          <RouterLink to="/carrinho" class="rounded-lg py-1 transition hover:bg-festou-soft hover:text-festou-primary" @click="closeMobileMenu">
            Carrinho ({{ cartCount }})
          </RouterLink>
        </template>
        <template v-if="currentUser && currentUser.tipo_perfil === 'fornecedor'">
          <RouterLink to="/fornecedor/painel" class="rounded-lg py-1 transition hover:bg-festou-soft hover:text-festou-primary" @click="closeMobileMenu">
            Painel de pedidos
          </RouterLink>
          <RouterLink to="/fornecedor/produtos/novo" class="rounded-lg py-1 transition hover:bg-festou-soft hover:text-festou-primary" @click="closeMobileMenu">
            + Anunciar produto
          </RouterLink>
        </template>

        <div class="mt-2 border-t border-slate-100 pt-3">
          <template v-if="currentUser">
            <p class="text-xs text-slate-500 mb-2">Conectado como {{ currentUser.nome }}</p>
            <button type="button" class="rounded-lg px-1 text-sm font-bold text-rose-600" @click="handleLogout">
              Sair da conta
            </button>
          </template>
          <template v-else>
            <div class="flex flex-col gap-2">
              <RouterLink to="/login" class="rounded-full text-center font-bold text-slate-700 py-2 transition hover:bg-festou-soft" @click="closeMobileMenu">
                Entrar
              </RouterLink>
              <RouterLink to="/cadastro" class="rounded-full bg-festou-primary py-2.5 text-center font-bold text-white shadow-festive transition hover:bg-rose-700" @click="closeMobileMenu">
                Criar conta
              </RouterLink>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Fio de gradiente com as cores oficiais da marca -->
    <div class="h-[3px] w-full bg-festou-ring" aria-hidden="true"></div>
  </header>
</template>
