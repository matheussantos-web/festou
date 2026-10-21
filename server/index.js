import 'dotenv/config'
import cookieParser from 'cookie-parser'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import { z, ZodError } from 'zod'
import { getDatabase } from './db.js'
import {
  clearSessionCookie,
  createSessionToken,
  hashPassword,
  hashSessionToken,
  sessionCookieName,
  sessionDurationMs,
  setSessionCookie,
  verifyPassword,
} from './security.js'

const app = express()
const port = Number(process.env.PORT) || 3000
const appOrigin = process.env.APP_ORIGIN || 'http://127.0.0.1:5173'

app.disable('x-powered-by')
app.use(helmet())
app.use(express.json({ limit: '16kb' }))
app.use(cookieParser())

app.use('/api', (request, response, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next()

  if (request.get('origin') !== appOrigin) {
    return response.status(403).json({ message: 'Origem da solicitacao nao permitida.' })
  }

  return next()
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
})

const registerSchema = z.object({
  nome: z.string().trim().min(3).max(100),
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  senha: z.string().min(8).max(128),
  tipo_perfil: z.enum(['cliente', 'fornecedor']),
})

const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  senha: z.string().min(1).max(128),
})

const productSchema = z.object({
  nome: z.string().trim().min(3).max(120),
  categoria: z.enum(['bolos', 'doces', 'brinquedos', 'convites']),
  descricao: z.string().trim().min(10).max(1000),
  preco: z.coerce.number().finite().positive().max(99999999),
  cidade: z.string().trim().max(100).optional().transform((value) => value || null),
  imagem_url: z.union([z.literal(''), z.string().trim().url().max(2048)])
    .optional()
    .transform((value) => value || null),
})

function sendProfile(profile) {
  return {
    id: profile.id,
    nome: profile.nome,
    email: profile.email,
    tipo_perfil: profile.tipo_perfil,
  }
}

async function startSession(profile, response) {
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

async function findSession(request) {
  const token = request.cookies[sessionCookieName]
  if (!token) return null

  const tokenHash = hashSessionToken(token)
  const sql = getDatabase()
  const [profile] = await sql`
    select p.id, p.nome, p.email, p.tipo_perfil
    from public.sessoes s
    join public.perfis p on p.id = s.perfil_id
    where s.token_hash = ${tokenHash}
      and s.expires_at > now()
    limit 1
  `

  return profile ?? null
}

async function requireUser(request, response, next) {
  try {
    const profile = await findSession(request)
    if (!profile) {
      clearSessionCookie(response)
      return response.status(401).json({ message: 'Entre na sua conta para continuar.' })
    }

    request.user = sendProfile(profile)
    return next()
  } catch (error) {
    return next(error)
  }
}

app.get('/api/health', async (_request, response, next) => {
  try {
    await getDatabase()`select 1`
    response.json({ status: 'ok' })
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/register', authLimiter, async (request, response, next) => {
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

app.post('/api/auth/login', authLimiter, async (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body)
    const sql = getDatabase()
    const [profile] = await sql`
      select id, nome, email, tipo_perfil, senha_hash
      from public.perfis
      where email = ${input.email}
      limit 1
    `

    if (!profile || !(await verifyPassword(input.senha, profile.senha_hash))) {
      return response.status(401).json({ message: 'E-mail ou senha invalidos.' })
    }

    const user = await startSession(profile, response)
    response.json({ user })
  } catch (error) {
    next(error)
  }
})

app.get('/api/auth/me', async (request, response, next) => {
  try {
    const profile = await findSession(request)
    response.json({ user: profile ? sendProfile(profile) : null })
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/logout', async (request, response, next) => {
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

app.get('/api/products', async (request, response, next) => {
  try {
    const category = request.query.categoria
      ? z.enum(['bolos', 'doces', 'brinquedos', 'convites']).parse(request.query.categoria)
      : null
    const sql = getDatabase()
    const products = category
      ? await sql`
        select id, nome, descricao, categoria, preco, cidade, imagem_url, created_at
        from public.produtos
        where ativo = true and categoria = ${category}
        order by created_at desc
      `
      : await sql`
        select id, nome, descricao, categoria, preco, cidade, imagem_url, created_at
        from public.produtos
        where ativo = true
        order by created_at desc
      `

    response.json({ products })
  } catch (error) {
    next(error)
  }
})

app.post('/api/products', requireUser, async (request, response, next) => {
  try {
    if (request.user.tipo_perfil !== 'fornecedor') {
      return response.status(403).json({ message: 'Somente fornecedores podem anunciar produtos.' })
    }

    const input = productSchema.parse(request.body)
    const sql = getDatabase()
    const [product] = await sql`
      insert into public.produtos (
        fornecedor_id, nome, categoria, descricao, preco, cidade, imagem_url
      ) values (
        ${request.user.id}, ${input.nome}, ${input.categoria}, ${input.descricao},
        ${input.preco}, ${input.cidade}, ${input.imagem_url}
      )
      returning id, nome, categoria, descricao, preco, cidade, imagem_url, created_at
    `

    response.status(201).json({ product })
  } catch (error) {
    next(error)
  }
})

app.use((error, _request, response, _next) => {
  if (error instanceof ZodError) {
    return response.status(400).json({ message: 'Confira os dados enviados.' })
  }

  if (error?.message?.startsWith('DATABASE_URL')) {
    return response.status(503).json({ message: error.message })
  }

  console.error(error)
  return response.status(500).json({ message: 'Erro interno. Tente novamente.' })
})

app.listen(port, '127.0.0.1', () => {
  console.log(`Festou API listening on http://127.0.0.1:${port}`)
})