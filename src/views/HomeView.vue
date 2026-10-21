<template>
  <main class="min-h-screen overflow-hidden bg-festou-background text-festou-text">
    <header class="relative z-10 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        <RouterLink to="/" class="font-heading text-2xl font-extrabold tracking-tight text-festou-primary">
          Festou<span class="text-festou-secondary">!</span>
        </RouterLink>
        <nav class="flex items-center gap-3 text-sm font-semibold sm:gap-6">
          <RouterLink to="/vitrine" class="hidden transition-colors hover:text-festou-primary sm:inline">Vitrine</RouterLink>
          <RouterLink to="/convites" class="hidden transition-colors hover:text-festou-primary md:inline">Meus convites</RouterLink>
          <RouterLink to="/login" class="px-2 py-2 transition-colors hover:text-festou-secondary">Entrar</RouterLink>
          <RouterLink
            to="/cadastro"
            class="rounded-full bg-festou-primary px-4 py-2.5 font-bold text-white shadow-festive transition hover:-translate-y-0.5 hover:bg-rose-600 sm:px-5"
          >
            Criar conta
          </RouterLink>
        </nav>
      </div>
    </header>

    <section class="relative isolate">
      <div class="pointer-events-none absolute -right-24 -top-20 -z-10 h-80 w-80 rounded-full bg-amber-200/50 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-20 -left-24 -z-10 h-80 w-80 rounded-full bg-rose-200/50 blur-3xl"></div>

      <div class="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:py-28">
        <div>
          <p class="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800">
            <span aria-hidden="true">✦</span>
            Sua festa começa aqui
          </p>
          <h1 class="mt-6 max-w-2xl font-heading text-4xl font-extrabold leading-tight tracking-tight text-festou-text sm:text-5xl lg:text-6xl">
            Celebre do seu jeito<span class="text-festou-primary">.</span>
            <span class="text-festou-turquoise"> A gente ajuda a organizar.</span>
          </h1>
          <p class="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Encontre fornecedores, monte seu orçamento e prepare cada detalhe em um só lugar.
          </p>
          <div class="mt-9 flex flex-wrap items-center gap-4">
            <RouterLink
              to="/vitrine"
              class="inline-flex items-center justify-center rounded-full bg-festou-primary px-7 py-3.5 font-bold text-white shadow-festive transition hover:-translate-y-0.5 hover:bg-rose-600"
            >
              Explorar a vitrine <span class="ml-2" aria-hidden="true">→</span>
            </RouterLink>
            <RouterLink
              to="/convites"
              class="inline-flex items-center justify-center rounded-full border-2 border-festou-secondary/15 bg-white px-7 py-3 font-bold text-festou-secondary transition hover:border-festou-secondary/40 hover:bg-indigo-50"
            >
              Criar convite
            </RouterLink>
          </div>
          <div class="mt-10 flex items-center gap-3 text-sm font-medium text-white/80">
            <span class="flex -space-x-2" aria-hidden="true">
              <span class="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-amber-200">🎂</span>
              <span class="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-indigo-200">🎈</span>
              <span class="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-rose-200">🎁</span>
            </span>
            Tudo para comemorar em um só lugar
          </div>
        </div>

        <div class="relative mx-auto w-full max-w-md">
          <div class="absolute -inset-5 rounded-[3rem] bg-gradient-to-br from-festou-primary/20 via-festou-accent/20 to-festou-secondary/20 blur-2xl"></div>
          <img
            src="/festou-marca.png"
            alt="Marca Festou! em uma arte colorida de festa com bolo, balões, presentes e castelo"
            class="relative mx-auto max-h-[min(78vh,760px)] w-full rounded-[2rem] object-contain shadow-festive-soft"
            fetchpriority="high"
          />
        </div>
      </div>
    </section>
  </main>
</template>