<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../lib/api'
import SupplierProductForm from '../components/SupplierProductForm.vue'

const route = useRoute()
const router = useRouter()

const product = ref(null)
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(true)
const isSubmitting = ref(false)

async function loadProduct() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await api(`/supplier/products/${route.params.id}`)
    product.value = result.product
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível carregar o produto.'
  } finally {
    isLoading.value = false
  }
}

async function saveProduct(payload) {
  errorMessage.value = ''
  successMessage.value = ''
  isSubmitting.value = true

  try {
    const result = await api(`/supplier/products/${product.value.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    product.value = result.product
    successMessage.value = result.message || 'Produto atualizado com sucesso.'
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível salvar o produto. Tente novamente.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(loadProduct)
</script>

<template>
  <div class="min-h-screen bg-festou-soft text-slate-900">

    <main id="conteudo-principal" class="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <div class="flex items-center justify-between text-xs font-semibold">
        <RouterLink to="/fornecedor/painel" class="text-festou-primary hover:underline">
          ← Voltar ao painel de pedidos
        </RouterLink>
        <RouterLink to="/vitrine" class="text-slate-500 hover:text-slate-800">
          Ver vitrine pública
        </RouterLink>
      </div>

      <div class="card-gradient mt-6 p-6 sm:p-10">
        <span class="badge bg-festou-secondary/12 text-festou-secondary">
          <span aria-hidden="true">✏️</span> Editar anúncio
        </span>
        <h1 class="mt-3 font-heading text-3xl font-extrabold text-festou-midnight">
          Editar produto
        </h1>
        <p class="mt-1 text-sm text-slate-600">
          As alterações entram no ar na vitrine assim que forem salvas.
        </p>

        <div v-if="isLoading" role="status" class="mt-8 py-10 text-center text-sm text-slate-600">
          Carregando o produto...
        </div>

        <div v-else-if="!product" role="alert" class="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {{ errorMessage || 'Produto não encontrado.' }}
        </div>

        <div v-else class="mt-8">
          <SupplierProductForm
            :product="product"
            :submitting="isSubmitting"
            submit-label="Salvar alterações"
            @submit="saveProduct"
            @cancel="router.push('/fornecedor/painel')"
          />
        </div>

        <div v-if="errorMessage && product" role="alert" class="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" role="status" class="mt-6 flex flex-wrap items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4 text-xs font-semibold text-green-900">
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
      </div>
    </main>
  </div>
</template>
