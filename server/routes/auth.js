import { Router } from 'express'
import { getDatabase } from '../db.js'
import {
  hashPassword,
  passwordNeedsRehash,
  verifyPassword,
  getDummyPasswordHash,
} from '../security.js'
import { clearSessionCookie, hashSessionToken, sessionCookieName } from '../security.js'
import { findSession, sendProfile, startSession } from '../middleware/session.js'
import { OAuth2Client } from 'google-auth-library'
import {
  googleLimiter,
  loginByEmailLimiter,
  loginLimiter,
  registerLimiter,
} from '../middleware/rateLimits.js'
import { loginSchema, registerSchema } from '../schemas/auth.js'

export const authRouter = Router()

authRouter.post('/register', registerLimiter, async (request, response, next) => {
  try {
    const input = registerSchema.parse(request.body)
    const passwordHash = await hashPassword(input.senha)
    const sql = getDatabase()
    const [profile] = await sql`
      insert into public.perfis (nome, email, senha_hash, tipo_perfil)
      values (${input.nome}, ${input.email}, ${passwordHash}, ${input.tipo_perfil})
      returning id, nome, email, tipo_perfil
    `

    const user = await startSession(profile, response)
    response.status(201).json({ user })
  } catch (error) {
    if (error?.code === '23505') {
      return response.status(409).json({ message: 'Este e-mail ja esta cadastrado.' })
    }
    next(error)
  }
})

authRouter.post('/login', loginLimiter, loginByEmailLimiter, async (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body)
    const sql = getDatabase()
    const [profile] = await sql`
      select id, nome, email, tipo_perfil, senha_hash
      from public.perfis
      where email = ${input.email}
      limit 1
    `

    if (!profile) {
      // Compara com um hash ficticio para manter o tempo de resposta igual ao
      // de um e-mail existente e nao permitir enumeracao de contas.
      await verifyPassword(input.senha, await getDummyPasswordHash())
      return response.status(401).json({ message: 'E-mail ou senha invalidos.' })
    }

    if (!(await verifyPassword(input.senha, profile.senha_hash))) {
      return response.status(401).json({ message: 'E-mail ou senha invalidos.' })
    }

    // Hash antigo ou com parametros fora do padrao atual e refeito agora, sem
    // pedir nada ao usuario.
    if (passwordNeedsRehash(profile.senha_hash)) {
      const novoSenhaHash = await hashPassword(input.senha)
      await sql`
        update public.perfis
        set senha_hash = ${novoSenhaHash}
        where id = ${profile.id}
      `
    }

    const user = await startSession(profile, response)
    response.json({ user })
  } catch (error) {
    next(error)
  }
})

authRouter.get('/me', async (request, response, next) => {
  try {
    const profile = await findSession(request)
    response.json({ user: profile ? sendProfile(profile) : null })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/logout', async (request, response, next) => {
  try {
    const token = request.cookies[sessionCookieName]
    if (token) {
      const sql = getDatabase()
      const tokenHash = hashSessionToken(token)
      await sql`delete from public.sessoes where token_hash = ${tokenHash}`
    }

    clearSessionCookie(response)
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})


authRouter.post('/google', googleLimiter, async (request, response, next) => {
  try {
    const idToken = request.body?.id_token
    const tipoPerfil = request.body?.tipo_perfil

    if (!idToken) {
      return response.status(400).json({ message: 'Token do Google ausente.' })
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      return response.status(500).json({ message: 'Login com Google nao configurado no servidor.' })
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    if (!payload?.email) {
      return response.status(401).json({ message: 'Token do Google invalido.' })
    }

    const email = payload.email.toLowerCase()
    const nome = payload.name || email.split('@')[0]
    const sql = getDatabase()

    const [existing] = await sql`
      select id, nome, email, tipo_perfil
      from public.perfis
      where lower(email) = ${email}
      limit 1
    `

    if (existing) {
      const user = await startSession(existing, response)
      return response.json({ user })
    }

    if (tipoPerfil !== 'cliente' && tipoPerfil !== 'fornecedor') {
      return response.status(409).json({
        message: 'Escolha se a conta e de cliente ou fornecedor.',
        precisa_perfil: true,
      })
    }

    const [profile] = await sql`
      insert into public.perfis (nome, email, senha_hash, tipo_perfil)
      values (${nome}, ${email}, ${await getDummyPasswordHash()}, ${tipoPerfil})
      returning id, nome, email, tipo_perfil
    `

    const user = await startSession(profile, response)
    return response.status(201).json({ user })
  } catch (error) {
    console.error('Erro ao autenticar com Google:', error?.message ?? error)
    return response.status(401).json({ message: 'Nao foi possivel entrar com o Google.' })
  }
})
