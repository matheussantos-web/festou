<script setup>
import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import { uploadImage } from '../lib/uploads'

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
  categoria: 'bolos',
  descricao: '',
  preco: null,
  cidade: '',
  imagem_url: '',
})

const form = reactive(emptyForm())
const imagePreview = ref('')
const imageError = ref('')
const isUploadingImage = ref(false)
const photoInput = ref(null)
let temporaryPreviewUrl = ''

function clearTemporaryPreview() {
  if (temporaryPreviewUrl) URL.revokeObjectURL(temporaryPreviewUrl)
  temporaryPreviewUrl = ''
}

function fill(product) {
  clearTemporaryPreview()
  Object.assign(form, {
    nome: product?.nome ?? '',
    categoria: product?.categoria ?? 'bolos',
    descricao: product?.descricao ?? '',
    preco: product?.preco ?? null,
    cidade: product?.cidade ?? '',
    imagem_url: product?.imagem_url ?? '',
  })
  imagePreview.value = form.imagem_url
  imageError.value = ''
}

watch(() => props.product, fill, { immediate: true })

function reset() {
  clearTemporaryPreview()
  Object.assign(form, emptyForm())
  imagePreview.value = ''
  imageError.value = ''
}

async function handleImageChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  imageError.value = ''
  clearTemporaryPreview()
  temporaryPreviewUrl = URL.createObjectURL(file)
  imagePreview.value = temporaryPreviewUrl
  isUploadingImage.value = true

  try {
    const result = await uploadImage(file, 'product')
    form.imagem_url = result.image_url
    clearTemporaryPreview()
    imagePreview.value = result.image_url
  } catch (error) {
    imagePreview.value = form.imagem_url
    imageError.value = error.message || 'Nao foi possivel enviar a foto.'
    clearTemporaryPreview()
  } finally {
    isUploadingImage.value = false
  }
}

function removeImage() {
  form.imagem_url = ''
  imagePreview.value = ''
  imageError.value = ''
  clearTemporaryPreview()
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
          <option value="bolos">🎂 Bolos</option>
          <option value="doces">🍬 Doces</option>
          <option value="brinquedos">🎈 Brinquedos</option>
          <option value="convites">💌 Convites digitais</option>
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
          <img
            v-if="imagePreview"
            :src="imagePreview"
            alt="Pre-visualizacao da foto do produto"
            class="mb-4 h-44 w-full rounded-xl object-cover"
          />
          <div v-else class="mb-4 grid h-36 place-items-center rounded-xl bg-white text-sm font-semibold text-slate-400">
            A foto escolhida aparecera aqui
          </div>
          <input
            id="product-photo"
            ref="photoInput"
            type="file"
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
            {{ imagePreview ? 'Trocar foto' : 'Escolher foto' }}
          </button>
          <p class="mt-2 text-xs text-slate-500">JPG, PNG ou WebP - ate 5 MB. A foto e enviada ao selecionar.</p>
          <p v-if="isUploadingImage" role="status" class="mt-2 text-sm font-semibold text-festou-primary">Enviando foto...</p>
          <p v-if="imageError" role="alert" class="mt-2 text-sm font-semibold text-rose-700">{{ imageError }}</p>
          <button v-if="form.imagem_url" type="button" class="mt-3 text-sm font-bold text-rose-700 hover:underline" @click="removeImage">
            Remover foto do anuncio
          </button>
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
