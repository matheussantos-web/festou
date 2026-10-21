<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')
const profileType = ref('cliente')
const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

async function signUp() {
  errorMessage.value = ''
  successMessage.value = ''
  isSubmitting.value = true

  try {
    await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nome: name.value,
        email: email.value,
        senha: password.value,
        tipo_perfil: profileType.value,
      }),
    })

    await router.push('/vitrine')
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível criar sua conta. Tente novamente.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-orange-50 px-6 py-10 text-slate-900">
    <section class="w-full max-w-md rounded-lg border border-orange-100 bg-white p-8 shadow-sm">
      <RouterLink to="/" class="text-sm font-semibold text-rose-700">Festou!</RouterLink>
      <h1 class="mt-6 text-3xl font-bold">Crie sua conta</h1>
      <p class="mt-2 text-slate-600">Escolha como quer participar da Festou!.</p>

      <form class="mt-8 space-y-5" @submit.prevent="signUp">
        <div>
          <label for="name" class="mb-1 block text-sm font-semibold">Nome completo</label>
          <input
            id="name"
            v-model="name"
            type="text"
            autocomplete="name"
            maxlength="100"
            required
            class="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
          />
        </div>
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
          <label for="profile-type" class="mb-1 block text-sm font-semibold">Quero participar como</label>
          <select
            id="profile-type"
            v-model="profileType"
            class="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
          >
            <option value="cliente">Cliente</option>
            <option value="fornecedor">Fornecedor</option>
          </select>
        </div>
        <div>
          <label for="password" class="mb-1 block text-sm font-semibold">Senha</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
            class="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
          />
          <p class="mt-1 text-xs text-slate-500">Use pelo menos 8 caracteres.</p>
        </div>
        <p v-if="errorMessage" role="alert" class="text-sm text-red-700">{{ errorMessage }}</p>
        <p v-if="successMessage" role="status" class="text-sm text-green-700">{{ successMessage }}</p>
        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full rounded-md bg-rose-700 px-4 py-3 font-semibold text-white hover:bg-rose-800 disabled:cursor-wait disabled:opacity-60"
        >
          {{ isSubmitting ? 'Criando conta...' : 'Criar conta' }}
        </button>
      </form>

      <p class="mt-6 text-sm text-slate-600">
        Já tem uma conta?
        <RouterLink to="/login" class="font-semibold text-rose-700 hover:underline">Entrar</RouterLink>
      </p>
    </section>
  </main>
</template>