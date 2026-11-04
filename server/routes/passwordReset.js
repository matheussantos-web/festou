import { Router } from 'express'
import { getDatabase } from '../db.js'
import { sendMail } from '../mailer.js'
import { createSessionToken, hashPassword, hashSessionToken } from '../security.js'
import { appOrigin, passwordResetTtlMs } from '../config.js'
import { forgotPasswordSchema, resetPasswordSchema } from '../schemas/auth.js'
import { forgotPasswordByEmailLimiter, forgotPasswordLimiter, resetPasswordLimiter } from '../middleware/rateLimits.js'

export const passwordResetRouter = Router()

// Responde sempre a mesma coisa: saber se o e-mail existe ou não é informação
// privada e não deve vazar pelo formulário de recuperação.
const genericMessage = 'Se este e-mail estiver cadastrado, enviaremos as instruções para redefinir a senha.'

passwordResetRouter.post('/forgot-password', forgotPasswordLimiter, forgotPasswordByEmailLimiter, async (request, response, next) => {
  try {
    const input = forgotPasswordSchema.parse(request.body)
    const sql = getDatabase()
    const [profile] = await sql`
      select id, nome, email
      from public.perfis
      where email = ${input.email}
      limit 1
    `

    if (profile) {
      const token = createSessionToken()
      const tokenHash = hashSessionToken(token)
      const expiresAt = new Date(Date.now() + passwordResetTtlMs)

      // Só o link mais recente vale: pedir outro invalida os anteriores.
      await sql`delete from public.recuperacao_senha where perfil_id = ${profile.id}`
      await sql`
        insert into public.recuperacao_senha (token_hash, perfil_id, expires_at)
        values (${tokenHash}, ${profile.id}, ${expiresAt})
      `

      const link = `${appOrigin}/redefinir-senha?token=${token}`
      const ttlMinutes = Math.round(passwordResetTtlMs / 60_000)

      try {
        await sendMail({
          to: profile.email,
          subject: 'Redefinição de senha no Festou!',
          text: `Olá, ${profile.nome}!\n\nRecebemos um pedido para redefinir sua senha.\nAcesse: ${link}\n\nO link vale por ${ttlMinutes} minutos e só pode ser usado uma vez. Se não foi você, ignore esta mensagem.`,
        })
      } catch (error) {
        // Falha no provedor não deve revelar nada ao visitante, mas fica no log.
        console.error('[recuperacao] falha ao enviar o e-mail', error)
      }
    }

    response.status(202).json({ message: genericMessage })
  } catch (error) {
    return next(error)
  }
})

passwordResetRouter.post('/reset-password', resetPasswordLimiter, async (request, response, next) => {
  try {
    const input = resetPasswordSchema.parse(request.body)
    const tokenHash = hashSessionToken(input.token)
    const sql = getDatabase()

    const [validToken] = await sql`
      select token_hash
      from public.recuperacao_senha
      where token_hash = ${tokenHash}
        and used_at is null
        and expires_at > now()
      limit 1
    `
    if (!validToken) {
      return response.status(400).json({ message: 'Link de redefinição inválido ou expirado. Solicite um novo.' })
    }

    const passwordHash = await hashPassword(input.senha)
    // Consome o token, troca a senha e encerra as sessoes numa unica consulta
    // atomica. Duas requisicoes concorrentes nao podem reutilizar o mesmo link.
    const [reset] = await sql`
      with claimed as (
        update public.recuperacao_senha
        set used_at = now()
        where token_hash = ${tokenHash}
          and used_at is null
          and expires_at > now()
        returning perfil_id
      ), password_updated as (
        update public.perfis
        set senha_hash = ${passwordHash},
            email_verified = true,
            email_verification_token_hash = null,
            email_verification_expires_at = null
        where id = (select perfil_id from claimed)
        returning id
      ), deleted_sessions as (
        delete from public.sessoes
        where perfil_id in (select id from password_updated)
        returning perfil_id
      )
      select id from password_updated
    `

    if (!reset) {
      return response.status(400).json({ message: 'Link de redefinição inválido ou expirado. Solicite um novo.' })
    }

    response.json({ message: 'Senha redefinida com sucesso. Entre com a nova senha.' })
  } catch (error) {
    return next(error)
  }
})
