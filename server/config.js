// Configuração da aplicação, lida das variáveis de ambiente.
// Mantém as regras de ambiente fora das rotas para facilitar os testes.

function readInteger(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback

  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : fallback
}

// Quantos proxies reversos existem na frente da aplicação (nginx, Render,
// Railway, Cloudflare...). Sem isso o Express ignora o X-Forwarded-For e todo
// mundo passa a compartilhar o mesmo IP nos limitadores de requisição.
export function parseTrustProxy(value) {
  if (value === undefined || value === null || value === '') return false
  if (value === 'true') return true
  if (value === 'false') return false

  const hops = Number(value)
  return Number.isInteger(hops) && hops >= 0 ? hops : false
}

export const trustProxy = parseTrustProxy(process.env.TRUST_PROXY)

export const port = readInteger(process.env.PORT, 3000)
export const host = process.env.HOST || '127.0.0.1'
export const appOrigin = process.env.APP_ORIGIN || 'http://127.0.0.1:5173'
export const isProduction = process.env.NODE_ENV === 'production'
export const authRateLimit = readInteger(process.env.AUTH_RATE_LIMIT, 10)
export const rsvpRateLimit = readInteger(process.env.RSVP_RATE_LIMIT, 30)
export const jsonBodyLimit = process.env.JSON_BODY_LIMIT || '16kb'
