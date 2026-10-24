<script setup>
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-festou-dark text-slate-900">
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-festou-dark/70 via-festou-dark/25 to-festou-dark/35"></div>
    <div class="festou-confetti-field pointer-events-none absolute inset-0 opacity-20"></div>
    <div class="pointer-events-none absolute -left-16 top-1/4 h-64 w-64 animate-festou-float rounded-full bg-festou-magenta/30 blur-3xl"></div>
    <div class="pointer-events-none absolute -right-16 bottom-1/4 h-64 w-64 animate-festou-float rounded-full bg-festou-cyan/25 blur-3xl [animation-delay:1.5s]"></div>

    <main id="conteudo-principal" class="relative z-10 mx-auto flex max-w-xl flex-col items-center justify-center px-6 py-24 text-center">
      <span class="text-6xl">🎈</span>
      <p class="mt-4 font-heading text-xs font-bold uppercase tracking-widest text-festou-yellow">Erro 404</p>
      <h1 class="mt-2 font-heading text-4xl font-extrabold text-white sm:text-5xl">
        Ops! Página não encontrada
      </h1>
      <p class="mt-3 text-sm text-white/80">
        Parece que essa comemoração mudou de endereço ou a página foi removida.
      </p>
      <RouterLink to="/" class="btn btn-primary mt-8 text-sm font-bold">
        Voltar para a página inicial
      </RouterLink>
    </main>
  </div>
</template>
