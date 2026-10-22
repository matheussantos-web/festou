<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../lib/api'
import { setSession } from '../lib/session'

const router = useRouter()
const route = useRoute()
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';function getRedirect(){const r=route.query.redirect;return (typeof r==='string'&&r.startsWith('/')&&!r.startsWith('//'))?r:'/vitrine';}function handleGoogleLogin(){if(!googleClientId){errorMessage.value='Login com Google nao configurado.';return;}const o=window.location.origin;const n=Math.random().toString(36).slice(2);sessionStorage.setItem('google_nonce',n);sessionStorage.setItem('auth_redirect',getRedirect());const ru=o+'/auth/google/callback';const pms=new URLSearchParams({client_id:googleClientId,redirect_uri:ru,response_type:'id_token',scope:'openid email profile',nonce:n,prompt:'select_account'});window.location.href='https://accounts.google.com/o/oauth2/v2/auth?'+pms.toString();}
const isSubmitting = ref(false)

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
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-festou-night px-5 py-12 text-slate-900">
    <!-- Noite festiva com confetes -->
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-festou-midnight/70 via-festou-midnight/25 to-festou-midnight/35"></div>
    <div class="festou-confetti-field pointer-events-none absolute inset-0 opacity-20"></div>
    <div class="pointer-events-none absolute -left-20 top-10 h-72 w-72 animate-festou-float rounded-full bg-festou-magenta/30 blur-3xl"></div>
    <div class="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 animate-festou-float rounded-full bg-festou-cyan/25 blur-3xl [animation-delay:1.5s]"></div>

    <section class="glass-light relative w-full max-w-md p-8 sm:p-10">
      <div class="text-center">
        <RouterLink to="/" class="festou-wordmark inline-flex items-center gap-0.5 text-3xl">
          <span>Festou<span>!</span></span>
        </RouterLink>
        <h1 class="mt-4 font-heading text-2xl font-bold text-festou-midnight">
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

      <form class="mt-6 space-y-4" @submit.prevent="signIn">
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
