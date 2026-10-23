<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError, api } from '../lib/api'
import { setSession } from '../lib/session'
import { consumeGoogleRedirect, readIdTokenFromUrl } from '../lib/googleAuth'

const router = useRouter()
const errorMessage = ref('')

onMounted(async () => {
  const { idToken, error } = readIdTokenFromUrl()

  if (error) {
    errorMessage.value = error
    return
  }

  try {
    const { user } = await api('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken }),
    })
    setSession(user)
    await router.replace(consumeGoogleRedirect())
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      sessionStorage.setItem('google_id_token', idToken)
      await router.replace('/cadastro?google=1')
      return
    }
    errorMessage.value = err.message || 'Não foi possível entrar com o Google.'
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-festou-night px-5">
    <section class="glass-light w-full max-w-md p-8 text-center">
      <RouterLink to="/" class="festou-wordmark inline-flex items-center gap-0.5 text-3xl">
        <span>Festou<span>!</span></span>
      </RouterLink>

      <template v-if="errorMessage">
        <h1 class="mt-4 font-heading text-xl font-bold text-festou-midnight">
          Não foi possível continuar
        </h1>
        <p class="mt-2 text-sm text-slate-600">{{ errorMessage }}</p>
        <RouterLink to="/login" class="btn btn-primary mt-6 inline-flex text-sm font-bold">
          Voltar para o login
        </RouterLink>
      </template>

      <template v-else>
        <h1 class="mt-4 font-heading text-xl font-bold text-festou-midnight">
          Entrando com o Google...
        </h1>
        <p class="mt-2 text-sm text-slate-600">Só um instante enquanto confirmamos seus dados.</p>
        <div class="mx-auto mt-6 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-festou-primary"></div>
      </template>
    </section>
  </div>
</template>
