<script setup>
import { ref } from 'vue'
import { uploadImage } from '../lib/uploads'
import { useSession, setSession } from '../lib/session'

const { user } = useSession()
const inputRef = ref(null)
const isUploading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function handleFileChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  errorMessage.value = ''
  successMessage.value = ''
  isUploading.value = true
  try {
    const result = await uploadImage(file, 'profile')
    setSession(result.user)
    successMessage.value = 'Foto de perfil atualizada.'
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel atualizar sua foto.'
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <main id="conteudo-principal" class="min-h-screen bg-festou-soft px-5 py-10 text-slate-900 sm:px-8">
    <div class="mx-auto max-w-2xl">
      <RouterLink to="/" class="text-sm font-bold text-festou-primary hover:underline">← Voltar ao Festou</RouterLink>
      <section class="card-gradient mt-6 p-6 sm:p-10">
        <span class="badge bg-festou-secondary/12 text-festou-secondary">Minha conta</span>
        <h1 class="mt-3 font-heading text-3xl font-extrabold text-festou-midnight">Foto de perfil</h1>
        <p class="mt-2 text-sm text-slate-600">Adicione uma foto para personalizar sua conta no Festou.</p>

        <div class="mt-8 flex flex-col items-center gap-5 sm:flex-row">
          <img
            v-if="user?.avatar_url"
            :src="user.avatar_url"
            alt="Foto de perfil"
            class="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg"
          />
          <div v-else class="grid h-28 w-28 place-items-center rounded-full bg-festou-yellow font-heading text-4xl font-extrabold text-festou-midnight shadow-lg">
            {{ String(user?.nome || '?').trim().charAt(0).toUpperCase() }}
          </div>
          <div class="w-full flex-1">
            <p class="font-bold text-slate-900">{{ user?.nome }}</p>
            <p class="mt-1 text-sm text-slate-500">{{ user?.email }}</p>
            <button
              type="button"
              :disabled="isUploading"
              class="btn btn-primary mt-4"
              @click="inputRef?.click()"
            >
              {{ isUploading ? 'Enviando foto...' : user?.avatar_url ? 'Trocar foto' : 'Escolher foto' }}
            </button>
            <input
              ref="inputRef"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="sr-only"
              @change="handleFileChange"
            />
            <p class="mt-2 text-xs text-slate-500">JPG, PNG ou WebP · até 5 MB.</p>
          </div>
        </div>

        <p v-if="errorMessage" role="alert" class="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{{ errorMessage }}</p>
        <p v-if="successMessage" role="status" class="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-900">{{ successMessage }}</p>
      </section>
    </div>
  </main>
</template>
