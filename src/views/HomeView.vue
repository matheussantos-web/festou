<template>
  <main class="min-h-screen bg-orange-50 text-slate-900">
    <header class="flex items-center justify-between border-b border-orange-100 px-6 py-5 md:px-12">
      <RouterLink to="/" class="text-2xl font-bold text-rose-700">Festou!</RouterLink>
      <nav class="flex items-center gap-5 text-sm font-semibold">
        <RouterLink to="/vitrine" class="hover:text-rose-700">Vitrine</RouterLink>
        <RouterLink to="/login" class="hover:text-rose-700">Entrar</RouterLink>
        <RouterLink to="/cadastro" class="rounded-md bg-rose-700 px-4 py-2 text-white hover:bg-rose-800">
          Criar conta
        </RouterLink>
      </nav>
    </header>

    <section class="mx-auto max-w-5xl px-6 py-20 md:px-12 md:py-28">
      <p class="mb-4 text-sm font-bold uppercase tracking-widest text-rose-700">Sua festa começa aqui</p>
      <h1 class="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
        Celebre do seu jeito. A gente ajuda a organizar.
      </h1>
      <p class="mt-6 max-w-xl text-lg leading-8 text-slate-600">
        Encontre fornecedores, monte seu orçamento e prepare cada detalhe em um só lugar.
      </p>
      <RouterLink
        to="/vitrine"
        class="mt-9 inline-flex rounded-md bg-rose-700 px-6 py-3 font-semibold text-white hover:bg-rose-800"
      >
        Explorar a vitrine
      </RouterLink>
    </section>
  </main>
</template>