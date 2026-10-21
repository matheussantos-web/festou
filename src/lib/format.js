const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const dateFormatterCache = new Map()

export const emptyValue = '—'

function getDateFormatter(dateStyle, timeStyle) {
  const key = `${dateStyle}|${timeStyle}`
  const cached = dateFormatterCache.get(key)

  if (cached) return cached

  const formatter = new Intl.DateTimeFormat('pt-BR', { dateStyle, timeStyle })
  dateFormatterCache.set(key, formatter)

  return formatter
}

export function formatPrice(value) {
  if (value === null || value === undefined || value === '') return emptyValue

  const amount = Number(value)

  if (!Number.isFinite(amount)) return emptyValue

  return priceFormatter.format(amount)
}

export function formatDate(value, { dateStyle = 'medium', timeStyle = 'short' } = {}) {
  if (!value) return emptyValue

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return emptyValue

  return getDateFormatter(dateStyle, timeStyle).format(date)
}

export function formatText(value, fallback = emptyValue) {
  if (typeof value !== 'string') return fallback

  const trimmed = value.trim()
  return trimmed ? trimmed : fallback
}
