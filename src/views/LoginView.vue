<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../lib/api'
import { setSession } from '../lib/session'
import { googleLoginUrl, isGoogleConfigured } from '../lib/googleAuth'
import GoogleAuthButton from '../components/GoogleAuthButton.vue'

const router = useRouter()
const route = useRoute()
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

function handleGoogleLogin() {
  if (!isGoogleConfigured()) {
    errorMessage.value = 'Login com Google ainda não configurado. Defina VITE_GOOGLE_CLIENT_ID no .env.'
    return
  }
  window.location.href = googleLoginUrl(route.query.redirect)
}

async function signIn() {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const { user } = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.value, senha: password.value }),
    })
    setSession(user)

    const redirect = route.query.redirect
    const destination = typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
      ? redirect
      : '/vitrine'
    await router.push(destination)
  } catch (error) {
    errorMessage.value = error.message || 'E-mail ou senha inválidos. Tente novamente.'
  } finally {
    isSubmitting.value = false
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
          Que bom ter você de volta!
        </h1>
        <p class="mt-1 text-sm text-slate-600">
          Entre para continuar organizando ou atendendo festas.
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
            placeholder="seuemail@exemplo.com"
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
            placeholder="Sua senha secreta"
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
        <RouterLink to="/cadastro" class="ml-1 font-bold text-festou-primary hover:underline">
          Cadastre-se gratuitamente
        </RouterLink>
      </div>
    </section>
  </div>
</template>
