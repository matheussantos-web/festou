<script setup>
import { reactive, watch } from 'vue'

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

function fill(product) {
  Object.assign(form, {
    nome: product?.nome ?? '',
    categoria: product?.categoria ?? 'bolos',
    descricao: product?.descricao ?? '',
    preco: product?.preco ?? null,
    cidade: product?.cidade ?? '',
    imagem_url: product?.imagem_url ?? '',
  })
}

watch(() => props.product, fill, { immediate: true })

function reset() {
  Object.assign(form, emptyForm())
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
</script>

<template>
  <form class="space-y-5" @submit.prevent="submit">
    <div>
      <label for="product-name" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
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
        class="w-full text-sm"
      />
    </div>

    <div class="grid gap-5 sm:grid-cols-2">
      <div>
        <label for="category" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
          Categoria
        </label>
        <select
          id="category"
          v-model="form.categoria"
          required
          class="w-full text-sm"
        >
          <option value="bolos">🎂 Bolos</option>
          <option value="doces">🍬 Doces</option>
          <option value="brinquedos">🎈 Brinquedos</option>
          <option value="convites">💌 Convites digitais</option>
        </select>
      </div>

      <div>
        <label for="price" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
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
          class="w-full text-sm"
        />
      </div>
    </div>

    <div>
      <label for="description" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
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
        class="w-full text-sm"
      ></textarea>
    </div>

    <div class="grid gap-5 sm:grid-cols-2">
      <div>
        <label for="city" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
          Cidade de atendimento (opcional)
        </label>
        <input
          id="city"
          v-model="form.cidade"
          type="text"
          maxlength="100"
          placeholder="Ex: São Paulo - SP"
          class="w-full text-sm"
        />
      </div>

      <div>
        <label for="image-url" class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
          URL da imagem (opcional)
        </label>
        <input
          id="image-url"
          v-model="form.imagem_url"
          type="url"
          maxlength="2048"
          placeholder="https://exemplo.com/foto.jpg"
          class="w-full text-sm"
        />
        <p class="mt-1 text-xs text-slate-500">O link precisa começar com https://.</p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        :disabled="submitting"
        class="btn btn-primary flex-1 text-sm font-bold"
      >
        {{ submitting ? 'Salvando...' : submitLabel }}
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
