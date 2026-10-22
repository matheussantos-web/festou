<script setup>
const year = new Date().getFullYear()
</script>

<template>
  <footer class="relative overflow-hidden bg-festou-dusk text-white">
    <!-- Confetes e estrelas do rodapé -->
    <div class="festou-confetti-field pointer-events-none absolute inset-0 opacity-25" aria-hidden="true"></div>
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <span class="absolute left-[6%] top-[22%] h-3 w-1.5 rotate-45 animate-festou-drift rounded-full bg-festou-yellow"></span>
      <span class="absolute right-[10%] top-[18%] h-2.5 w-1.5 -rotate-12 animate-festou-drift rounded-full bg-festou-cyan [animation-delay:1.2s]"></span>
      <span class="absolute left-[46%] bottom-[18%] h-2 w-1.5 rotate-12 animate-festou-drift rounded-full bg-festou-magenta [animation-delay:2s]"></span>
      <svg class="absolute right-[24%] bottom-[24%] h-4 w-4 animate-festou-twinkle text-festou-yellow" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 0l2.4 8.2L22 12l-7.6 3.8L12 24l-2.4-8.2L2 12l7.6-3.8z" />
      </svg>
    </div>

    <div class="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12">
      <div class="grid gap-10 md:grid-cols-12">
        <!-- Marca -->
        <div class="md:col-span-5">
          <p class="font-heading text-3xl font-extrabold tracking-tight">
            <span class="bg-gradient-to-r from-festou-magenta via-festou-yellow to-festou-cyan bg-clip-text text-transparent">Festou</span><span class="text-festou-yellow">!</span>
          </p>
          <p class="mt-2 font-heading text-lg font-bold text-festou-yellow">Sua festa, do seu jeito!</p>
          <p class="mt-3 max-w-sm text-sm leading-relaxed text-white/75">
            Planeje a sua festa com simplicidade: convites digitais, produtos de fornecedores
            confiáveis e tudo em um só lugar.
          </p>
        </div>

        <!-- Navegação -->
        <nav class="md:col-span-3" aria-label="Navegação do rodapé">
          <h2 class="font-heading text-xs font-bold uppercase tracking-widest text-festou-yellow">
            Festou
          </h2>
          <ul class="mt-4 space-y-2.5 text-sm">
            <li>
              <RouterLink to="/vitrine" class="text-white/80 transition-colors duration-300 hover:text-white">
                Vitrine de produtos
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/convites" class="text-white/80 transition-colors duration-300 hover:text-white">
                Meus convites
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/carrinho" class="text-white/80 transition-colors duration-300 hover:text-white">
                Carrinho
              </RouterLink>
            </li>
          </ul>
        </nav>

        <!-- Conta -->
        <nav class="md:col-span-4" aria-label="Links de conta">
          <h2 class="font-heading text-xs font-bold uppercase tracking-widest text-festou-yellow">
            Sua conta
          </h2>
          <ul class="mt-4 space-y-2.5 text-sm">
            <li>
              <RouterLink to="/cadastro" class="text-white/80 transition-colors duration-300 hover:text-white">
                Criar conta grátis
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/login" class="text-white/80 transition-colors duration-300 hover:text-white">
                Entrar
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/fornecedor/produtos/novo" class="text-white/80 transition-colors duration-300 hover:text-white">
                Anunciar meu produto
              </RouterLink>
            </li>
          </ul>
        </nav>
      </div>

      <div class="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-6 text-xs text-white/60 sm:flex-row">
        <p>&copy; {{ year }} Festou! Todos os direitos reservados.</p>
        <p>Feito com confetes, cor e muita festa.</p>
      </div>
    </div>
  </footer>
</template>
