<script setup>
import FestouDecor from '../components/FestouDecor.vue'

const categories = [
  { slug: 'bolos', title: 'Bolos de Festa', desc: 'Artesanais, temáticos e confeitados para momentos inesquecíveis.', icon: '🎂', color: 'from-festou-magenta/20 to-festou-primary/20 border-festou-magenta/30' },
  { slug: 'doces', title: 'Doces & Sobremesas', desc: 'Brigadeiros gourmet, macarons e delícias para sua mesa.', icon: '🍬', color: 'from-festou-yellow/25 to-festou-orange/20 border-festou-yellow/40' },
  { slug: 'brinquedos', title: 'Brinquedos & Lazer', desc: 'Pula-pula, piscina de bolinhas e animação para a criançada.', icon: '🎈', color: 'from-festou-cyan/20 to-festou-turquoise/20 border-festou-cyan/30' },
  { slug: 'convites', title: 'Convites Digitais', desc: 'Modelos interativos com controle de confirmação de presença (RSVP).', icon: '💌', color: 'from-festou-secondary/20 to-festou-purple/20 border-festou-secondary/30' },
]

const steps = [
  {
    number: '01',
    title: 'Descubra Fornecedores',
    desc: 'Navegue pelo catálogo de bolos, doces, recreação e convites selecionados da sua região.',
  },
  {
    number: '02',
    title: 'Monte o Orçamento',
    desc: 'Adicione itens de fornecedores diferentes ao carrinho e envie a solicitação em um só lugar.',
  },
  {
    number: '03',
    title: 'Envie Convites com RSVP',
    desc: 'Crie seu convite personalizado, compartilhe pelo WhatsApp e acompanhe quem vai em tempo real.',
  },
]
</script>

<template>
  <div id="conteudo-principal" class="min-h-screen bg-festou-soft text-slate-900">

    <!-- Hero Section: Noite Festiva -->
    <section class="relative overflow-hidden bg-festou-night py-16 text-white sm:py-24">
      <!-- Profundidade da noite + confetes -->
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-festou-midnight/70 via-festou-midnight/25 to-festou-midnight/35"></div>
      <div class="festou-confetti-field pointer-events-none absolute inset-0 opacity-20"></div>
      <FestouDecor />

      <div class="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12">
        <!-- Coluna da Esquerda: Copywriting e Chamadas -->
        <div>
          <span class="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur">
            <span aria-hidden="true">🎉</span>
            A plataforma completa para sua celebração
          </span>

          <h1 class="mt-6 font-heading text-4xl font-extrabold leading-[1.15] text-white sm:text-5xl lg:text-6xl">
            Celebre do seu jeito.<br />
            <span class="bg-gradient-to-r from-festou-yellow via-festou-magenta to-festou-cyan bg-clip-text text-transparent">
              A gente ajuda a organizar.
            </span>
          </h1>

          <p class="mt-6 max-w-xl text-lg leading-relaxed text-white/85">
            Descubra fornecedores incríveis, monte pedidos de orçamento e envie convites digitais com confirmação de presença (RSVP) em poucos cliques.
          </p>

          <div class="mt-9 flex flex-wrap items-center gap-4">
            <RouterLink to="/vitrine" class="btn-festou-primary text-base">
              Explorar a vitrine <span class="ml-2" aria-hidden="true">→</span>
            </RouterLink>
            <RouterLink to="/convites" class="btn-festou-secondary border-white/40 bg-white/10 text-white backdrop-blur hover:border-white hover:bg-white/20 hover:text-white">
              Criar convite digital
            </RouterLink>
          </div>

          <div class="mt-10 flex items-center gap-4 text-xs font-semibold text-white/75">
            <div class="flex -space-x-2">
              <span class="grid h-8 w-8 place-items-center rounded-full border-2 border-white/70 bg-festou-magenta/80 shadow-sm">🎂</span>
              <span class="grid h-8 w-8 place-items-center rounded-full border-2 border-white/70 bg-festou-yellow/80 shadow-sm">🍬</span>
              <span class="grid h-8 w-8 place-items-center rounded-full border-2 border-white/70 bg-festou-cyan/80 shadow-sm">🎈</span>
              <span class="grid h-8 w-8 place-items-center rounded-full border-2 border-white/70 bg-festou-secondary/80 shadow-sm">💌</span>
            </div>
            <span>Centenas de festas planejadas sem estresse.</span>
          </div>
        </div>

        <!-- Coluna da Direita: Composição Visual do Produto (Showcase Cards) -->
        <div class="relative mx-auto w-full max-w-lg lg:max-w-none">
          <!-- Card Flutuante 1: Fornecedor em Destaque (Topo) -->
          <div class="relative z-20 mb-4 ml-auto max-w-xs transform rounded-2xl border border-white/50 bg-white/90 p-3.5 shadow-2xl backdrop-blur-md transition duration-300 hover:-translate-y-1 sm:-mb-6 sm:ml-0">
            <div class="flex items-center gap-3">
              <div class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-festou-magenta/15 text-2xl">
                🎂
              </div>
              <div class="min-w-0 flex-1">
                <span class="festou-badge bg-festou-magenta/15 text-festou-primary">Destaque na Vitrine</span>
                <p class="mt-1 truncate text-xs font-bold text-slate-900">Bolo Ninho com Morangos</p>
                <p class="text-xs font-extrabold text-festou-primary">R$ 160,00</p>
              </div>
            </div>
          </div>

          <!-- Card Central: Preview do Convite Digital Interativo -->
          <div class="relative z-10 overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl transition duration-500 hover:shadow-festive-glow">
            <!-- Topo do Convite -->
            <div class="bg-festou-night p-6 text-white">
              <div class="flex items-center justify-between">
                <span class="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold backdrop-blur">
                  💌 Convite Digital
                </span>
                <span class="flex items-center gap-1.5 text-xs font-semibold text-festou-yellow">
                  <span class="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
                  RSVP Ativo
                </span>
              </div>
              <p class="mt-4 text-xs font-bold uppercase tracking-widest text-festou-yellow">Você está convidado!</p>
              <h2 class="mt-1 font-heading text-2xl font-extrabold sm:text-3xl">
                Aniversário da Sofia · 7 Anos
              </h2>
              <p class="mt-1 text-xs opacity-90">Com carinho, Família Albuquerque</p>
            </div>

            <!-- Corpo do Convite com Detalhes -->
            <div class="p-6">
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="rounded-xl bg-festou-soft p-3">
                  <span class="text-slate-400 font-bold uppercase text-[10px]">Quando</span>
                  <p class="mt-0.5 font-bold text-slate-800">Sábado, às 16:30</p>
                </div>
                <div class="rounded-xl bg-festou-soft p-3">
                  <span class="text-slate-400 font-bold uppercase text-[10px]">Onde</span>
                  <p class="mt-0.5 font-bold text-slate-800">Buffet Balão Mágico</p>
                </div>
              </div>

              <!-- Simulação de Resposta RSVP -->
              <div class="mt-4 rounded-xl border border-festou-secondary/15 bg-festou-secondary/5 p-4">
                <p class="text-xs font-bold text-slate-700">Confirmação de Presença:</p>
                <div class="mt-2.5 flex items-center gap-2">
                  <span class="flex-1 rounded-lg bg-emerald-600 py-1.5 text-center text-xs font-bold text-white shadow-sm">
                    ✓ Vou (2 pessoas)
                  </span>
                  <span class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
                    Talvez
                  </span>
                  <span class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
                    Não vou
                  </span>
                </div>
              </div>

              <!-- Contador de Convidados -->
              <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                <div class="flex items-center gap-2">
                  <div class="flex -space-x-1.5">
                    <span class="h-6 w-6 rounded-full bg-festou-magenta/40 border border-white grid place-items-center text-[10px]">👩</span>
                    <span class="h-6 w-6 rounded-full bg-festou-yellow/50 border border-white grid place-items-center text-[10px]">👦</span>
                    <span class="h-6 w-6 rounded-full bg-festou-cyan/40 border border-white grid place-items-center text-[10px]">👨</span>
                  </div>
                  <span class="font-bold text-slate-800">38 presenças confirmadas</span>
                </div>
                <span class="font-semibold text-festou-primary">4 talvez</span>
              </div>
            </div>
          </div>

          <!-- Card Flutuante 2: Orçamento em Tempo Real (Base) -->
          <div class="relative z-20 mt-4 mr-auto max-w-xs transform rounded-2xl border border-white/50 bg-white/90 p-3.5 shadow-2xl backdrop-blur-md transition duration-300 hover:-translate-y-1 sm:-mt-6 sm:mr-0 sm:ml-auto">
            <div class="flex items-center gap-3">
              <div class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-festou-secondary/15 text-lg">
                💬
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-bold text-slate-900">Orçamento #1042</p>
                  <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Confirmado</span>
                </div>
                <p class="text-[11px] text-slate-500">Bolo + 100 Brigadeiros</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Seção de Categorias -->
    <section class="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12">
      <div class="text-center">
        <p class="font-display text-xs font-bold uppercase tracking-widest text-festou-primary">Tudo o que sua festa precisa</p>
        <h2 class="mt-2 font-heading text-3xl font-extrabold text-festou-midnight sm:text-4xl">
          Navegue pelas principais categorias
        </h2>
        <p class="mx-auto mt-3 max-w-2xl text-slate-600">
          Encontre os melhores parceiros para aniversários infantis, formaturas, chás e datas comemorativas.
        </p>
      </div>

      <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <RouterLink
          v-for="cat in categories"
          :key="cat.slug"
          :to="`/vitrine?categoria=${cat.slug}`"
          class="festou-card-gradient group flex flex-col justify-between p-6 text-left"
        >
          <div>
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl border bg-gradient-to-br text-3xl shadow-sm transition-transform duration-300 group-hover:scale-110" :class="cat.color">
              {{ cat.icon }}
            </div>
            <h3 class="mt-5 font-display text-xl font-bold text-slate-900 transition-colors duration-300 group-hover:text-festou-primary">
              {{ cat.title }}
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              {{ cat.desc }}
            </p>
          </div>
          <span class="mt-5 inline-flex items-center text-xs font-bold text-festou-primary group-hover:underline">
            Ver produtos <span class="ml-1" aria-hidden="true">→</span>
          </span>
        </RouterLink>
      </div>
    </section>

    <!-- Seção Como Funciona -->
    <section class="border-y border-slate-200/80 bg-white py-20">
      <div class="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div class="text-center">
          <p class="font-display text-xs font-bold uppercase tracking-widest text-festou-turquoise">Simples, prático e rápido</p>
          <h2 class="mt-2 font-heading text-3xl font-extrabold text-festou-midnight sm:text-4xl">
            Como funciona o Festou!
          </h2>
        </div>

        <div class="mt-14 grid gap-8 md:grid-cols-3">
          <div
            v-for="step in steps"
            :key="step.number"
            class="festou-card group relative overflow-hidden p-8"
          >
            <span class="absolute -right-2 -top-4 font-heading text-6xl font-extrabold text-festou-primary/10 transition-colors duration-300 group-hover:text-festou-primary/20">
              {{ step.number }}
            </span>
            <span class="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-festou-night font-display text-sm font-extrabold text-white shadow-festive-soft">
              {{ step.number }}
            </span>
            <h3 class="mt-4 font-display text-xl font-bold text-slate-900">
              {{ step.title }}
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              {{ step.desc }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Banner para Fornecedores -->
    <section class="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12">
      <div class="relative overflow-hidden rounded-3xl bg-festou-dusk p-8 text-white shadow-festive-glow sm:p-14">
        <div class="festou-confetti-field pointer-events-none absolute inset-0 opacity-20"></div>
        <FestouDecor variant="soft" />

        <div class="relative z-10 max-w-2xl">
          <span class="festou-badge border border-white/25 bg-white/15 text-festou-yellow backdrop-blur">
            Para Confeiteiros, Doceiros e Fornecedores
          </span>
          <h2 class="mt-4 font-heading text-3xl font-extrabold leading-tight sm:text-4xl">
            Divulgue seus produtos e receba solicitações de orçamento
          </h2>
          <p class="mt-4 text-base leading-relaxed text-white/80">
            Cadastre-se como fornecedor no Festou!, crie seu catálogo e conecte-se com clientes que estão organizando festas agora mesmo.
          </p>
          <div class="mt-8 flex flex-wrap gap-4">
            <RouterLink
              to="/cadastro"
              class="rounded-full bg-festou-magenta-deep px-7 py-3 text-sm font-bold text-white shadow-festive transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-festive-strong"
            >
              Criar conta de fornecedor
            </RouterLink>
            <RouterLink
              to="/fornecedor/painel"
              class="rounded-full border-2 border-white/40 px-6 py-3 text-sm font-bold text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10"
            >
              Acessar meu painel
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
