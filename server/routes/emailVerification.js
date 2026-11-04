import { Router } from 'express'
import { getDatabase } from '../db.js'
import { sendMail } from '../mailer.js'
import { appOrigin, emailVerificationTtlMs } from '../config.js'
import { createSessionToken, hashSessionToken } from '../security.js'
import { emailSchema, verifyEmailSchema } from '../schemas/auth.js'
import {
  emailVerificationLimiter,
  resendVerificationLimiter,
  resendVerificationByEmailLimiter,
} from '../middleware/rateLimits.js'

export const emailVerificationRouter = Router()

const resendMessage = 'Se este e-mail estiver cadastrado e precisar de confirmacao, enviaremos um novo link.'

emailVerificationRouter.post('/verify-email', emailVerificationLimiter, async (request, response, next) => {
  try {
    const input = verifyEmailSchema.parse(request.body)
    const tokenHash = hashSessionToken(input.token)
    const sql = getDatabase()
    const [profile] = await sql`
      update public.perfis
      set email_verified = true,
          email_verification_token_hash = null,
          email_verification_expires_at = null
      where email_verification_token_hash = ${tokenHash}
        and email_verified = false
        and email_verification_expires_at > now()
      returning id
    `

    if (!profile) {
      return response.status(400).json({ message: 'Link de confirmacao invalido ou expirado. Solicite um novo.' })
    }

    response.json({ message: 'E-mail confirmado. Agora voce ja pode entrar no Festou!' })
  } catch (error) {
    next(error)
  }
})

emailVerificationRouter.post('/resend-verification', resendVerificationLimiter, resendVerificationByEmailLimiter, async (request, response, next) => {
  try {
    const input = emailSchema.parse(request.body)
    const sql = getDatabase()
    const [profile] = await sql`
      select id, nome, email
      from public.perfis
      where email = ${input.email}
        and email_verified = false
      limit 1
    `

    if (profile) {
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
      try {
        await sendMail({
          to: profile.email,
          subject: 'Confirme seu e-mail no Festou!',
          text: `Ola, ${profile.nome}!\n\nPara confirmar seu endereco de e-mail e ativar sua conta, acesse: ${link}\n\nO link vale por 24 horas e so pode ser usado uma vez. Se voce nao criou esta conta, ignore esta mensagem.`,
        })
      } catch (error) {
        console.error('[confirmacao-email] falha ao reenviar o e-mail', error)
      }
    }

    response.status(202).json({ message: resendMessage })
  } catch (error) {
    next(error)
  }
})
