<script setup>

const categories = [
  { slug: 'bolos', title: 'Bolos de Festa', desc: 'Artesanais, temáticos e confeitados para momentos inesquecíveis.', icon: '🎂', color: 'from-pink-500/10 to-rose-500/10 border-pink-200' },
  { slug: 'doces', title: 'Doces & Sobremesas', desc: 'Brigadeiros gourmet, macarons e delícias para sua mesa.', icon: '🍬', color: 'from-amber-500/10 to-yellow-500/10 border-amber-200' },
  { slug: 'brinquedos', title: 'Brinquedos & Lazer', desc: 'Pula-pula, piscina de bolinhas e animação para a criançada.', icon: '🎈', color: 'from-cyan-500/10 to-teal-500/10 border-cyan-200' },
  { slug: 'convites', title: 'Convites Digitais', desc: 'Modelos interativos com controle de confirmação de presença (RSVP).', icon: '💌', color: 'from-purple-500/10 to-indigo-500/10 border-purple-200' },
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
  <div id="conteudo-principal" class="min-h-screen bg-slate-50 text-slate-900">

    <!-- Hero Section com Arte no Fundo e Showcase UI Interativo -->
    <section class="relative overflow-hidden bg-gradient-to-b from-orange-50/70 via-white to-slate-50 py-16 sm:py-24">
      <!-- Imagem de Marca no Fundo com Degradê Sutil -->
      <div class="pointer-events-none absolute right-0 top-0 h-full w-full max-w-3xl overflow-hidden opacity-[0.14] mix-blend-multiply">
        <img
          src="/festou-marca.png"
          alt=""
          class="h-full w-full object-cover object-right-top [mask-image:radial-gradient(ellipse_at_70%_40%,black_30%,transparent_75%)]"
          aria-hidden="true"
        />
      </div>

      <!-- Orbs de Luz Festiva -->
      <div class="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-festou-primary/10 blur-3xl"></div>
      <div class="pointer-events-none absolute right-10 top-32 h-80 w-80 rounded-full bg-festou-turquoise/15 blur-3xl"></div>

      <div class="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12">
        <!-- Coluna da Esquerda: Copywriting e Chamadas -->
        <div>
          <span class="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold text-amber-900 shadow-sm">
            <span aria-hidden="true">🎉</span>
            A plataforma completa para sua celebração
          </span>

          <h1 class="mt-6 font-heading text-4xl font-extrabold leading-[1.15] text-festou-midnight sm:text-5xl lg:text-6xl">
            Celebre do seu jeito.<br />
            <span class="bg-gradient-to-r from-festou-primary via-festou-purple to-festou-turquoise bg-clip-text text-transparent">
              A gente ajuda a organizar.
            </span>
          </h1>

          <p class="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            Descubra fornecedores incríveis, monte pedidos de orçamento e envie convites digitais com confirmação de presença (RSVP) em poucos cliques.
          </p>

          <div class="mt-9 flex flex-wrap items-center gap-4">
            <RouterLink to="/vitrine" class="btn-festou-primary text-base">
              Explorar a vitrine <span class="ml-2" aria-hidden="true">→</span>
            </RouterLink>
            <RouterLink to="/convites" class="btn-festou-secondary text-base">
              Criar convite digital
            </RouterLink>
          </div>

          <div class="mt-10 flex items-center gap-4 text-xs font-semibold text-slate-500">
            <div class="flex -space-x-2">
              <span class="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-pink-100 shadow-sm">🎂</span>
              <span class="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-amber-100 shadow-sm">🍬</span>
              <span class="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-cyan-100 shadow-sm">🎈</span>
              <span class="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-purple-100 shadow-sm">💌</span>
            </div>
            <span>Centenas de festas planejadas sem estresse.</span>
          </div>
        </div>

        <!-- Coluna da Direita: Composição Visual do Produto (Showcase Cards) -->
        <div class="relative mx-auto w-full max-w-lg lg:max-w-none">
          <!-- Card Flutuante 1: Fornecedor em Destaque (Topo) -->
          <div class="relative z-20 mb-4 ml-auto max-w-xs transform rounded-2xl border border-pink-100 bg-white/95 p-3.5 shadow-xl backdrop-blur transition duration-300 hover:-translate-y-1 sm:-mb-6 sm:ml-0">
            <div class="flex items-center gap-3">
              <div class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-pink-100 text-2xl">
                🎂
              </div>
              <div class="min-w-0 flex-1">
                <span class="rounded bg-pink-50 px-2 py-0.5 text-[10px] font-bold text-festou-primary">Destaque na Vitrine</span>
                <p class="truncate text-xs font-bold text-slate-900">Bolo Ninho com Morangos</p>
                <p class="text-xs font-extrabold text-festou-primary">R$ 160,00</p>
              </div>
            </div>
          </div>

          <!-- Card Central: Preview do Convite Digital Interativo -->
          <div class="relative z-10 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl transition duration-500 hover:shadow-card-hover">
            <!-- Topo do Convite -->
            <div class="bg-gradient-to-r from-festou-midnight via-festou-purple to-festou-primary p-6 text-white">
              <div class="flex items-center justify-between">
                <span class="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold backdrop-blur">
                  💌 Convite Digital
                </span>
                <span class="flex items-center gap-1.5 text-xs font-semibold text-pink-200">
                  <span class="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
                  RSVP Ativo
                </span>
              </div>
              <p class="mt-4 text-xs font-bold uppercase tracking-widest text-pink-200">Você está convidado!</p>
              <h2 class="mt-1 font-heading text-2xl font-extrabold sm:text-3xl">
                Aniversário da Sofia · 7 Anos
              </h2>
              <p class="mt-1 text-xs opacity-90">Com carinho, Família Albuquerque</p>
            </div>

            <!-- Corpo do Convite com Detalhes -->
            <div class="p-6">
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="rounded-xl bg-slate-50 p-3">
                  <span class="text-slate-400 font-bold uppercase text-[10px]">Quando</span>
                  <p class="mt-0.5 font-bold text-slate-800">Sábado, às 16:30</p>
                </div>
                <div class="rounded-xl bg-slate-50 p-3">
                  <span class="text-slate-400 font-bold uppercase text-[10px]">Onde</span>
                  <p class="mt-0.5 font-bold text-slate-800">Buffet Balão Mágico</p>
                </div>
              </div>

              <!-- Simulação de Resposta RSVP -->
              <div class="mt-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
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
                    <span class="h-6 w-6 rounded-full bg-pink-200 border border-white grid place-items-center text-[10px]">👩</span>
                    <span class="h-6 w-6 rounded-full bg-amber-200 border border-white grid place-items-center text-[10px]">👦</span>
                    <span class="h-6 w-6 rounded-full bg-teal-200 border border-white grid place-items-center text-[10px]">👨</span>
                  </div>
                  <span class="font-bold text-slate-800">38 presenças confirmadas</span>
                </div>
                <span class="font-semibold text-festou-primary">4 talvez</span>
              </div>
            </div>
          </div>

          <!-- Card Flutuante 2: Orçamento em Tempo Real (Base) -->
          <div class="relative z-20 mt-4 mr-auto max-w-xs transform rounded-2xl border border-purple-100 bg-white/95 p-3.5 shadow-xl backdrop-blur transition duration-300 hover:-translate-y-1 sm:-mt-6 sm:mr-0 sm:ml-auto">
            <div class="flex items-center gap-3">
              <div class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-100 text-lg">
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
        <p class="text-xs font-bold uppercase tracking-widest text-festou-primary">Tudo o que sua festa precisa</p>
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
          class="festou-card group flex flex-col justify-between p-6 text-left"
        >
          <div>
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl shadow-sm transition-transform duration-300 group-hover:scale-110" :class="cat.color">
              {{ cat.icon }}
            </div>
            <h3 class="mt-5 text-xl font-bold text-slate-900 group-hover:text-festou-primary">
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
          <p class="text-xs font-bold uppercase tracking-widest text-festou-turquoise">Simples, prático e rápido</p>
          <h2 class="mt-2 font-heading text-3xl font-extrabold text-festou-midnight sm:text-4xl">
            Como funciona o Festou!
          </h2>
        </div>

        <div class="mt-14 grid gap-8 md:grid-cols-3">
          <div
            v-for="step in steps"
            :key="step.number"
            class="relative rounded-2xl border border-slate-100 bg-slate-50/70 p-8 shadow-sm transition-hover hover:bg-white hover:shadow-md"
          >
            <span class="font-heading text-4xl font-extrabold text-festou-primary/30">
              {{ step.number }}
            </span>
            <h3 class="mt-4 text-xl font-bold text-slate-900">
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
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-festou-midnight via-festou-purple to-festou-primary p-8 text-white shadow-xl sm:p-14">
        <div class="relative z-10 max-w-2xl">
          <span class="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur">
            Para Confeiteiros, Doceiros e Fornecedores
          </span>
          <h2 class="mt-4 font-heading text-3xl font-extrabold leading-tight sm:text-4xl">
            Divulgue seus produtos e receba solicitações de orçamento
          </h2>
          <p class="mt-4 text-base leading-relaxed text-purple-100">
            Cadastre-se como fornecedor no Festou!, crie seu catálogo e conecte-se com clientes que estão organizando festas agora mesmo.
          </p>
          <div class="mt-8 flex flex-wrap gap-4">
            <RouterLink
              to="/cadastro"
              class="rounded-full bg-white px-7 py-3 text-sm font-bold text-festou-midnight shadow-lg transition hover:bg-orange-50 hover:text-festou-primary"
            >
              Criar conta de fornecedor
            </RouterLink>
            <RouterLink
              to="/fornecedor/painel"
              class="rounded-full border-2 border-white/40 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Acessar meu painel
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Rodapé -->
    <footer class="border-t border-slate-200 bg-slate-900 py-12 text-slate-400">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <div>
          <span class="font-heading text-2xl font-extrabold text-white">
            Festou<span class="text-festou-primary">!</span>
          </span>
          <p class="mt-1 text-xs text-slate-400">Plataforma alegre e completa para o planejamento de festas.</p>
        </div>
        <div class="flex items-center gap-6 text-xs font-semibold">
          <RouterLink to="/vitrine" class="hover:text-white">Vitrine</RouterLink>
          <RouterLink to="/convites" class="hover:text-white">Convites & RSVP</RouterLink>
          <RouterLink to="/login" class="hover:text-white">Entrar</RouterLink>
          <RouterLink to="/cadastro" class="hover:text-white">Cadastre-se</RouterLink>
        </div>
      </div>
      <div class="mx-auto mt-8 max-w-7xl border-t border-slate-800 px-5 pt-6 text-center text-xs text-slate-500 sm:px-8 lg:px-12">
        © 2026 Festou! Todos os direitos reservados.
      </div>
    </footer>
  </div>
</template>
