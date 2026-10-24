<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../lib/api'
import { clearSession } from '../lib/session'

const route = useRoute()
const router = useRouter()

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token.trim() : ''))
const password = ref('')
const confirmation = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

async function resetPassword() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!token.value) {
    errorMessage.value = 'O link de redefinição está incompleto. Solicite um novo e-mail.'
    return
  }

  if (password.value !== confirmation.value) {
    errorMessage.value = 'As duas senhas precisam ser iguais.'
    return
  }

  isSubmitting.value = true

  try {
    const { message } = await api('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: token.value, senha: password.value }),
    })
    clearSession()
    successMessage.value = message || 'Senha redefinida com sucesso.'
    password.value = ''
    confirmation.value = ''
    setTimeout(() => router.push('/login'), 2500)
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível redefinir a senha. Solicite um novo link.'
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
          Criar nova senha
        </h1>
        <p class="mt-1 text-sm text-slate-600">
          Escolha uma senha nova para entrar no Festou! novamente.
        </p>
      </div>

      <div v-if="errorMessage" role="alert" class="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" role="status" class="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
        {{ successMessage }} Você será levado ao login.
      </div>

      <form class="mt-6 space-y-4" @submit.prevent="resetPassword">
        <div>
          <label for="password" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
            Nova senha
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
            placeholder="Pelo menos 8 caracteres"
            class="w-full px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label for="confirmation" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
            Confirme a nova senha
          </label>
          <input
            id="confirmation"
            v-model="confirmation"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
            placeholder="Repita a nova senha"
            class="w-full px-4 py-3 text-sm"
          />
        </div>

        <button
          type="submit"
          :disabled="isSubmitting || Boolean(successMessage)"
          class="btn btn-primary mt-2 w-full text-sm font-bold"
        >
          {{ isSubmitting ? 'Salvando...' : 'Salvar nova senha' }}
        </button>
      </form>

      <div class="mt-8 border-t border-slate-200/80 pt-6 text-center text-xs text-slate-500">
        <RouterLink to="/recuperar-senha" class="font-bold text-festou-primary hover:underline">
          Pedir um novo link
        </RouterLink>
        <span class="mx-2 text-slate-300">·</span>
        <RouterLink to="/login" class="font-bold text-festou-primary hover:underline">
          Ir para o login
        </RouterLink>
      </div>
    </section>
  </div>
</template>
