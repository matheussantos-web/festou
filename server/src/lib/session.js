import { readonly, ref } from 'vue'
import { api } from './api'

// Guarda a sessao em um unico lugar. Antes, cada navegacao para uma rota
// protegida e cada montagem do cabecalho chamavam /auth/me de novo.
const currentUser = ref(null)
const hasLoaded = ref(false)
const isResolving = ref(false)
let pendingRequest = null

async function fetchSession() {
  try {
    const { user } = await api('/auth/me')
    currentUser.value = user ?? null
    return { user: currentUser.value, error: null }
  } catch (error) {
    currentUser.value = null
    return { user: null, error }
  } finally {
    hasLoaded.value = true
  }
}

export async function loadSession({ force = false } = {}) {
  if (!force && hasLoaded.value) return { user: currentUser.value, error: null }
  if (!force && pendingRequest) return pendingRequest

  isResolving.value = true
  pendingRequest = fetchSession().finally(() => {
    isResolving.value = false
    pendingRequest = null
  })

  return pendingRequest
}

export function setSession(user) {
  currentUser.value = user ?? null
  hasLoaded.value = true
}

export function clearSession() {
  currentUser.value = null
  hasLoaded.value = true
}

export const sessionUser = readonly(currentUser)

export function useSession() {
  return {
    user: sessionUser,
    isResolving: readonly(isResolving),
    loadSession,
    setSession,
    clearSession,
  }
}
