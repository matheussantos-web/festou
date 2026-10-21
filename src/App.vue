<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'

const route = useRoute()

const showChrome = computed(() => route.meta?.chrome !== false)
</script>

<template>
  <a
    v-if="showChrome"
    href="#conteudo-principal"
    class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-festou-midnight focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
  >
    Pular para o conteúdo principal
  </a>

  <AppHeader v-if="showChrome" />

  <RouterView />
</template>
