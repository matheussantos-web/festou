<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../lib/api'
import { setSession } from '../lib/session'
import { googleLoginUrl, isGoogleConfigured } from '../lib/googleAuth'
import GoogleAuthButton from '../components/GoogleAuthButton.vue'

const router = useRouter()
const route = useRoute()
const profileType = computed(() => route.params.tipo_perfil === 'fornecedor' || route.query.tipo === 'fornecedor' ? 'fornecedor' : 'cliente')
const isSupplier = computed(() => profileType.value === 'fornecedor')
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)
const resendMessage = ref('')

function handleGoogleLogin() {
  if (!isGoogleConfigured()) {
    errorMessage.value = 'Login com Google ainda não configurado. Defina VITE_GOOGLE_CLIENT_ID no .env.'
    return
  }
  try {
    sessionStorage.setItem('google_profile_type', profileType.value)
    window.location.href = googleLoginUrl(isSupplier.value ? '/fornecedor/painel' : '/vitrine')
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível iniciar o login seguro com Google.'
  }
}

async function signIn() {
  errorMessage.value = ''
  resendMessage.value = ''
  isSubmitting.value = true

  try {
    const { user } = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.value, senha: password.value, tipo_perfil: profileType.value }),
    })
    setSession(user)

    const redirect = route.query.redirect
    const fallback = isSupplier.value ? '/fornecedor/painel' : '/vitrine'
    const destination = typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
      ? redirect
      : fallback
    await router.push(destination)
  } catch (error) {
    errorMessage.value = error.message || 'E-mail ou senha inválidos. Tente novamente.'
    if (error.code === 'EMAIL_NOT_VERIFIED') resendMessage.value = 'Confirme seu e-mail para ativar a conta.'
  } finally {
    isSubmitting.value = false
  }
}

async function resendVerification() {
  try {
    const result = await api('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: email.value }),
    })
    resendMessage.value = result.message
  } catch (error) {
    resendMessage.value = error.message || 'Não foi possível reenviar agora.'
  }
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-festou-dark px-5 py-12 text-slate-900">
    <!-- Noite festiva com confetes -->
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-festou-dark/70 via-festou-dark/25 to-festou-dark/35"></div>
    <div class="festou-confetti-field pointer-events-none absolute inset-0 opacity-20"></div>
    <div class="pointer-events-none absolute -left-20 top-10 h-72 w-72 animate-festou-float rounded-full bg-festou-magenta/30 blur-3xl"></div>
    <div class="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 animate-festou-float rounded-full bg-festou-cyan/25 blur-3xl [animation-delay:1.5s]"></div>

    <section class="glass-light relative w-full max-w-md p-8 sm:p-10">
      <div class="text-center">
        <RouterLink to="/" class="festou-wordmark inline-flex items-center gap-0.5 text-3xl">
          <span>Festou<span>!</span></span>
        </RouterLink>
        <h1 class="mt-4 font-heading text-2xl font-bold text-festou-dark">
          {{ isSupplier ? 'Área do fornecedor' : 'Área do cliente' }}
        </h1>
        <p class="mt-1 text-sm text-slate-600">
          {{ isSupplier ? 'Acesse pedidos, produtos e conversas com seus clientes.' : 'Acesse convites, orçamentos, pedidos e sua agenda de festas.' }}
        </p>
      </div>

      <div v-if="route.query.configurarNeon" role="alert" class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900">
        Configure a variável DATABASE_URL no arquivo .env antes de entrar.
      </div>

      <div v-if="route.query.erroConexao" role="alert" class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900">
        Não foi possível falar com o servidor agora. Verifique se a API está rodando e tente novamente.
      </div>

      <div v-if="errorMessage" role="alert" class="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
        {{ errorMessage }}
      </div>
      <div v-if="resendMessage" class="mt-3 text-sm text-slate-600">
        <button type="button" class="font-semibold text-festou-primary hover:underline" @click="resendVerification">
          Reenviar confirmação de e-mail
        </button>
        <p role="status" class="mt-2">{{ resendMessage }}</p>
      </div>

      <div class="mt-6">
        <GoogleAuthButton @click="handleGoogleLogin" />

        <div class="my-5 flex items-center gap-3" aria-hidden="true">
          <span class="h-px flex-1 bg-slate-200"></span>
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">ou</span>
          <span class="h-px flex-1 bg-slate-200"></span>
        </div>
      </div>

      <form class="space-y-4" @submit.prevent="signIn">
        <div>
          <label for="email" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
            E-mail
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            placeholder="voce@exemplo.com.br"
            class="w-full px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label for="password" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
            Senha
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            placeholder="Digite sua senha"
            class="w-full px-4 py-3 text-sm"
          />
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="btn btn-primary mt-2 w-full text-sm font-bold"
        >
          {{ isSubmitting ? 'Entrando na conta...' : 'Entrar' }}
        </button>
      </form>

      <p class="mt-4 text-right text-xs">
        <RouterLink to="/recuperar-senha" class="font-semibold text-slate-600 hover:text-festou-primary hover:underline">
          Esqueci minha senha
        </RouterLink>
      </p>

      <div class="mt-8 border-t border-slate-200/80 pt-6 text-center text-xs text-slate-500">
        Ainda não tem uma conta no Festou!?
        <RouterLink :to="isSupplier ? '/cadastro/fornecedor' : '/cadastro/cliente'" class="ml-1 font-bold text-festou-primary hover:underline">
          Cadastre-se gratuitamente
        </RouterLink>
      </div>

      <div class="mt-5 grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1">
        <RouterLink
          :to="{ path: '/login/cliente', query: route.query.redirect ? { redirect: route.query.redirect } : {} }"
          class="rounded-xl px-3 py-2 text-center text-xs font-bold transition"
          :class="!isSupplier ? 'bg-festou-pink text-festou-dark shadow-sm' : 'text-slate-500 hover:text-festou-dark'"
        >
          Sou cliente
        </RouterLink>
        <RouterLink
          :to="{ path: '/login/fornecedor', query: route.query.redirect ? { redirect: route.query.redirect } : {} }"
          class="rounded-xl px-3 py-2 text-center text-xs font-bold transition"
          :class="isSupplier ? 'bg-festou-secondary/15 text-festou-secondary' : 'text-slate-500 hover:text-festou-dark'"
        >
          Sou fornecedor
        </RouterLink>
      </div>

      <div v-if="route.query.configurarNeon" role="alert" class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900">
        Configure a variável DATABASE_URL no arquivo .env antes de entrar.
      </div>

      <div v-if="route.query.erroConexao" role="alert" class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900">
        Não foi possível falar com o servidor agora. Verifique se a API está rodando e tente novamente.
      </div>
    </section>
  </div>
</template>
