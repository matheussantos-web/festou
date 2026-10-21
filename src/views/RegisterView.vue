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
const isSubmitting = ref(false)

async function signUp() {
  errorMessage.value = ''
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

    if (profileType.value === 'fornecedor') {
      await router.push('/fornecedor/painel')
    } else {
      await router.push('/vitrine')
    }
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível criar sua conta. Tente novamente.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-50/70 via-white to-slate-100 px-5 py-12 text-slate-900">
    <div class="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-festou-primary/10 blur-3xl"></div>
    <div class="pointer-events-none absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-festou-turquoise/15 blur-3xl"></div>

    <section class="festou-surface relative w-full max-w-lg p-8 sm:p-10">
      <div class="text-center">
        <RouterLink to="/" class="inline-flex items-center gap-1 font-heading text-3xl font-extrabold tracking-tight text-festou-midnight">
          <span class="text-festou-primary">Festou</span><span class="text-festou-yellow">!</span>
        </RouterLink>
        <h1 class="mt-4 font-heading text-2xl font-bold text-festou-midnight">
          Crie sua conta no Festou!
        </h1>
        <p class="mt-1 text-sm text-slate-600">
          Junte-se à maior comunidade de celebrações e eventos.
        </p>
      </div>

      <div v-if="errorMessage" role="alert" class="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
        {{ errorMessage }}
      </div>

      <form class="mt-6 space-y-4" @submit.prevent="signUp">
        <!-- Seletor de Perfil Elegante em Cards -->
        <fieldset>
          <legend class="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
            Qual é o seu objetivo?
          </legend>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              :aria-pressed="profileType === 'cliente'"
              class="flex flex-col items-center justify-center rounded-xl border p-4 text-center transition"
              :class="profileType === 'cliente' ? 'border-festou-primary bg-pink-50/60 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'"
              @click="profileType = 'cliente'"
            >
              <span class="text-2xl" aria-hidden="true">🎉</span>
              <span class="mt-2 text-sm font-bold" :class="profileType === 'cliente' ? 'text-festou-primary' : 'text-slate-800'">
                Sou Cliente
              </span>
              <span class="mt-0.5 text-[11px] text-slate-500">Quero organizar festas</span>
            </button>

            <button
              type="button"
              :aria-pressed="profileType === 'fornecedor'"
              class="flex flex-col items-center justify-center rounded-xl border p-4 text-center transition"
              :class="profileType === 'fornecedor' ? 'border-festou-purple bg-purple-50/60 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'"
              @click="profileType = 'fornecedor'"
            >
              <span class="text-2xl" aria-hidden="true">🎂</span>
              <span class="mt-2 text-sm font-bold" :class="profileType === 'fornecedor' ? 'text-festou-purple' : 'text-slate-800'">
                Sou Fornecedor
              </span>
              <span class="mt-0.5 text-[11px] text-slate-500">Quero vender produtos</span>
            </button>
          </div>
        </fieldset>

        <div>
          <label for="name" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
            Nome completo ou da empresa
          </label>
          <input
            id="name"
            v-model.trim="name"
            type="text"
            autocomplete="name"
            minlength="3"
            maxlength="100"
            required
            placeholder="Ex: Beatriz Lima ou Doçuras da Bia"
            class="w-full text-sm"
          />
        </div>

        <div>
          <label for="email" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
            E-mail
          </label>
          <input
            id="email"
            v-model.trim="email"
            type="email"
            autocomplete="email"
            pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
            title="Use um e-mail válido, como nome@dominio.com."
            required
            placeholder="seuemail@exemplo.com"
            class="w-full text-sm"
          />
        </div>

        <div>
          <label for="password" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
            Senha de acesso
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
            placeholder="No mínimo 8 caracteres"
            class="w-full text-sm"
          />
          <p class="mt-1 text-[11px] text-slate-400">Pelo menos 8 caracteres para sua segurança.</p>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="btn-festou-primary mt-2 w-full text-sm font-bold shadow-festive"
        >
          {{ isSubmitting ? 'Criando sua conta...' : 'Cadastrar no Festou!' }}
        </button>
      </form>

      <div class="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-500">
        Já possui uma conta?
        <RouterLink to="/login" class="ml-1 font-bold text-festou-primary hover:underline">
          Fazer login
        </RouterLink>
      </div>
    </section>
  </div>
</template>
