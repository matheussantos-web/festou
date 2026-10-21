<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
import SupplierProductForm from '../components/SupplierProductForm.vue'

const router = useRouter()
const formRef = ref(null)

const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

async function createProduct(payload) {
  errorMessage.value = ''
  successMessage.value = ''
  isSubmitting.value = true

  try {
    await api('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    successMessage.value = 'Produto publicado com sucesso na vitrine!'
    formRef.value?.reset()
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível anunciar o produto. Tente novamente.'
  } finally {
    isSubmitting.value = false
  }
}
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

      <div class="festou-card-gradient mt-6 p-6 sm:p-10">
        <span class="festou-badge bg-festou-secondary/12 text-festou-secondary">
          <span aria-hidden="true">💼</span> Catálogo do Fornecedor
        </span>
        <h1 class="mt-3 font-heading text-3xl font-extrabold text-festou-midnight">
          Anunciar Produto ou Serviço
        </h1>
        <p class="mt-1 text-sm text-slate-600">
          Cadastre bolos, doces, brinquedos ou convites para exibir na vitrine pública para clientes.
        </p>

        <div class="mt-8">
          <SupplierProductForm
            ref="formRef"
            :submitting="isSubmitting"
            submit-label="Publicar na vitrine"
            @submit="createProduct"
            @cancel="router.push('/fornecedor/painel')"
          />
        </div>

        <div v-if="errorMessage" role="alert" class="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
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
