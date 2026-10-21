import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)
export const sessionCookieName = 'festou_session'
export const sessionDurationMs = 7 * 24 * 60 * 60 * 1000

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = await scrypt(password, salt, 64)
  return `${salt}:${hash.toString('hex')}`
}

export async function verifyPassword(password, storedHash) {
  const [salt, expectedHex] = storedHash.split(':')
  if (!salt || !expectedHex) return false

  const expected = Buffer.from(expectedHex, 'hex')
  const actual = await scrypt(password, salt, expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

// Hash ficticio usado quando o e-mail informado nao existe na base. Sem essa
// comparacao o login responderia bem mais rapido para e-mails inexistentes e
// permitiria enumerar contas pela diferenca de tempo.
let dummyHashPromise = null

export function getDummyPasswordHash() {
  dummyHashPromise ??= hashPassword(randomBytes(16).toString('hex'))
  return dummyHashPromise
}

export function createSessionToken() {
  return randomBytes(32).toString('base64url')
}

export function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export function setSessionCookie(response, token) {
  response.cookie(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionDurationMs,
  })
}

export function clearSessionCookie(response) {
  response.clearCookie(sessionCookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
}

export function isAllowedOrigin(request, configuredOrigin) {
  const origin = request.get('origin')

  // Sem Origin nao ha como identificar uma aplicacao web como origem da
  // solicitacao. O cookie de sessao e SameSite=Lax, entao o navegador nao o
  // envia em requisicoes de terceiros, o que mantem a protecao contra CSRF.
  if (!origin) return true

  if (configuredOrigin && origin === configuredOrigin) return true

  // Mesma origem do proprio servidor: acontece quando o Express tambem serve
  // o SPA compilado, caso em que o Origin do navegador e o host acessado.
  const host = request.get('host')
  if (!host) return false

  const candidates = new Set([`${request.protocol}://${host}`])

  const forwardedProto = request.get('x-forwarded-proto')?.split(',')[0]?.trim()
  if (forwardedProto) candidates.add(`${forwardedProto}://${host}`)

  return candidates.has(origin)
}