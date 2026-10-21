<script setup>
import { reactive, ref } from 'vue'
import { api } from '../lib/api'

const form = reactive({
  nome: '',
  categoria: 'bolos',
  descricao: '',
  preco: null,
  cidade: '',
  imagem_url: '',
})

const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

async function createProduct() {
  errorMessage.value = ''
  successMessage.value = ''
  isSubmitting.value = true

  try {
    await api('/products', {
      method: 'POST',
      body: JSON.stringify({
        nome: form.nome,
        categoria: form.categoria,
        descricao: form.descricao,
        preco: form.preco,
        cidade: form.cidade,
        imagem_url: form.imagem_url,
      }),
    })
    successMessage.value = 'Produto anunciado na vitrine.'
    Object.assign(form, {
      nome: '',
      categoria: 'bolos',
      descricao: '',
      preco: null,
      cidade: '',
      imagem_url: '',
    })
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível anunciar o produto. Tente novamente.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-orange-50 px-6 py-10 text-slate-900">
    <section class="mx-auto max-w-2xl">
      <RouterLink to="/vitrine" class="text-sm font-semibold text-rose-700 hover:underline">Voltar à vitrine</RouterLink>
      <div class="festou-surface mt-6 p-6 sm:p-9">
        <p class="text-sm font-bold uppercase tracking-widest text-rose-700">Área do fornecedor</p>
        <h1 class="mt-2 text-3xl font-bold">Anunciar produto ou serviço</h1>
        <p class="mt-2 text-slate-600">As informações serão exibidas na vitrine pública.</p>

        <form class="mt-8 space-y-5" @submit.prevent="createProduct">
          <div>
            <label for="product-name" class="mb-1 block text-sm font-semibold">Nome do produto</label>
            <input
              id="product-name"
              v-model="form.nome"
              type="text"
              minlength="3"
              maxlength="120"
              required
              class="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
            />
          </div>
          <div>
            <label for="category" class="mb-1 block text-sm font-semibold">Categoria</label>
            <select
              id="category"
              v-model="form.categoria"
              required
              class="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
            >
              <option value="bolos">Bolos</option>
              <option value="doces">Doces</option>
              <option value="brinquedos">Brinquedos</option>
              <option value="convites">Convites digitais</option>
            </select>
          </div>
          <div>
            <label for="description" class="mb-1 block text-sm font-semibold">Descrição</label>
            <textarea
              id="description"
              v-model="form.descricao"
              rows="4"
              minlength="10"
              maxlength="1000"
              required
              class="w-full resize-y rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
            ></textarea>
          </div>
          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <label for="price" class="mb-1 block text-sm font-semibold">Preço (R$)</label>
              <input
                id="price"
                v-model.number="form.preco"
                type="number"
                min="0.01"
                max="99999999"
                step="0.01"
                required
                class="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
              />
            </div>
            <div>
              <label for="city" class="mb-1 block text-sm font-semibold">Cidade (opcional)</label>
              <input
                id="city"
                v-model="form.cidade"
                type="text"
                maxlength="100"
                class="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
              />
            </div>
          </div>
          <div>
            <label for="image-url" class="mb-1 block text-sm font-semibold">URL da imagem (opcional)</label>
            <input
              id="image-url"
              v-model="form.imagem_url"
              type="url"
              maxlength="2048"
              placeholder="https://..."
              class="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-100"
            />
          </div>
          <p v-if="errorMessage" role="alert" class="text-sm text-red-700">{{ errorMessage }}</p>
          <p v-if="successMessage" role="status" class="text-sm text-green-700">
            {{ successMessage }}
            <RouterLink to="/vitrine" class="ml-1 font-semibold underline">Ver vitrine</RouterLink>
          </p>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full rounded-md bg-rose-700 px-4 py-3 font-semibold text-white hover:bg-rose-800 disabled:cursor-wait disabled:opacity-60"
          >
            {{ isSubmitting ? 'Publicando...' : 'Publicar na vitrine' }}
          </button>
        </form>
      </div>
    </section>
  </main>
</template>