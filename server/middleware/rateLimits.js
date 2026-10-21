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

// Limita por e-mail para impedir que varias senhas sejam testadas contra a
// mesma conta, mesmo vindo de origens diferentes.
export const loginByEmailLimiter = rateLimit({
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
