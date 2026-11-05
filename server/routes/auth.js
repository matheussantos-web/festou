import { Router } from 'express'
import { getDatabase } from '../db.js'
import {
  hashPassword,
  passwordNeedsRehash,
  verifyPassword,
  getDummyPasswordHash,
} from '../security.js'
import { clearSessionCookie, createSessionToken, hashSessionToken, sessionCookieName } from '../security.js'
import { findSession, sendProfile, startSession } from '../middleware/session.js'
import { OAuth2Client } from 'google-auth-library'
import {
  googleLimiter,
  loginByEmailLimiter,
  loginLimiter,
  registerLimiter,
} from '../middleware/rateLimits.js'
import { loginSchema, registerSchema } from '../schemas/auth.js'
import { resolveGoogleLogin } from '../googleAccount.js'
import { sendMail } from '../mailer.js'
import { appOrigin, emailVerificationTtlMs } from '../config.js'

export const authRouter = Router()

authRouter.post('/register', registerLimiter, async (request, response, next) => {
  try {
    const input = registerSchema.parse(request.body)
    const passwordHash = await hashPassword(input.senha)
    const sql = getDatabase()
    const [profile] = await sql`
      insert into public.perfis (nome, email, senha_hash, tipo_perfil, telefone, cidade, segmento, whatsapp, email_verified)
      values (${input.nome}, ${input.email}, ${passwordHash}, ${input.tipo_perfil}, ${input.telefone}, ${input.cidade}, ${input.segmento}, ${input.tipo_perfil === 'fornecedor' ? input.telefone : null}, false)
      returning id, nome, email, tipo_perfil, avatar_url
    `

    const token = createSessionToken()
    const tokenHash = hashSessionToken(token)
    const expiresAt = new Date(Date.now() + emailVerificationTtlMs)
    await sql`
      update public.perfis
      set email_verification_token_hash = ${tokenHash},
          email_verification_expires_at = ${expiresAt}
      where id = ${profile.id}
    `

    const link = `${appOrigin}/confirmar-email?token=${encodeURIComponent(token)}`
    let emailSent = false
    try {
      const delivery = await sendMail({
        to: profile.email,
        subject: 'Confirme seu e-mail no Festou!',
        text: `Ola, ${profile.nome}!\n\nPara confirmar seu endereco de e-mail e ativar sua conta, acesse: ${link}\n\nO link vale por 24 horas e so pode ser usado uma vez. Se voce nao criou esta conta, ignore esta mensagem.`,
      })
      emailSent = delivery.delivered
    } catch (error) {
      console.error('[confirmacao-email] falha ao enviar o e-mail', error)
    }

    response.status(201).json({
      email: profile.email,
      emailSent,
      message: emailSent
        ? 'Conta criada. Confira seu e-mail para confirmar o cadastro.'
        : 'Conta criada, mas nao foi possivel enviar o e-mail agora. Tente reenviar a confirmacao mais tarde.',
    })
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
      select id, nome, email, tipo_perfil, avatar_url, whatsapp, senha_hash, email_verified
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

    if (input.tipo_perfil && profile.tipo_perfil !== input.tipo_perfil) {
      return response.status(403).json({
        code: 'PERFIL_INCORRETO',
        message: input.tipo_perfil === 'fornecedor'
          ? 'Esta conta é de cliente. Use o painel de cliente para entrar.'
          : 'Esta conta é de fornecedor. Use o painel de fornecedor para entrar.',
      })
    }

    if (!profile.email_verified) {
      return response.status(403).json({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Confirme seu e-mail antes de entrar. Confira sua caixa de entrada ou reenvie o link.',
      })
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
    const nonce = request.body?.nonce
    const tipoPerfil = request.body?.tipo_perfil

    if (!idToken) {
      return response.status(400).json({ message: 'Token do Google ausente.' })
    }
    if (typeof nonce !== 'string' || nonce.length < 16 || nonce.length > 200) {
      return response.status(400).json({ message: 'Recarregue a pagina e tente entrar com o Google novamente.' })
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
    // email_verified evita que um endereco nao confirmado no Google assuma uma
    // conta que ja existe no Festou com o mesmo e-mail.
    if (!payload?.email || payload.email_verified !== true) {
      return response.status(401).json({ message: 'Token do Google invalido.' })
    }
    // O id_token e valido por cerca de 1 hora e pode ser reenviado por quem o
    // interceptar. O nonce gerado no navegador amarra o token a esta tentativa.
    if (payload.nonce !== nonce) {
      return response.status(401).json({ message: 'Sessao do Google expirada. Tente entrar novamente.' })
    }

    const email = payload.email.toLowerCase()
    const nome = payload.name || email.split('@')[0]
    const sql = getDatabase()

    const [existing] = await sql`
      select id, nome, email, tipo_perfil, avatar_url, whatsapp, telefone, cidade, segmento, biografia,
             cover_url, instagram_url, facebook_url, site_url, google_sub, email_verified
      from public.perfis
      where lower(email) = ${email}
      limit 1
    `

    const action = resolveGoogleLogin(existing, payload.sub)

    if (action === 'invalid') {
      return response.status(401).json({ message: 'Token do Google invalido.' })
    }

    if (action === 'link_required') {
      // Conta criada com senha: nao vinculamos automaticamente para impedir que
      // alguem cadastre o e-mail de outra pessoa e espere ela entrar com Google.
      return response.status(409).json({
        code: 'conta_com_senha',
        message: 'Este e-mail ja tem uma conta com senha. Entre com sua senha; se nao lembrar, use "Esqueci minha senha".',
      })
    }

    if (action === 'conflict') {
      return response.status(409).json({
        code: 'google_vinculado',
        message: 'Este e-mail ja esta vinculado a outra conta Google.',
      })
    }

    if (action === 'login') {
      if (tipoPerfil && existing.tipo_perfil !== tipoPerfil) {
        return response.status(403).json({
          code: 'PERFIL_INCORRETO',
          message: tipoPerfil === 'fornecedor'
            ? 'Esta conta é de cliente. Entre pelo painel de cliente.'
            : 'Esta conta é de fornecedor. Entre pelo painel de fornecedor.',
        })
      }
      const user = await startSession(existing, response)
      return response.json({ user, cadastroCompleto: true })
    }

    if (tipoPerfil !== 'cliente' && tipoPerfil !== 'fornecedor') {
      return response.status(409).json({
        code: 'precisa_perfil',
        message: 'Escolha se a conta e de cliente ou fornecedor.',
        precisa_perfil: true,
      })
    }

    // O perfil escolhido do login nao deve ser aplicado na criacao via Google.
    const [profile] = await sql`
      insert into public.perfis (nome, email, senha_hash, tipo_perfil, google_sub, email_verified)
      values (${nome}, ${email}, ${await getDummyPasswordHash()}, ${tipoPerfil}, ${payload.sub}, true)
      returning id, nome, email, tipo_perfil, avatar_url
    `

    const user = await startSession(profile, response)
    return response.status(201).json({ user, cadastroCompleto: false })
  } catch (error) {
    console.error('[auth/google] falha de autenticacao', {
      name: error?.name || 'Error',
      code: error?.code || null,
    })
    return response.status(401).json({ message: 'Nao foi possivel entrar com o Google.' })
  }
})
