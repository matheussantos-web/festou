import {
  clearSessionCookie,
  createSessionToken,
  hashSessionToken,
  sessionCookieName,
  sessionDurationMs,
  setSessionCookie,
} from '../security.js'
import { getDatabase } from '../db.js'

export function sendProfile(profile) {
  return {
    id: profile.id,
    nome: profile.nome,
    email: profile.email,
    tipo_perfil: profile.tipo_perfil,
    whatsapp: profile.whatsapp ?? null,
  }
}

export async function startSession(profile, response) {
  const sql = getDatabase()
  const token = createSessionToken()
  const tokenHash = hashSessionToken(token)
  const expiresAt = new Date(Date.now() + sessionDurationMs)

  await sql`delete from public.sessoes where expires_at <= now()`
  await sql`
    insert into public.sessoes (token_hash, perfil_id, expires_at)
    values (${tokenHash}, ${profile.id}, ${expiresAt})
  `

  setSessionCookie(response, token)
  return sendProfile(profile)
}

export async function findSession(request) {
  const token = request.cookies?.[sessionCookieName]
  if (!token) return null

  const tokenHash = hashSessionToken(token)
  const sql = getDatabase()
  const [profile] = await sql`
    select p.id, p.nome, p.email, p.tipo_perfil, null
    from public.sessoes s
    join public.perfis p on p.id = s.perfil_id
    where s.token_hash = ${tokenHash}
      and s.expires_at > now()
    limit 1
  `

  return profile ?? null
}

export async function requireUser(request, response, next) {
  try {
    const profile = await findSession(request)
    if (!profile) {
      clearSessionCookie(response)
      return response.status(401).json({ message: 'Entre na sua conta para continuar.' })
    }

    request.user = sendProfile(profile)
    request.user.whatsapp = profile.whatsapp ?? null
    return next()
  } catch (error) {
    return next(error)
  }
}
