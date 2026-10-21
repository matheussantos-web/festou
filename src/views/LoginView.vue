<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../lib/api'

const router = useRouter()
const route = useRoute()
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function signIn() {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.value, senha: password.value }),
    })

    const redirect = route.query.redirect
    const destination = typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
      ? redirect
      : '/vitrine'
    await router.push(destination)
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível entrar. Tente novamente.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-orange-50 px-6 py-10 text-slate-900">
    <section class="festou-surface w-full max-w-md p-8">
      <RouterLink to="/" class="festou-wordmark">Festou!</RouterLink>
      <h1 class="mt-6 text-3xl font-bold">Que bom ter você de volta</h1>
      <p class="mt-2 text-slate-600">Entre para continuar organizando sua festa.</p>
      <p v-if="route.query.configurarNeon" role="alert" class="mt-4 text-sm text-amber-800">
        Configure o Neon em DATABASE_URL e aplique o schema antes de entrar.
      </p>

      <form class="mt-8 space-y-5" @submit.prevent="signIn">
        <div>
          <label for="email" class="mb-1 block text-sm font-semibold">E-mail</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            class="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
          />
        </div>
        <div>
          <label for="password" class="mb-1 block text-sm font-semibold">Senha</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
          />
        </div>
        <p v-if="errorMessage" role="alert" class="text-sm text-red-700">{{ errorMessage }}</p>
        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full rounded-md bg-rose-700 px-4 py-3 font-semibold text-white hover:bg-rose-800 disabled:cursor-wait disabled:opacity-60"
        >
          {{ isSubmitting ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <p class="mt-6 text-sm text-slate-600">
        Ainda não tem conta?
        <RouterLink to="/cadastro" class="font-semibold text-rose-700 hover:underline">Cadastre-se</RouterLink>
      </p>
    </section>
  </main>
</template>