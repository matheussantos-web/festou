import { createHash } from 'node:crypto'
import { ipKeyGenerator, rateLimit } from 'express-rate-limit'
import { authRateLimit, rsvpRateLimit } from '../config.js'

// Login e cadastro tem contadores separados: um Shared, o mesmo limite valia
// para as duas rotas e um atacante travava os cadastros so de tentar login.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: authRateLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
})

// Limita globalmente por e-mail para que varias origens nao permitam tentativas
// ilimitadas contra uma unica conta. O identificador fica hasheado.
export const loginByEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_EMAIL_RATE_LIMIT) || authRateLimit * 2,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (request) => {
    const email = String(request.body?.email ?? '').trim().toLowerCase()
    return email
      ? `login:${createHash('sha256').update(email).digest('hex')}`
      : ipKeyGenerator(request.ip)
  },
  message: { message: 'Muitas tentativas para este e-mail. Aguarde alguns minutos.' },
})

export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: authRateLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
})

export const rsvpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: rsvpRateLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Muitas tentativas de confirmacao. Aguarde alguns minutos.' },
})

// Recuperação de senha: evita que o formulário vire ferramenta de spam de
// e-mail ou de força bruta contra o token.
export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: authRateLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Muitos pedidos de recuperacao. Aguarde alguns minutos.' },
})

// Segundo contador por e-mail: sem ele, varias origens (ou varios IPs) podem
// encher a caixa de uma mesma pessoa com links e gastar a cota do Resend.
// O e-mail e guardado como hash para nao manter dado pessoal na memoria.
export const forgotPasswordByEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (request) => {
    const email = String(request.body?.email ?? '').trim().toLowerCase()
    const key = email ? createHash('sha256').update(email).digest('hex') : ipKeyGenerator(request.ip)
    return `recuperacao:${key}`
  },
  message: { message: 'Muitos pedidos para este e-mail. Aguarde antes de tentar novamente.' },
})

export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: authRateLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Muitas tentativas. Aguarde alguns minutos.' },
})

export const emailVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: authRateLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
})

export const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: authRateLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Muitos pedidos. Aguarde alguns minutos e tente novamente.' },
})

export const resendVerificationByEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (request) => {
    const email = String(request.body?.email ?? '').trim().toLowerCase()
    const key = email ? createHash('sha256').update(email).digest('hex') : ipKeyGenerator(request.ip)
    return `confirmacao:${key}`
  },
  message: { message: 'Muitos pedidos para este e-mail. Aguarde antes de tentar novamente.' },
})

export const googleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: authRateLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
})
