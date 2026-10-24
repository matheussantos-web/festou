<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { api } from '../lib/api'
import { setSession, useSession } from '../lib/session'
import { uploadImage } from '../lib/uploads'

const { user } = useSession()
const profile = reactive({
  nome: '',
  email: '',
  tipo_perfil: 'cliente',
  whatsapp: '',
  biografia: '',
  avatar_url: '',
  cover_url: '',
  instagram_url: '',
  facebook_url: '',
  site_url: '',
})
const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const avatarInput = ref(null)
const coverInput = ref(null)
const avatarFile = ref(null)
const coverFile = ref(null)
const avatarPreview = ref('')
const coverPreview = ref('')
const profileInitial = computed(() => String(profile.nome || user.value?.nome || '?').trim().charAt(0).toUpperCase())
const isSupplier = computed(() => profile.tipo_perfil === 'fornecedor')

function applyProfile(source) {
  Object.assign(profile, {
    nome: source.nome ?? '',
    email: source.email ?? '',
    tipo_perfil: source.tipo_perfil ?? 'cliente',
    whatsapp: source.whatsapp ?? '',
    biografia: source.biografia ?? '',
    avatar_url: source.avatar_url ?? '',
    cover_url: source.cover_url ?? '',
    instagram_url: source.instagram_url ?? '',
    facebook_url: source.facebook_url ?? '',
    site_url: source.site_url ?? '',
  })
}

async function loadProfile() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const result = await api('/profile')
    applyProfile(result.user)
    setSession(result.user)
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel carregar seu perfil.'
  } finally {
    isLoading.value = false
  }
}

function replacePreview(previewRef, fileRef, file) {
  if (previewRef.value) URL.revokeObjectURL(previewRef.value)
  fileRef.value = file || null
  previewRef.value = file ? URL.createObjectURL(file) : ''
}

function selectImage(event, kind) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  errorMessage.value = ''
  successMessage.value = ''
  replacePreview(kind === 'avatar' ? avatarPreview : coverPreview, kind === 'avatar' ? avatarFile : coverFile, file)
}

function validateProfile() {
  if (profile.nome.trim().length < 3) return 'Informe um nome com pelo menos 3 caracteres.'
  if (profile.whatsapp && !/^[+\d()\s.-]{8,30}$/.test(profile.whatsapp.trim())) return 'Confira o número de WhatsApp.'
  for (const [label, value] of [['Instagram', profile.instagram_url], ['Facebook', profile.facebook_url], ['Site', profile.site_url]]) {
    if (value && !/^https?:\/\//i.test(value.trim())) return `O link do ${label} deve começar com https://.`
  }
  return ''
}

async function saveProfile() {
  errorMessage.value = validateProfile()
  successMessage.value = ''
  if (errorMessage.value) return

  isSaving.value = true
  try {
    if (avatarFile.value) {
      const result = await uploadImage(avatarFile.value, 'profile')
      profile.avatar_url = result.image_url
      setSession(result.user)
      replacePreview(avatarPreview, avatarFile, null)
    }
    if (coverFile.value) {
      const result = await uploadImage(coverFile.value, 'profile-cover')
      profile.cover_url = result.image_url
      setSession(result.user)
      replacePreview(coverPreview, coverFile, null)
    }

    const result = await api('/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        nome: profile.nome.trim(),
        whatsapp: profile.whatsapp.trim(),
        biografia: profile.biografia.trim(),
        instagram_url: profile.instagram_url.trim(),
        facebook_url: profile.facebook_url.trim(),
        site_url: profile.site_url.trim(),
      }),
    })
    applyProfile(result.user)
    setSession(result.user)
    successMessage.value = 'Perfil atualizado com sucesso.'
  } catch (error) {
    errorMessage.value = error.message || 'Nao foi possivel salvar as alteracoes.'
  } finally {
    isSaving.value = false
  }
}

onMounted(loadProfile)
onBeforeUnmount(() => {
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
  if (coverPreview.value) URL.revokeObjectURL(coverPreview.value)
})
</script>

<template>
  <main id="conteudo-principal" class="min-h-screen bg-festou-dark px-4 py-8 text-slate-900 sm:px-8 sm:py-12">
    <div class="mx-auto max-w-5xl">
      <RouterLink to="/" class="inline-flex min-h-11 items-center font-bold text-white/80 transition hover:text-festou-cyan">← Voltar ao Festou</RouterLink>

      <header class="mb-7 mt-5 text-white">
        <span class="inline-flex rounded-full bg-festou-cyan/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-festou-cyan">Minha conta</span>
        <h1 class="mt-3 font-heading text-3xl font-extrabold sm:text-4xl">Perfil e ajustes</h1>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-white/70">Mantenha seus dados e formas de contato atualizados para facilitar suas conexoes no Festou.</p>
      </header>

      <div v-if="isLoading" class="rounded-3xl border border-white/10 bg-white p-8 text-center shadow-xl" role="status">
        <span class="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-festou-pink/25 border-t-festou-pink"></span>
        <p class="mt-3 font-semibold text-slate-600">Carregando seu perfil...</p>
      </div>

      <div v-else class="space-y-5">
        <p v-if="errorMessage" role="alert" class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{{ errorMessage }}</p>
        <p v-if="successMessage" role="status" class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">{{ successMessage }}</p>

        <form class="space-y-5" @submit.prevent="saveProfile">
          <section class="overflow-hidden rounded-3xl bg-white shadow-xl shadow-black/10">
            <div class="border-b border-slate-100 px-5 py-5 sm:px-8">
              <h2 class="font-heading text-xl font-extrabold text-festou-dark">{{ isSupplier ? 'Nome do negócio e apresentação' : 'Dados pessoais' }}</h2>
              <p class="mt-1 text-sm text-slate-500">Essas informações aparecem no seu perfil.</p>
            </div>
            <div class="grid gap-5 p-5 sm:grid-cols-2 sm:p-8">
              <label class="form-label sm:col-span-1">
                {{ isSupplier ? 'Nome do negócio ou responsável' : 'Seu nome' }} <span class="text-festou-pink">*</span>
                <input v-model="profile.nome" required minlength="3" maxlength="100" autocomplete="name" class="mt-2 min-h-12 w-full px-4" placeholder="Como as pessoas devem chamar você?" />
              </label>
              <label class="form-label sm:col-span-1">
                E-mail
                <input :value="profile.email" type="email" disabled class="mt-2 min-h-12 w-full cursor-not-allowed bg-slate-100 px-4 text-slate-500" />
                <span class="mt-1 block text-xs font-normal text-slate-500">O e-mail de acesso não pode ser alterado aqui.</span>
              </label>
              <label class="form-label sm:col-span-2">
                {{ isSupplier ? 'Sobre o negócio' : 'Sobre você (opcional)' }}
                <textarea v-model="profile.biografia" rows="4" maxlength="500" class="mt-2 w-full px-4 py-3" placeholder="Conte um pouco sobre você ou seus serviços..." />
                <span class="mt-1 block text-right text-xs font-normal text-slate-500">{{ profile.biografia.length }}/500</span>
              </label>
            </div>
          </section>

          <section class="overflow-hidden rounded-3xl bg-white shadow-xl shadow-black/10">
            <div class="border-b border-slate-100 px-5 py-5 sm:px-8">
              <h2 class="font-heading text-xl font-extrabold text-festou-dark">Fotos do perfil</h2>
              <p class="mt-1 text-sm text-slate-500">Escolha as imagens e confira o preview antes de salvar.</p>
            </div>
            <div class="space-y-6 p-5 sm:p-8">
              <div>
                <p class="mb-2 text-sm font-bold text-slate-700">Foto de capa</p>
                <div class="relative flex min-h-40 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-festou-dark to-festou-purple sm:min-h-52">
                  <img v-if="coverPreview || profile.cover_url" :src="coverPreview || profile.cover_url" alt="Pré-visualização da capa" class="absolute inset-0 h-full w-full object-cover" />
                  <span v-else class="relative px-5 text-center text-sm font-semibold text-white/80">Adicione uma imagem para personalizar a capa do seu perfil</span>
                  <span class="pointer-events-none absolute inset-0 bg-gradient-to-t from-festou-dark/50 to-transparent"></span>
                  <button type="button" class="relative z-10 mt-auto mb-3 inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-extrabold text-festou-dark shadow-lg transition hover:bg-festou-cyan" @click="coverInput?.click()">{{ coverPreview || profile.cover_url ? 'Trocar capa' : 'Escolher capa' }}</button>
                </div>
                <input ref="coverInput" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" @change="selectImage($event, 'cover')" />
                <p class="mt-2 text-xs text-slate-500">JPG, PNG ou WebP, até 5 MB.</p>
              </div>

              <div class="flex flex-col gap-5 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:p-5">
                <div class="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-festou-pink/20 bg-festou-yellow font-heading text-3xl font-extrabold text-festou-dark">
                  <img v-if="avatarPreview || profile.avatar_url" :src="avatarPreview || profile.avatar_url" alt="Pré-visualização da foto de perfil" class="h-full w-full object-cover" />
                  <span v-else>{{ profileInitial }}</span>
                </div>
                <div class="flex-1">
                  <p class="font-bold text-slate-800">Foto de perfil</p>
                  <p class="mt-1 text-sm text-slate-500">Uma foto nítida ajuda as pessoas a reconhecerem sua conta.</p>
                  <button type="button" class="mt-3 inline-flex min-h-11 items-center rounded-full border-2 border-festou-pink px-5 text-sm font-extrabold text-festou-dark transition hover:bg-festou-pink" @click="avatarInput?.click()">{{ avatarPreview || profile.avatar_url ? 'Trocar foto' : 'Escolher foto' }}</button>
                  <input ref="avatarInput" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" @change="selectImage($event, 'avatar')" />
                  <p class="mt-2 text-xs text-slate-500">JPG, PNG ou WebP, até 5 MB.</p>
                </div>
              </div>
            </div>
          </section>

          <section class="overflow-hidden rounded-3xl bg-white shadow-xl shadow-black/10">
            <div class="border-b border-slate-100 px-5 py-5 sm:px-8">
              <h2 class="font-heading text-xl font-extrabold text-festou-dark">Contatos e redes sociais</h2>
              <p class="mt-1 text-sm text-slate-500">Adicione canais para clientes e parceiros falarem com você.</p>
            </div>
            <div class="grid gap-5 p-5 sm:grid-cols-2 sm:p-8">
              <label class="form-label">
                WhatsApp
                <input v-model="profile.whatsapp" type="tel" autocomplete="tel" maxlength="30" class="mt-2 min-h-12 w-full px-4" placeholder="(11) 99999-9999" />
              </label>
              <label class="form-label">
                Instagram
                <input v-model="profile.instagram_url" type="url" maxlength="300" class="mt-2 min-h-12 w-full px-4" placeholder="https://instagram.com/seuperfil" />
              </label>
              <label class="form-label">
                Facebook
                <input v-model="profile.facebook_url" type="url" maxlength="300" class="mt-2 min-h-12 w-full px-4" placeholder="https://facebook.com/suapagina" />
              </label>
              <label class="form-label">
                Site
                <input v-model="profile.site_url" type="url" maxlength="300" class="mt-2 min-h-12 w-full px-4" placeholder="https://seusite.com.br" />
              </label>
            </div>
          </section>

          <div class="sticky bottom-20 z-10 flex justify-end rounded-2xl border border-white/10 bg-festou-dark/90 p-3 backdrop-blur md:bottom-4">
            <button type="submit" :disabled="isSaving" class="inline-flex min-h-12 min-w-44 items-center justify-center rounded-full bg-festou-pink px-7 font-extrabold text-festou-dark shadow-lg transition hover:-translate-y-0.5 hover:bg-[#ff5eaf] disabled:cursor-wait disabled:opacity-60">
              {{ isSaving ? 'Salvando...' : 'Salvar alterações' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>
