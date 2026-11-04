<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../lib/api'

const route = useRoute()
const state = ref('loading')
const message = ref('Confirmando seu e-mail...')

onMounted(async () => {
  const token = typeof route.query.token === 'string' ? route.query.token : ''
  if (!token) {
    state.value = 'error'
    message.value = 'O link está incompleto. Solicite um novo e-mail de confirmação.'
    return
  }

  window.history.replaceState(window.history.state, '', route.path)

  try {
    const result = await api('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
    state.value = 'success'
    message.value = result.message
  } catch (error) {
    state.value = 'error'
    message.value = error.message || 'Não foi possível confirmar este e-mail.'
  }
})
</script>

<template>
  <main class="relative flex min-h-screen items-center justify-center bg-festou-dark px-5 py-12 text-slate-900">
    <section class="glass-light w-full max-w-md p-8 text-center sm:p-10">
      <RouterLink to="/" class="festou-wordmark inline-flex items-center gap-0.5 text-3xl">
        <span>Festou<span>!</span></span>
      </RouterLink>
      <div class="mt-6 text-4xl" aria-hidden="true">
        {{ state === 'success' ? '🎉' : state === 'error' ? '✉️' : '⏳' }}
      </div>
      <h1 class="mt-4 font-heading text-2xl font-bold text-festou-dark">
        {{ state === 'success' ? 'E-mail confirmado!' : state === 'error' ? 'Não foi possível confirmar' : 'Só um instante...' }}
      </h1>
      <p :role="state === 'error' ? 'alert' : 'status'" class="mt-3 text-sm text-slate-600">{{ message }}</p>
      <RouterLink v-if="state !== 'loading'" to="/login" class="btn btn-primary mt-6 w-full text-sm font-bold">
        Ir para o login
      </RouterLink>
    </section>
  </main>
</template>
