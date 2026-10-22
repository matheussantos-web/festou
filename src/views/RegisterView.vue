<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
import { setSession } from '../lib/session'

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
    const { user } = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nome: name.value,
        email: email.value,
        senha: password.value,
        tipo_perfil: profileType.value,
      }),
    })
    setSession(user)

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
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-festou-night px-5 py-12 text-slate-900">
    <!-- Noite festiva com confetes -->
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-festou-midnight/70 via-festou-midnight/25 to-festou-midnight/35"></div>
    <div class="festou-confetti-field pointer-events-none absolute inset-0 opacity-20"></div>
    <div class="pointer-events-none absolute -left-20 top-10 h-72 w-72 animate-festou-float rounded-full bg-festou-magenta/30 blur-3xl"></div>
    <div class="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 animate-festou-float rounded-full bg-festou-cyan/25 blur-3xl [animation-delay:1.5s]"></div>

    <section class="glass-light relative w-full max-w-lg p-8 sm:p-10">
      <div class="text-center">
        <RouterLink to="/" class="festou-wordmark inline-flex items-center gap-0.5 text-3xl">
          <span>Festou<span>!</span></span>
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
              class="flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all duration-300"
              :class="profileType === 'cliente' ? 'border-festou-magenta bg-festou-magenta/10 shadow-festive-soft' : 'border-slate-200 bg-white hover:border-festou-magenta/40 hover:bg-festou-soft'"
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
              class="flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all duration-300"
              :class="profileType === 'fornecedor' ? 'border-festou-secondary bg-festou-secondary/10 shadow-festive-soft' : 'border-slate-200 bg-white hover:border-festou-secondary/40 hover:bg-festou-soft'"
              @click="profileType = 'fornecedor'"
            >
              <span class="text-2xl" aria-hidden="true">🎂</span>
              <span class="mt-2 text-sm font-bold" :class="profileType === 'fornecedor' ? 'text-festou-secondary' : 'text-slate-800'">
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
            class="w-full px-4 py-3 text-sm"
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
            class="w-full px-4 py-3 text-sm"
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
            class="w-full px-4 py-3 text-sm"
          />
          <p class="mt-1 text-[11px] text-slate-400">Pelo menos 8 caracteres para sua segurança.</p>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="btn btn-primary mt-2 w-full text-sm font-bold"
        >
          {{ isSubmitting ? 'Criando sua conta...' : 'Cadastrar no Festou!' }}
        </button>
      </form>

      <div class="mt-8 border-t border-slate-200/80 pt-6 text-center text-xs text-slate-500">
        Já possui uma conta?
        <RouterLink to="/login" class="ml-1 font-bold text-festou-primary hover:underline">
          Fazer login
        </RouterLink>
      </div>
    </section>
  </div>
</template>
