import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import cookieParser from 'cookie-parser'
import express from 'express'
import { ipKeyGenerator, rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import { z, ZodError } from 'zod'
import {
  appOrigin,
  authRateLimit,
  host,
  jsonBodyLimit,
  port,
  rsvpRateLimit,
  trustProxy,
} from './config.js'
import { getDatabase } from './db.js'
import {
  clearSessionCookie,
  createSessionToken,
  getDummyPasswordHash,
  hashPassword,
  hashSessionToken,
  sessionCookieName,
  sessionDurationMs,
  setSessionCookie,
  verifyPassword,
  isAllowedOrigin,
} from './security.js'

const app = express()

app.disable('x-powered-by')
// Sem trust proxy, o rate limit enxerga o IP do proxy reverso e o limite vira
// global. O numero de proxies vem de TRUST_PROXY (0 = nenhum, 1 = nginx).
app.set('trust proxy', trustProxy)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Permite imagens de produtos hospedadas em domínios externos (imagem_url)
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
)
app.use(express.json({ limit: jsonBodyLimit }))
app.use(cookieParser())

app.use('/api', (request, response, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next()

  if (!isAllowedOrigin(request, appOrigin)) {
    return response.status(403).json({ message: 'Origem da solicitacao nao permitida.' })
  }

  return next()
})

// Login e cadastro tem contadores separados: um Shared, o mesmo limite valia
// para as duas rotas e um atacante travava os cadastros so de tentar login.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: authRateLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
})

// Limita por e-mail para impedir que varias senhas sejam testadas contra a
// mesma conta, mesmo vindo de origens diferentes.
const loginByEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_EMAIL_RATE_LIMIT) || authRateLimit * 2,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (request) => {
    const email = String(request.body?.email ?? '').toLowerCase()
    return email ? `${ipKeyGenerator(request.ip)}:${email}` : ipKeyGenerator(request.ip)
  },
  message: { message: 'Muitas tentativas para este e-mail. Aguarde alguns minutos.' },
})

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: authRateLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
})

const rsvpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: rsvpRateLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Muitas tentativas de confirmacao. Aguarde alguns minutos.' },
})

const registerSchema = z.object({
  nome: z.string().trim()
    .min(3, 'Informe um nome com pelo menos 3 caracteres.')
    .max(100, 'O nome pode ter no maximo 100 caracteres.'),
  email: z.string().trim()
    .email('Informe um e-mail valido, como nome@dominio.com.')
    .max(254, 'O e-mail pode ter no maximo 254 caracteres.')
    .transform((email) => email.toLowerCase()),
  senha: z.string()
    .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
    .max(128, 'A senha pode ter no maximo 128 caracteres.'),
  tipo_perfil: z.enum(['cliente', 'fornecedor'], {
    error: 'Selecione cliente ou fornecedor.',
  }),
})

const invitationSchema = z.object({
  titulo: z.string().trim().min(3).max(100),
  anfitriao: z.string().trim().min(2).max(100),
  data_evento: z.string().datetime({ offset: true }).refine(
    (value) => new Date(value).getTime() > Date.now(),
    'A data do evento precisa estar no futuro.',
  ),
  local_evento: z.string().trim().min(3).max(180),
  mensagem: z.string().trim().max(500).optional().transform((value) => value || null),
  tema: z.enum(['jardim', 'colorido', 'ceu-estrelado']),
})

const rsvpSchema = z.object({
  nome: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  resposta: z.enum(['confirmado', 'recusado', 'talvez']),
  quantidade_pessoas: z.number().int().min(1).max(10),
  mensagem: z.string().trim().max(300).optional().transform((value) => value || null),
})

const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  senha: z.string().min(1).max(128),
})

app.post('/api/invitations', requireUser, async (request, response, next) => {
  try {
    if (request.user.tipo_perfil !== 'cliente') {
      return response.status(403).json({ message: 'Somente clientes podem criar convites.' })
    }

    const input = invitationSchema.parse(request.body)
    const slug = randomBytes(24).toString('base64url')
    const sql = getDatabase()
    const [invitation] = await sql`
      insert into public.convites (
        dono_id, slug, titulo, anfitriao, data_evento, local_evento, mensagem, tema
      ) values (
        ${request.user.id}, ${slug}, ${input.titulo}, ${input.anfitriao},
        ${input.data_evento}, ${input.local_evento}, ${input.mensagem}, ${input.tema}
      )
      returning id, slug, titulo, anfitriao, data_evento, local_evento, mensagem, tema, aceita_rsvp, created_at
    `

    response.status(201).json({ invitation })
  } catch (error) {
    return next(error)
  }
})

app.get('/api/invitations/mine', requireUser, async (request, response, next) => {
  try {
    if (request.user.tipo_perfil !== 'cliente') {
      return response.status(403).json({ message: 'Este perfil nao pode consultar convites.' })
    }

    const sql = getDatabase()
    const invitations = await sql`
      select
        c.id,
        c.slug,
        c.titulo,
        c.anfitriao,
        c.data_evento,
        c.local_evento,
        c.mensagem,
        c.tema,
        c.aceita_rsvp,
        c.created_at,
        coalesce(
          json_agg(json_build_object(
            'nome', r.nome,
            'email', r.email,
            'resposta', r.resposta,
            'quantidade_pessoas', r.quantidade_pessoas,
            'mensagem', r.mensagem,
            'updated_at', r.updated_at
          )) filter (where r.id is not null),
          '[]'::json
        ) as confirmacoes
      from public.convites c
      left join public.confirmacoes_presenca r on r.convite_id = c.id
      where c.dono_id = ${request.user.id}
      group by c.id
      order by c.data_evento desc
      limit 100
    `

    response.json({ invitations })
  } catch (error) {
    return next(error)
  }
})

app.patch('/api/invitations/:id/rsvp-status', requireUser, async (request, response, next) => {
  try {
    if (request.user.tipo_perfil !== 'cliente') {
      return response.status(403).json({ message: 'Somente clientes podem gerenciar convites.' })
    }

    const invitationId = z.string().uuid('Identificador de convite inválido.').parse(request.params.id)
    const rsvpStatusSchema = z.object({
      aceita_rsvp: z.boolean({ required_error: 'Informe o estado de aceitação de confirmação.' }),
    })
    const input = rsvpStatusSchema.parse(request.body)
    const sql = getDatabase()

    const [updated] = await sql`
      update public.convites
      set aceita_rsvp = ${input.aceita_rsvp}
      where id = ${invitationId} and dono_id = ${request.user.id}
      returning id, slug, titulo, aceita_rsvp
    `

    if (!updated) {
      return response.status(404).json({ message: 'Convite não encontrado ou você não tem permissão para editá-lo.' })
    }

    const message = input.aceita_rsvp
      ? 'Confirmações de presença reabertas com sucesso.'
      : 'Confirmações de presença encerradas com sucesso.'

    response.json({ message, invitation: updated })
  } catch (error) {
    return next(error)
  }
})

app.patch('/api/invitations/:id', requireUser, async (request, response, next) => {
  try {
    if (request.user.tipo_perfil !== 'cliente') {
      return response.status(403).json({ message: 'Somente clientes podem gerenciar convites.' })
    }

    const invitationId = z.string().uuid('Identificador de convite inválido.').parse(request.params.id)
    const input = invitationUpdateSchema.parse(request.body)
    const { assignments, values } = buildUpdate(
      ['titulo', 'anfitriao', 'data_evento', 'local_evento', 'mensagem', 'tema'],
      input,
    )
    const sql = getDatabase()

    const [updated] = await sql.query(
      `update public.convites
       set ${assignments.join(', ')}
       where id = $${values.length + 1} and dono_id = $${values.length + 2}
       returning id, slug, titulo, anfitriao, data_evento, local_evento, mensagem, tema, aceita_rsvp`,
      [...values, invitationId, request.user.id],
    )

    if (!updated) {
      return response.status(404).json({ message: 'Convite não encontrado ou você não tem permissão para editá-lo.' })
    }

    response.json({ message: 'Convite atualizado com sucesso.', invitation: updated })
  } catch (error) {
    return next(error)
  }
})

app.delete('/api/invitations/:id', requireUser, async (request, response, next) => {
  try {
    if (request.user.tipo_perfil !== 'cliente') {
      return response.status(403).json({ message: 'Somente clientes podem gerenciar convites.' })
    }

    const invitationId = z.string().uuid('Identificador de convite inválido.').parse(request.params.id)
    const sql = getDatabase()

    const [deleted] = await sql`
      delete from public.convites
      where id = ${invitationId} and dono_id = ${request.user.id}
      returning id, titulo
    `

    if (!deleted) {
      return response.status(404).json({ message: 'Convite não encontrado ou você não tem permissão para excluí-lo.' })
    }

    response.json({ message: `O convite "${deleted.titulo}" foi excluído.` })
  } catch (error) {
    return next(error)
  }
})

app.get('/api/invitations/:slug', async (request, response, next) => {
  try {
    const sql = getDatabase()
    const [invitation] = await sql`
      select id, slug, titulo, anfitriao, data_evento, local_evento, mensagem, tema, aceita_rsvp
      from public.convites
      where slug = ${request.params.slug}
      limit 1
    `

    if (!invitation) return response.status(404).json({ message: 'Convite nao encontrado.' })

    const [summary] = await sql`
      select
        (count(*) filter (where resposta = 'confirmado'))::int as confirmados,
        (coalesce(sum(quantidade_pessoas) filter (where resposta = 'confirmado'), 0))::int as pessoas_confirmadas,
        (count(*) filter (where resposta = 'talvez'))::int as talvez,
        (count(*) filter (where resposta = 'recusado'))::int as recusados
      from public.confirmacoes_presenca
      where convite_id = ${invitation.id}
    `

    response.set('Cache-Control', 'no-store')
    response.json({ invitation, summary })
  } catch (error) {
    return next(error)
  }
})

app.post('/api/invitations/:slug/rsvp', rsvpLimiter, async (request, response, next) => {
  try {
    const input = rsvpSchema.parse(request.body)
    const sql = getDatabase()
    const [invitation] = await sql`
      select id, aceita_rsvp
      from public.convites
      where slug = ${request.params.slug}
      limit 1
    `

    if (!invitation) return response.status(404).json({ message: 'Convite nao encontrado.' })
    if (!invitation.aceita_rsvp) {
      return response.status(409).json({ message: 'As confirmacoes para este convite foram encerradas.' })
    }

    await sql`
      insert into public.confirmacoes_presenca (
        convite_id, nome, email, resposta, quantidade_pessoas, mensagem
      ) values (
        ${invitation.id}, ${input.nome}, ${input.email}, ${input.resposta},
        ${input.quantidade_pessoas}, ${input.mensagem}
      )
      on conflict (convite_id, email) do update set
        nome = excluded.nome,
        resposta = excluded.resposta,
        quantidade_pessoas = excluded.quantidade_pessoas,
        mensagem = excluded.mensagem,
        updated_at = now()
    `

    const [summary] = await sql`
      select
        (count(*) filter (where resposta = 'confirmado'))::int as confirmados,
        (coalesce(sum(quantidade_pessoas) filter (where resposta = 'confirmado'), 0))::int as pessoas_confirmadas,
        (count(*) filter (where resposta = 'talvez'))::int as talvez,
        (count(*) filter (where resposta = 'recusado'))::int as recusados
      from public.confirmacoes_presenca
      where convite_id = ${invitation.id}
    `

    response.status(200).json({ message: 'Resposta registrada.', summary })
  } catch (error) {
    return next(error)
  }
})
// Imagens de produto ficam em servidores externos: só https é aceito, para
// não misturar http com https na página e não vazar tráfego em claro.
const httpsUrl = z.string().trim()
  .url('Informe um link valido.')
  .max(2048)
  .refine((value) => new URL(value).protocol === 'https:', {
    message: 'O link da imagem precisa usar https.',
  })

const productSchema = z.object({
  nome: z.string().trim().min(3).max(120),
  categoria: z.enum(['bolos', 'doces', 'brinquedos', 'convites']),
  descricao: z.string().trim().min(10).max(1000),
  preco: z.coerce.number().finite().positive().max(99999999),
  cidade: z.string().trim().max(100).optional().transform((value) => value || null),
  imagem_url: z.union([z.literal(''), httpsUrl])
    .optional()
    .transform((value) => value || null),
})

const productUpdateSchema = productSchema.partial().refine(
  (value) => Object.values(value).some((field) => field !== undefined),
  { message: 'Informe ao menos um campo para atualizar o produto.' },
)

const invitationUpdateSchema = z.object({
  titulo: z.string().trim().min(3).max(100).optional(),
  anfitriao: z.string().trim().min(2).max(100).optional(),
  data_evento: z.string().datetime({ offset: true }).refine(
    (value) => new Date(value).getTime() > Date.now(),
    'A data do evento precisa estar no futuro.',
  ).optional(),
  local_evento: z.string().trim().min(3).max(180).optional(),
  mensagem: z.string().trim().max(500).optional().transform((value) => value || null),
  tema: z.enum(['jardim', 'colorido', 'ceu-estrelado']).optional(),
}).refine(
  (value) => Object.values(value).some((field) => field !== undefined),
  { message: 'Informe ao menos um campo para atualizar o convite.' },
)

const orderSchema = z.object({
  items: z.array(z.object({
    produto_id: z.string().uuid(),
    quantidade: z.number().int().min(1).max(20),
  })).min(1).max(50),
  observacao: z.string().trim().max(500).optional().transform((value) => value || null),
})

function sendProfile(profile) {
  return {
    id: profile.id,
    nome: profile.nome,
    email: profile.email,
    tipo_perfil: profile.tipo_perfil,
  }
}

// Monta o trecho SET de uma atualizacao parcial. Os nomes das colunas vem de
// uma lista fixa e os valores sao sempre parametrizados.
function buildUpdate(fields, input) {
  const assignments = []
  const values = []

  for (const field of fields) {
    if (input[field] === undefined) continue
    assignments.push(`${field} = $${values.length + 1}`)
    values.push(input[field])
  }

  return { assignments, values }
}

const clientOrderSelect = `
  select
    o.id,
    o.status,
    o.total_estimado,
    o.observacao,
    o.created_at,
    coalesce(
      json_agg(json_build_object(
        'id', i.id,
        'produto_id', i.produto_id,
        'nome', i.nome_produto,
        'categoria', i.categoria,
        'preco_unitario', i.preco_unitario,
        'quantidade', i.quantidade,
        'subtotal', i.subtotal
      )) filter (where i.id is not null),
      '[]'::json
    ) as itens
  from public.pedidos o
  left join public.itens_pedido i on i.pedido_id = o.id
`

async function findClientOrderById(orderId) {
  const sql = getDatabase()
  const rows = await sql.query(
    `${clientOrderSelect} where o.id = $1 group by o.id`,
    [orderId],
  )

  return rows[0] ?? null
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

app.post('/api/auth/register', registerLimiter, async (request, response, next) => {
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

app.post('/api/auth/login', loginLimiter, loginByEmailLimiter, async (request, response, next) => {
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

app.get('/api/supplier/products', requireUser, async (request, response, next) => {
  try {
    if (request.user.tipo_perfil !== 'fornecedor') {
      return response.status(403).json({ message: 'Apenas fornecedores podem consultar esta lista.' })
    }

    const sql = getDatabase()
    const products = await sql`
      select id, nome, categoria, descricao, preco, cidade, imagem_url, ativo, created_at
      from public.produtos
      where fornecedor_id = ${request.user.id}
      order by created_at desc
    `

    response.json({ products })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/supplier/products/:id/toggle-active', requireUser, async (request, response, next) => {
  try {
    if (request.user.tipo_perfil !== 'fornecedor') {
      return response.status(403).json({ message: 'Apenas fornecedores podem alterar produtos.' })
    }

    const productId = z.string().uuid('Identificador do produto inválido.').parse(request.params.id)
    const sql = getDatabase()

    const [product] = await sql`
      update public.produtos
      set ativo = not ativo
      where id = ${productId} and fornecedor_id = ${request.user.id}
      returning id, nome, ativo
    `

    if (!product) {
      return response.status(404).json({ message: 'Produto não encontrado ou permissão negada.' })
    }

    const message = product.ativo
      ? `O produto "${product.nome}" foi ativado na vitrine.`
      : `O produto "${product.nome}" foi pausado.`

    response.json({ message, product })
  } catch (error) {
    next(error)
  }
})

app.get('/api/orders', requireUser, async (request, response, next) => {
  try {
    const sql = getDatabase()

    if (request.user.tipo_perfil === 'cliente') {
      const orders = await sql.query(
        `${clientOrderSelect} where o.cliente_id = $1 group by o.id order by o.created_at desc limit 100`,
        [request.user.id],
      )

      return response.json({ orders })
    }

    if (request.user.tipo_perfil === 'fornecedor') {
      const orders = await sql`
        select
          o.id,
          o.status,
          o.observacao,
          o.created_at,
          c.nome as cliente_nome,
          c.email as cliente_email,
          sum(i.subtotal) as total_fornecedor,
          json_agg(json_build_object(
            'id', i.id,
            'nome', i.nome_produto,
            'categoria', i.categoria,
            'preco_unitario', i.preco_unitario,
            'quantidade', i.quantidade,
            'subtotal', i.subtotal
          )) as itens
        from public.pedidos o
        join public.perfis c on c.id = o.cliente_id
        join public.itens_pedido i on i.pedido_id = o.id
        where i.fornecedor_id = ${request.user.id}
        group by o.id, c.nome, c.email
        order by o.created_at desc
        limit 100
      `

      return response.json({ orders })
    }

    return response.status(403).json({ message: 'Este perfil nao pode consultar pedidos.' })
  } catch (error) {
    return next(error)
  }
})

app.post('/api/orders', requireUser, async (request, response, next) => {
  try {
    if (request.user.tipo_perfil !== 'cliente') {
      return response.status(403).json({ message: 'Somente clientes podem solicitar orcamentos.' })
    }

    const input = orderSchema.parse(request.body)
    const quantities = new Map()
    for (const item of input.items) {
      const quantity = (quantities.get(item.produto_id) ?? 0) + item.quantidade
      if (quantity > 20) {
        return response.status(400).json({ message: 'O limite e de 20 unidades por produto.' })
      }
      quantities.set(item.produto_id, quantity)
    }

    const productIds = [...quantities.keys()]
    const placeholders = productIds.map((_, index) => `$${index + 1}::uuid`).join(', ')
    const sql = getDatabase()
    const products = await sql.query(
      `select id, fornecedor_id, nome, categoria, preco from public.produtos where ativo = true and id in (${placeholders})`,
      productIds,
    )

    if (products.length !== productIds.length) {
      return response.status(400).json({ message: 'Um ou mais produtos nao estao mais disponiveis.' })
    }

    const productsById = new Map(products.map((product) => [product.id, product]))
    const orderItems = productIds.map((productId) => {
      const product = productsById.get(productId)
      const quantity = quantities.get(productId)
      const unitPriceCents = Math.round(Number(product.preco) * 100)
      const subtotalCents = unitPriceCents * quantity

      return {
        product,
        quantity,
        unitPrice: (unitPriceCents / 100).toFixed(2),
        subtotal: (subtotalCents / 100).toFixed(2),
        subtotalCents,
      }
    })
    const totalCents = orderItems.reduce((total, item) => total + item.subtotalCents, 0)
    const total = (totalCents / 100).toFixed(2)
    const orderId = randomUUID()
    const statements = [
      sql`
        insert into public.pedidos (id, cliente_id, total_estimado, observacao)
        values (${orderId}, ${request.user.id}, ${total}, ${input.observacao})
        returning id
      `,
    ]

    statements.push(...orderItems.map(({ product, quantity, unitPrice, subtotal }) => sql`
      insert into public.itens_pedido (
        pedido_id, produto_id, fornecedor_id, nome_produto, categoria,
        preco_unitario, quantidade, subtotal
      ) values (
        ${orderId},
        ${product.id}, ${product.fornecedor_id}, ${product.nome}, ${product.categoria},
        ${unitPrice}, ${quantity}, ${subtotal}
      )
    `))

    await sql.transaction(statements)

    const order = await findClientOrderById(orderId)

    if (!order) {
      return response.status(500).json({ message: 'O pedido foi criado, mas não pôde ser carregado. Atualize a página.' })
    }

    response.status(201).json({ order })
  } catch (error) {
    return next(error)
  }
})

const updateOrderStatusSchema = z.object({
  status: z.enum(['solicitado', 'em_negociacao', 'confirmado', 'recusado', 'cancelado', 'concluido'], {
    errorMap: () => ({ message: 'Status do pedido inválido.' }),
  }),
})

app.get('/api/supplier/products/:id', requireUser, async (request, response, next) => {
  try {
    if (request.user.tipo_perfil !== 'fornecedor') {
      return response.status(403).json({ message: 'Apenas fornecedores podem consultar esta lista.' })
    }

    const productId = z.string().uuid('Identificador do produto inválido.').parse(request.params.id)
    const sql = getDatabase()
    const [product] = await sql`
      select id, nome, categoria, descricao, preco, cidade, imagem_url, ativo, created_at
      from public.produtos
      where id = ${productId} and fornecedor_id = ${request.user.id}
      limit 1
    `

    if (!product) {
      return response.status(404).json({ message: 'Produto não encontrado ou permissão negada.' })
    }

    response.json({ product })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/supplier/products/:id', requireUser, async (request, response, next) => {
  try {
    if (request.user.tipo_perfil !== 'fornecedor') {
      return response.status(403).json({ message: 'Apenas fornecedores podem alterar produtos.' })
    }

    const productId = z.string().uuid('Identificador do produto inválido.').parse(request.params.id)
    const input = productUpdateSchema.parse(request.body)
    const { assignments, values } = buildUpdate(
      ['nome', 'categoria', 'descricao', 'preco', 'cidade', 'imagem_url'],
      input,
    )

    const sql = getDatabase()
    const [product] = await sql.query(
      `update public.produtos
       set ${assignments.join(', ')}
       where id = $${values.length + 1} and fornecedor_id = $${values.length + 2}
       returning id, nome, categoria, descricao, preco, cidade, imagem_url, ativo, created_at`,
      [...values, productId, request.user.id],
    )

    if (!product) {
      return response.status(404).json({ message: 'Produto não encontrado ou permissão negada.' })
    }

    response.json({ message: 'Produto atualizado com sucesso.', product })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/supplier/products/:id', requireUser, async (request, response, next) => {
  try {
    if (request.user.tipo_perfil !== 'fornecedor') {
      return response.status(403).json({ message: 'Apenas fornecedores podem excluir produtos.' })
    }

    const productId = z.string().uuid('Identificador do produto inválido.').parse(request.params.id)
    const sql = getDatabase()
    const [product] = await sql`
      delete from public.produtos
      where id = ${productId} and fornecedor_id = ${request.user.id}
      returning id, nome
    `

    if (!product) {
      return response.status(404).json({ message: 'Produto não encontrado ou permissão negada.' })
    }

    response.json({ message: `O produto "${product.nome}" foi excluído do catálogo.` })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/orders/:id/status', requireUser, async (request, response, next) => {
  try {
    const orderId = z.string().uuid('Identificador do pedido inválido.').parse(request.params.id)
    const input = updateOrderStatusSchema.parse(request.body)
    const sql = getDatabase()

    const [order] = await sql`
      select id, cliente_id, status
      from public.pedidos
      where id = ${orderId}
      limit 1
    `

    if (!order) {
      return response.status(404).json({ message: 'Pedido não encontrado.' })
    }

    if (request.user.tipo_perfil === 'cliente') {
      if (order.cliente_id !== request.user.id) {
        return response.status(403).json({ message: 'Você não tem permissão para alterar este pedido.' })
      }

      if (input.status === 'cancelado') {
        if (!['solicitado', 'em_negociacao'].includes(order.status)) {
          return response.status(400).json({ message: 'Apenas pedidos pendentes ou em negociação podem ser cancelados.' })
        }
      } else if (input.status === 'concluido') {
        if (order.status !== 'confirmado') {
          return response.status(400).json({ message: 'Apenas pedidos confirmados podem ser marcados como concluídos.' })
        }
      } else {
        return response.status(403).json({ message: 'Clientes só podem cancelar ou concluir seus pedidos.' })
      }
    } else if (request.user.tipo_perfil === 'fornecedor') {
      const [supplierItem] = await sql`
        select 1
        from public.itens_pedido
        where pedido_id = ${order.id} and fornecedor_id = ${request.user.id}
        limit 1
      `

      if (!supplierItem) {
        return response.status(403).json({ message: 'Você não possui produtos vinculados a este pedido.' })
      }

      const allowedForSupplier = ['em_negociacao', 'confirmado', 'recusado']
      if (!allowedForSupplier.includes(input.status)) {
        return response.status(400).json({ message: 'Status inválido para fornecedor.' })
      }

      if (!['solicitado', 'em_negociacao'].includes(order.status)) {
        return response.status(400).json({ message: 'Este pedido não pode mais ter o status alterado pelo fornecedor.' })
      }
    } else {
      return response.status(403).json({ message: 'Perfil não autorizado.' })
    }

    const [updatedOrder] = await sql`
      update public.pedidos
      set status = ${input.status}
      where id = ${order.id}
      returning id, status
    `

    response.json({
      message: 'Status do pedido atualizado com sucesso.',
      order: updatedOrder,
    })
  } catch (error) {
    next(error)
  }
})

app.use('/api', (request, response) => {
  response.status(404).json({ message: 'Endpoint nao encontrado.' })
})

const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')

if (existsSync(distDir)) {
  app.use(express.static(distDir))

  app.use((request, response, next) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') return next()
    if (request.path.startsWith('/api')) return next()

    response.sendFile(join(distDir, 'index.html'))
  })
}

// Erros conhecidos do parser de corpo: são falhas do cliente e não devem
// virar 500 genérico.
const bodyParserErrors = {
  'entity.parse.failed': { status: 400, message: 'Corpo da requisicao invalido: o JSON nao pode ser lido.' },
  'entity.verify.failed': { status: 400, message: 'Corpo da requisicao invalido.' },
  'entity.too.large': { status: 413, message: `Corpo da requisicao muito grande: o limite e de ${jsonBodyLimit}.` },
  'parameters.too.many': { status: 413, message: 'Parametros demais na requisicao.' },
  'charset.unsupported': { status: 415, message: 'Codificacao de caracteres nao suportada.' },
  'encoding.unsupported': { status: 415, message: 'Codificacao de caracteres nao suportada.' },
}

app.use((error, _request, response, _next) => {
  if (error instanceof ZodError) {
    const issue = error.issues[0]
    return response.status(400).json({
      message: issue?.message || 'Confira os dados enviados.',
      field: issue?.path[0] ?? null,
    })
  }

  const knownBodyError = bodyParserErrors[error?.type]
  if (knownBodyError) {
    return response.status(knownBodyError.status).json({ message: knownBodyError.message })
  }

  if (error?.message?.startsWith('DATABASE_URL')) {
    return response.status(503).json({ message: error.message })
  }

  // Demais erros 4xx carregam o proprio status e nao revelam detalhes internos.
  const status = Number(error?.status ?? error?.statusCode)
  if (Number.isInteger(status) && status >= 400 && status < 500) {
    return response.status(status).json({ message: 'Requisicao invalida.' })
  }

  console.error(error)
  return response.status(500).json({ message: 'Erro interno. Tente novamente.' })
})

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectRun) {
  app.listen(port, host, () => {
    console.log(`Festou API listening on http://${host}:${port}`)
  })
}

export { app }