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
    successMessage.value = 'Produto publicado com sucesso na vitrine!'
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
  <div class="min-h-screen bg-slate-50 text-slate-900">

    <main id="conteudo-principal" class="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <div class="flex items-center justify-between text-xs font-semibold">
        <RouterLink to="/fornecedor/painel" class="text-festou-primary hover:underline">
          ← Voltar ao painel de pedidos
        </RouterLink>
        <RouterLink to="/vitrine" class="text-slate-500 hover:text-slate-800">
          Ver vitrine pública
        </RouterLink>
      </div>

      <div class="festou-surface mt-6 p-6 sm:p-10">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-festou-purple">
          <span>💼</span> Catálogo do Fornecedor
        </span>
        <h1 class="mt-3 font-heading text-3xl font-extrabold text-festou-midnight">
          Anunciar Produto ou Serviço
        </h1>
        <p class="mt-1 text-sm text-slate-600">
          Cadastre bolos, doces, brinquedos ou convites para exibir na vitrine pública para clientes.
        </p>

        <form class="mt-8 space-y-5" @submit.prevent="createProduct">
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
            </div>
          </div>

          <div v-if="errorMessage" role="alert" class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
            {{ errorMessage }}
          </div>

          <div v-if="successMessage" role="status" class="flex flex-wrap items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4 text-xs font-semibold text-green-900">
            <span>{{ successMessage }}</span>
            <div class="flex items-center gap-2">
              <RouterLink to="/fornecedor/painel" class="font-bold underline">
                Ver no meu painel
              </RouterLink>
              <span>·</span>
              <RouterLink to="/vitrine" class="font-bold underline">
                Ver na vitrine
              </RouterLink>
            </div>
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="btn-festou-primary w-full text-sm font-bold shadow-festive"
          >
            {{ isSubmitting ? 'Publicando produto...' : 'Publicar na vitrine' }}
          </button>
        </form>
      </div>
    </main>
  </div>
</template>
