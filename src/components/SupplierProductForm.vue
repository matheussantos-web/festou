<script setup>
import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import { uploadImage } from '../lib/uploads'
import { PRODUCT_CATEGORIES } from '../../shared/productCategories.js'

const props = defineProps({
  product: {
    type: Object,
    default: null,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  submitLabel: {
    type: String,
    default: 'Salvar alterações',
  },
})

const emit = defineEmits(['submit', 'cancel'])

const emptyForm = () => ({
  nome: '',
  categoria: '',
  descricao: '',
  preco: null,
  cidade: '',
  imagem_url: '',
  imagens_url: [],
})

const form = reactive(emptyForm())
const imageGallery = ref([])
const imageError = ref('')
const isUploadingImage = ref(false)
const photoInput = ref(null)
const temporaryPreviewUrls = new Set()

function clearTemporaryPreview() {
  temporaryPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
  temporaryPreviewUrls.clear()
}

function fill(product) {
  clearTemporaryPreview()
  Object.assign(form, {
    nome: product?.nome ?? '',
    categoria: product?.categoria ?? '',
    descricao: product?.descricao ?? '',
    preco: product?.preco ?? null,
    cidade: product?.cidade ?? '',
    imagem_url: product?.imagem_url ?? '',
    imagens_url: product?.imagens_url?.length ? [...product.imagens_url] : (product?.imagem_url ? [product.imagem_url] : []),
  })
  imageGallery.value = form.imagens_url.map((src) => ({ src, pending: false }))
  imageError.value = ''
}

watch(() => props.product, fill, { immediate: true })

function reset() {
  clearTemporaryPreview()
  Object.assign(form, emptyForm())
  imageGallery.value = []
  imageError.value = ''
}

async function handleImageChange(event) {
  const files = Array.from(event.target.files ?? [])
  event.target.value = ''
  if (!files.length) return

  imageError.value = ''
  const availableSlots = Math.max(0, 5 - imageGallery.value.length)
  if (!availableSlots) {
    imageError.value = 'O anuncio pode ter no maximo 5 fotos.'
    return
  }
  const filesToUpload = files.slice(0, availableSlots)
  if (filesToUpload.length < files.length) imageError.value = 'Foram selecionadas apenas as fotos que cabem no limite de 5.'
  isUploadingImage.value = true

  try {
    for (const file of filesToUpload) {
      const previewUrl = URL.createObjectURL(file)
      temporaryPreviewUrls.add(previewUrl)
      const preview = { src: previewUrl, pending: true }
      imageGallery.value.push(preview)
      try {
        const result = await uploadImage(file, 'product')
        const index = imageGallery.value.indexOf(preview)
        if (index >= 0) imageGallery.value[index] = { src: result.image_url, pending: false }
        form.imagens_url.push(result.image_url)
        if (!form.imagem_url) form.imagem_url = result.image_url
      } catch (error) {
        imageGallery.value = imageGallery.value.filter((image) => image !== preview)
        imageError.value = error.message || 'Nao foi possivel enviar uma das fotos.'
      } finally {
        URL.revokeObjectURL(previewUrl)
        temporaryPreviewUrls.delete(previewUrl)
      }
    }
  } finally {
    isUploadingImage.value = false
  }
}

function removeImage(image) {
  imageGallery.value = imageGallery.value.filter((entry) => entry !== image)
  form.imagens_url = form.imagens_url.filter((url) => url !== image.src)
  if (form.imagem_url === image.src) form.imagem_url = form.imagens_url[0] || ''
  imageError.value = ''
}

function openPhotoPicker() {
  photoInput.value?.click()
}

function submit() {
  emit('submit', {
    nome: form.nome,
    categoria: form.categoria,
    descricao: form.descricao,
    preco: form.preco,
    cidade: form.cidade,
    imagem_url: form.imagem_url,
    imagens_url: form.imagens_url,
  })
}

defineExpose({ reset })
onBeforeUnmount(clearTemporaryPreview)
</script>

<template>
  <form class="space-y-6" @submit.prevent="submit">
    <div>
      <label for="product-name" class="form-label">
        Nome do produto ou serviço
      </label>
      <input
        id="product-name"
        v-model="form.nome"
        type="text"
        minlength="3"
        maxlength="120"
        required
        placeholder="Ex: Bolo de Chocolate Belga com Morangos"
        class="form-control"
      />
    </div>

    <div class="grid gap-6 sm:grid-cols-2">
      <div>
        <label for="category" class="form-label">
          Categoria
        </label>
        <select
          id="category"
          v-model="form.categoria"
          required
          class="form-control"
        >
          <option value="" disabled>Selecione uma categoria</option>
          <option v-for="category in PRODUCT_CATEGORIES" :key="category.value" :value="category.value">
            {{ category.icon }} {{ category.label }}
          </option>
        </select>
      </div>

      <div>
        <label for="price" class="form-label">
          Preço sugerido (R$)
        </label>
        <input
          id="price"
          v-model.number="form.preco"
          type="number"
          min="0.01"
          max="99999999"
          step="0.01"
          required
          placeholder="150.00"
          class="form-control"
        />
      </div>
    </div>

    <div>
      <label for="description" class="form-label">
        Descrição detalhada
      </label>
      <textarea
        id="description"
        v-model="form.descricao"
        rows="4"
        minlength="10"
        maxlength="1000"
        required
        placeholder="Descreva os ingredientes, dimensões, quantidade de fatias ou detalhes do serviço..."
        class="form-control form-control--textarea"
      ></textarea>
    </div>

    <div class="grid gap-6 sm:grid-cols-2">
      <div>
        <label for="city" class="form-label">
          Cidade de atendimento (opcional)
        </label>
        <input
          id="city"
          v-model="form.cidade"
          type="text"
          maxlength="100"
          placeholder="Ex: São Paulo - SP"
          class="form-control"
        />
      </div>

      <div>
        <label for="product-photo" class="form-label">Foto do produto (opcional)</label>
        <div class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <div v-if="imageGallery.length" class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div v-for="(image, index) in imageGallery" :key="image.src" class="relative aspect-square overflow-hidden rounded-xl bg-white">
              <img :src="image.src" :alt="`Foto ${index + 1} do produto`" class="h-full w-full object-cover" />
              <span v-if="image.pending" class="absolute inset-x-0 bottom-0 bg-festou-dark/75 px-2 py-1 text-center text-xs font-bold text-white">Enviando...</span>
              <button type="button" :disabled="image.pending || submitting" class="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-lg font-bold text-rose-700 shadow disabled:opacity-50" :aria-label="`Remover foto ${index + 1}`" @click="removeImage(image)">×</button>
            </div>
          </div>
          <div v-else class="mb-4 grid h-36 place-items-center rounded-xl bg-white text-sm font-semibold text-slate-400">
            A foto escolhida aparecera aqui
          </div>
          <input
            id="product-photo"
            ref="photoInput"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            :disabled="isUploadingImage || submitting"
            class="sr-only"
            @change="handleImageChange"
          />
          <button
            type="button"
            :disabled="isUploadingImage || submitting"
            class="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-festou-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-festou-primary disabled:cursor-not-allowed disabled:opacity-60"
            @click="openPhotoPicker"
          >
            <span aria-hidden="true">📷</span>
            {{ imageGallery.length ? 'Adicionar fotos' : 'Escolher fotos' }}
          </button>
          <p class="mt-2 text-xs text-slate-500">Adicione até 5 fotos JPG, PNG ou WebP (5 MB por imagem). Os arquivos são enviados ao selecionar.</p>
          <p v-if="isUploadingImage" role="status" class="mt-2 text-sm font-semibold text-festou-primary">Enviando fotos...</p>
          <p v-if="imageError" role="alert" class="mt-2 text-sm font-semibold text-rose-700">{{ imageError }}</p>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        :disabled="submitting || isUploadingImage"
        class="btn btn-primary flex-1 text-sm font-bold"
      >
        {{ isUploadingImage ? 'Enviando foto...' : submitting ? 'Salvando...' : submitLabel }}
      </button>
      <button
        type="button"
        class="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-festou-magenta/50 hover:text-festou-primary"
        @click="emit('cancel')"
      >
        Cancelar
      </button>
    </div>
  </form>
</template>
