import { ref } from 'vue'
import { api } from './api'

const pendingOrderCount = ref(0)
const unreadMessageCount = ref(0)
const isLoadingNotifications = ref(false)
let pendingRequest = null
let notificationUserId = null
let refreshVersion = 0
let requestSequence = 0

export async function refreshNotificationCounts({ force = false } = {}) {
  if (!notificationUserId) return null
  if (!force && pendingRequest?.version === refreshVersion) return pendingRequest.promise

  isLoadingNotifications.value = true
  const request = { version: refreshVersion, sequence: ++requestSequence, promise: null }
  pendingRequest = request
  request.promise = api('/orders/notifications')
    .then((result) => {
      if (request.version === refreshVersion && request.sequence === requestSequence) {
        pendingOrderCount.value = Math.max(0, Number(result.pending_orders) || 0)
        unreadMessageCount.value = Math.max(0, Number(result.unread_messages) || 0)
      }
      return result
    })
    .catch((error) => {
      // Uma sessao encerrada nao deve deixar badges de outra conta na tela.
      if (request.version === refreshVersion && request.sequence === requestSequence && [401, 403].includes(error.status)) {
        clearNotificationCounts()
      }
      return null
    })
    .finally(() => {
      if (pendingRequest === request) {
        isLoadingNotifications.value = false
        pendingRequest = null
      }
    })

  return request.promise
}

export function setNotificationUser(userId) {
  if (notificationUserId === userId) return
  notificationUserId = userId ?? null
  refreshVersion += 1
  pendingOrderCount.value = 0
  unreadMessageCount.value = 0
  isLoadingNotifications.value = false
}

export function clearNotificationCounts() {
  notificationUserId = null
  refreshVersion += 1
  pendingOrderCount.value = 0
  unreadMessageCount.value = 0
  isLoadingNotifications.value = false
}

export function useNotifications() {
  return {
    pendingOrderCount,
    unreadMessageCount,
    isLoadingNotifications,
    refreshNotificationCounts,
    clearNotificationCounts,
  }
}
