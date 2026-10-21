import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)
export const sessionCookieName = 'festou_session'
export const sessionDurationMs = 7 * 24 * 60 * 60 * 1000

// Parametros do scrypt fixados no codigo: sem isso o custo depende do padrao do
// Node e um upgrade silencioso mudaria o tempo de verificacao. O formato do
// hash guarda os valores usados, entao hashes antigos continuam validos.
const SCRYPT_PARAMS = Object.freeze({
  N: 16384,
  r: 8,
  p: 1,
  keylen: 64,
  maxmem: 64 * 1024 * 1024,
})

const HASH_PREFIX = 'scrypt'

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const { N, r, p, keylen, maxmem } = SCRYPT_PARAMS
  const hash = await scrypt(password, salt, keylen, { N, r, p, maxmem })
  return `${HASH_PREFIX}$${N}$${r}$${p}$${salt}$${hash.toString('hex')}`
}

function parseStoredHash(storedHash) {
  if (typeof storedHash !== 'string') return null

  if (storedHash.startsWith(`${HASH_PREFIX}$`)) {
    const [prefix, N, r, p, salt, hash] = storedHash.split('$')
    if (prefix !== HASH_PREFIX || !N || !r || !p || !salt || !hash) return null
    return {
      scheme: HASH_PREFIX,
      params: { N: Number(N), r: Number(r), p: Number(p) },
      salt,
      hash,
    }
  }

  // Formato anterior, sem os parametros: salt:hash com o padrao do Node.
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return null
  return { scheme: 'legacy', params: null, salt, hash }
}

export async function verifyPassword(password, storedHash) {
  const parsed = parseStoredHash(storedHash)
  if (!parsed) return false

  const expected = Buffer.from(parsed.hash, 'hex')
  if (expected.length === 0) return false

  const actual = parsed.params
    ? await scrypt(password, parsed.salt, expected.length, {
      N: parsed.params.N,
      r: parsed.params.r,
      p: parsed.params.p,
      maxmem: SCRYPT_PARAMS.maxmem,
    })
    : await scrypt(password, parsed.salt, expected.length)

  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

// Hashes antigos ou com parametros diferentes do atual devem ser refeitos no
// proximo login, sem exigir troca de senha pelo usuario.
export function passwordNeedsRehash(storedHash) {
  const parsed = parseStoredHash(storedHash)
  if (!parsed || parsed.scheme !== HASH_PREFIX) return true

  return (
    parsed.params.N !== SCRYPT_PARAMS.N
    || parsed.params.r !== SCRYPT_PARAMS.r
    || parsed.params.p !== SCRYPT_PARAMS.p
    || Buffer.from(parsed.hash, 'hex').length !== SCRYPT_PARAMS.keylen
  )
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
