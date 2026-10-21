<script setup>
defineProps({
  variant: {
    type: String,
    default: 'hero',
  },
})
</script>

<template>
  <div
    aria-hidden="true"
    class="pointer-events-none absolute inset-0 overflow-hidden"
    :class="variant === 'hero' ? '' : 'opacity-70'"
  >
    <!-- Estrelas douradas -->
    <svg
      class="absolute left-[8%] top-[18%] h-5 w-5 animate-festou-twinkle text-festou-yellow"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 0l2.4 8.2L22 12l-7.6 3.8L12 24l-2.4-8.2L2 12l7.6-3.8z" />
    </svg>
    <svg
      class="absolute right-[12%] top-[12%] h-3.5 w-3.5 animate-festou-twinkle text-festou-yellow [animation-delay:1.2s]"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 0l2.4 8.2L22 12l-7.6 3.8L12 24l-2.4-8.2L2 12l7.6-3.8z" />
    </svg>
    <svg
      class="absolute right-[22%] top-[52%] h-6 w-6 animate-festou-twinkle text-festou-yellow [animation-delay:2.1s]"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 0l2.4 8.2L22 12l-7.6 3.8L12 24l-2.4-8.2L2 12l7.6-3.8z" />
    </svg>
    <svg
      class="absolute left-[18%] bottom-[16%] h-4 w-4 animate-festou-twinkle text-festou-yellow [animation-delay:0.6s]"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 0l2.4 8.2L22 12l-7.6 3.8L12 24l-2.4-8.2L2 12l7.6-3.8z" />
    </svg>

    <!-- Confetes coloridos -->
    <span
      class="absolute left-[4%] top-[46%] h-3 w-1.5 rotate-12 animate-festou-drift rounded-full bg-festou-magenta"
    ></span>
    <span
      class="absolute left-[26%] top-[8%] h-2.5 w-1.5 -rotate-12 animate-festou-drift rounded-full bg-festou-cyan [animation-delay:1.4s]"
    ></span>
    <span
      class="absolute right-[8%] bottom-[22%] h-3 w-1.5 rotate-45 animate-festou-drift rounded-full bg-festou-yellow [animation-delay:2.6s]"
    ></span>
    <span
      class="absolute right-[30%] bottom-[8%] h-2.5 w-1.5 rotate-12 animate-festou-drift rounded-full bg-festou-magenta [animation-delay:0.9s]"
    ></span>
    <span
      class="absolute left-[46%] top-[6%] h-2 w-1.5 -rotate-45 animate-festou-drift rounded-full bg-festou-cyan [animation-delay:3.1s]"
    ></span>
    <span
      class="absolute left-[62%] bottom-[14%] h-2.5 w-1.5 rotate-45 animate-festou-drift rounded-full bg-festou-yellow [animation-delay:1.9s]"
    ></span>

    <!-- Bolinhas difusas -->
    <span
      class="absolute -right-10 top-[28%] h-32 w-32 animate-festou-float rounded-full bg-festou-magenta/30 blur-3xl"
    ></span>
    <span
      class="absolute -left-12 bottom-[6%] h-40 w-40 animate-festou-float rounded-full bg-festou-cyan/25 blur-3xl [animation-delay:1.6s]"
    ></span>

    <!-- Balões -->
    <span
      class="absolute right-[16%] top-[26%] hidden h-9 w-7 animate-festou-float rounded-full bg-festou-magenta/70 [animation-delay:0.8s] sm:block"
    ></span>
    <span
      class="absolute left-[12%] top-[34%] hidden h-7 w-6 animate-festou-float rounded-full bg-festou-cyan/70 [animation-delay:2.2s] sm:block"
    ></span>
  </div>
</template>
