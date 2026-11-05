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
    avatar_url: profile.avatar_url ?? null,
    cover_url: profile.cover_url ?? null,
    whatsapp: profile.whatsapp ?? null,
    biografia: profile.biografia ?? null,
    instagram_url: profile.instagram_url ?? null,
    facebook_url: profile.facebook_url ?? null,
    site_url: profile.site_url ?? null,
    telefone: profile.telefone ?? null,
    cidade: profile.cidade ?? null,
    segmento: profile.segmento ?? null,
    perfil_confirmado: profile.email_verified === true,
    perfil_completo: isProfileComplete(profile),
  }
}

export async function startSession(profile, response) {
  if (profile.email_verified === false) {
    throw new Error('A conta precisa confirmar o e-mail antes de iniciar uma sessao.')
  }

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
    select p.id, p.nome, p.email, p.tipo_perfil, p.avatar_url, p.cover_url,
           p.whatsapp, p.biografia, p.instagram_url, p.facebook_url, p.site_url,
           p.telefone, p.cidade, p.segmento, p.email_verified
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

export function isProfileComplete(profile) {
  const hasName = typeof profile.nome === 'string' && profile.nome.trim().length >= 3
  const confirmed = profile.email_verified === true
  if (!hasName || !confirmed) return false

  if (profile.tipo_perfil === 'fornecedor') {
    const phone = profile.telefone || profile.whatsapp
    return Boolean(
      phone && profile.cidade && profile.segmento &&
      typeof profile.biografia === 'string' && profile.biografia.trim().length >= 10
    )
  }

  if (profile.tipo_perfil === 'cliente') {
    return Boolean((profile.telefone || profile.whatsapp) && profile.cidade)
  }

  return false
}
