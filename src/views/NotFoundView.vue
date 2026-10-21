<script setup>
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <main id="conteudo-principal" class="mx-auto flex max-w-xl flex-col items-center justify-center px-6 py-24 text-center">
      <span class="text-6xl">🎈</span>
      <p class="mt-4 text-xs font-bold uppercase tracking-widest text-festou-primary">Erro 404</p>
      <h1 class="mt-2 font-heading text-4xl font-extrabold text-festou-midnight">
        Ops! Página não encontrada
      </h1>
      <p class="mt-2 text-sm text-slate-600">
        Parece que essa comemoração mudou de endereço ou a página foi removida.
      </p>
      <RouterLink to="/" class="btn-festou-primary mt-8 text-sm font-bold">
        Voltar para a página inicial
      </RouterLink>
    </main>
  </div>
</template>
