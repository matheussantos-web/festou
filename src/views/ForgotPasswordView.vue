<script setup>
import { ref } from 'vue'
import { api } from '../lib/api'

const email = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

async function requestReset() {
  errorMessage.value = ''
  successMessage.value = ''
  isSubmitting.value = true

  try {
    const { message } = await api('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.value }),
    })
    successMessage.value = message || 'Se este e-mail estiver cadastrado, enviaremos as instruções.'
    email.value = ''
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível enviar o pedido agora. Tente novamente.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-festou-dark px-5 py-12 text-slate-900">
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
          Recuperar senha
        </h1>
        <p class="mt-1 text-sm text-slate-600">
          Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.
        </p>
      </div>

      <div v-if="errorMessage" role="alert" class="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" role="status" class="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
        {{ successMessage }}
      </div>

      <form class="mt-6 space-y-4" @submit.prevent="requestReset">
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

        <button
          type="submit"
          :disabled="isSubmitting"
          class="btn btn-primary mt-2 w-full text-sm font-bold"
        >
          {{ isSubmitting ? 'Enviando...' : 'Enviar link de recuperação' }}
        </button>
      </form>

      <div class="mt-8 border-t border-slate-200/80 pt-6 text-center text-xs text-slate-500">
        Lembrou a senha?
        <RouterLink to="/login" class="ml-1 font-bold text-festou-primary hover:underline">
          Voltar para o login
        </RouterLink>
      </div>
    </section>
  </div>
</template>
