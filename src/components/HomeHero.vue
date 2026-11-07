<script setup>
import FestouDecor from './FestouDecor.vue'

// Componente de apresentação principal da página inicial do Festou!.
// As duas ações direcionam para os fluxos públicos de convites e vitrine.
</script>

<template>
  <section class="relative isolate overflow-hidden bg-[linear-gradient(135deg,#17172f_0%,#211443_48%,#17172f_100%)] text-white">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(236,72,153,.24),transparent_28%),radial-gradient(circle_at_18%_82%,rgba(124,58,237,.20),transparent_32%),radial-gradient(circle_at_55%_45%,rgba(0,194,209,.08),transparent_24%)]"></div>
    <div class="pointer-events-none absolute inset-0 opacity-[0.10] [background-image:radial-gradient(circle,rgba(255,255,255,.95)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]"></div>
    <div class="festou-confetti-field pointer-events-none absolute inset-0 opacity-[0.16]"></div>
    <FestouDecor variant="hero" />
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 z-[1] hidden overflow-hidden sm:block">
      <span class="absolute left-[5%] top-[15%] h-3 w-1.5 rotate-12 rounded-sm bg-festou-yellow/70 animate-festou-drift"></span>
      <span class="absolute left-[38%] top-[8%] h-4 w-1.5 -rotate-45 rounded-sm bg-festou-cyan/60 animate-festou-twinkle [animation-delay:.8s]"></span>
      <span class="absolute left-[58%] top-[22%] h-3 w-1.5 rotate-[30deg] rounded-sm bg-festou-pink/70 animate-festou-drift [animation-delay:1.4s]"></span>
      <span class="absolute right-[4%] top-[42%] h-4 w-2 rotate-12 rounded-sm bg-festou-yellow/60 animate-festou-drift [animation-delay:2.2s]"></span>
      <span class="absolute bottom-[12%] left-[32%] h-3 w-1.5 -rotate-12 rounded-sm bg-festou-magenta/65 animate-festou-twinkle [animation-delay:1.1s]"></span>
      <span class="absolute bottom-[18%] right-[28%] h-4 w-1.5 rotate-45 rounded-sm bg-festou-cyan/65 animate-festou-drift [animation-delay:.5s]"></span>
    </div>
    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-festou-magenta/70 to-transparent"></div>

    <div class="relative z-10 mx-auto grid min-h-[590px] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.08fr_.92fr] lg:px-12 lg:py-24">
      <div class="max-w-3xl">
        <!-- Selo de confiança destacado no topo da seção -->
        <span class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-slate-950/10 backdrop-blur-xl sm:text-sm">
          <span aria-hidden="true">🎉</span>
          A plataforma completa para sua celebração
        </span>

        <h1 class="mt-6 font-heading text-[2.65rem] font-extrabold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-6xl">
          <span class="block">Celebre do seu jeito.</span>
          <span class="mt-2 block bg-gradient-to-r from-festou-pink via-festou-magenta to-festou-cyan bg-clip-text pb-2 text-transparent">
            A gente ajuda a organizar.
          </span>
        </h1>

        <p class="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
          Descubra fornecedores incríveis e envie convites digitais com confirmação de presença (RSVP) em poucos cliques.
        </p>

        <!-- CTAs principais -->
        <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <RouterLink
            to="/convites"
            class="inline-flex min-h-12 items-center justify-center rounded-full bg-festou-pink px-6 py-3 text-center text-sm font-extrabold text-festou-dark shadow-[0_14px_34px_-12px_rgba(236,72,153,.9)] transition duration-300 hover:-translate-y-0.5 hover:bg-white sm:text-base"
          >
            ✨ Criar Convite Grátis
          </RouterLink>

          <RouterLink
            to="/vitrine"
            class="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3 text-center text-sm font-extrabold text-white backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-festou-cyan/60 hover:bg-white/15 sm:text-base"
          >
            🔍 Explorar Vitrine
          </RouterLink>
        </div>

        <!-- Prova social sutil e ativa -->
        <div class="mt-7 flex flex-wrap items-center gap-3 text-sm text-white/70" aria-label="Atividade da plataforma">
          <div class="flex -space-x-2" aria-hidden="true">
            <span class="grid h-9 w-9 place-items-center rounded-full border-2 border-festou-dark bg-festou-magenta text-sm">🎂</span>
            <span class="grid h-9 w-9 place-items-center rounded-full border-2 border-festou-dark bg-festou-yellow text-sm">🍬</span>
            <span class="grid h-9 w-9 place-items-center rounded-full border-2 border-festou-dark bg-festou-cyan text-sm">🎈</span>
            <span class="grid h-9 w-9 place-items-center rounded-full border-2 border-festou-dark bg-festou-purple text-sm">💌</span>
          </div>
          <span class="inline-flex items-center gap-2 font-semibold">
            <span class="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
            </span>
            Plataforma ativa · mais de 1.000 festas organizadas
          </span>
        </div>
      </div>

      <!-- Preview visual representando convite e fornecedores -->
      <div class="relative mx-auto w-full max-w-md lg:ml-auto">
        <div class="absolute -inset-10 rounded-full bg-festou-magenta/10 blur-3xl"></div>
        <div class="relative rotate-[1.5deg] rounded-[2rem] border border-white/15 bg-white/[0.08] p-3 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
          <div class="rounded-[1.55rem] bg-slate-950/70 p-5 sm:p-6">
            <div class="flex items-center justify-between">
              <span class="rounded-full bg-festou-pink/15 px-3 py-1 text-xs font-bold text-festou-pink">Convite digital</span>
              <span class="flex items-center gap-1.5 text-xs font-bold text-emerald-300"><span class="h-2 w-2 rounded-full bg-emerald-400"></span>RSVP ativo</span>
            </div>
            <div class="mt-5 rounded-2xl border border-white/10 bg-gradient-to-br from-festou-purple/50 via-festou-dark to-festou-magenta/25 p-6 text-center">
              <span class="text-4xl" aria-hidden="true">🎂</span>
              <p class="mt-3 text-xs font-bold uppercase tracking-[.25em] text-festou-yellow">Você está convidado!</p>
              <p class="mt-2 font-heading text-2xl font-extrabold">Aniversário da Sofia</p>
              <p class="mt-1 text-sm text-white/65">18:00 · Espaço Aurora</p>
            </div>
            <div class="mt-4 grid grid-cols-3 gap-2">
              <div class="rounded-xl bg-emerald-500/15 px-2 py-3 text-center text-xs font-bold text-emerald-300">✓ Vou</div>
              <div class="rounded-xl bg-white/5 px-2 py-3 text-center text-xs font-bold text-white/70">Talvez</div>
              <div class="rounded-xl bg-white/5 px-2 py-3 text-center text-xs font-bold text-white/70">Não vou</div>
            </div>
            <div class="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-xs text-white/70">
              <span>38 confirmações</span>
              <span class="font-bold text-festou-cyan">Tudo atualizado</span>
            </div>
          </div>
        </div>

        <div class="absolute -bottom-5 -left-3 rounded-2xl border border-white/15 bg-slate-900/95 px-4 py-3 shadow-xl backdrop-blur-xl sm:-left-8">
          <p class="text-[10px] font-bold uppercase tracking-wider text-festou-pink">Fornecedores</p>
          <p class="mt-1 text-sm font-extrabold text-white">+ Serviços na sua região</p>
        </div>
      </div>
    </div>
  </section>
</template>
