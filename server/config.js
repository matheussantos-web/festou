// Configuração da aplicação, lida das variáveis de ambiente.
// Mantém as regras de ambiente fora das rotas para facilitar os testes.

function readInteger(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback

  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : fallback
}

// Quantos proxies reversos existem na frente da aplicação (nginx, Render,
// Railway, Cloudflare...). Sem isso o Express ignora o X-Forwarded-For e todo
// mundo passa a compartilhar o mesmo IP nos limitadores de requisição.
export function parseTrustProxy(value) {
  if (value === undefined || value === null || value === '') return false
  if (value === 'true') return true
  if (value === 'false') return false

  const hops = Number(value)
  return Number.isInteger(hops) && hops >= 0 ? hops : false
}

// Origens sao comparadas byte a byte com o cabecalho Origin do navegador, que
// nunca termina em barra. Normalizar evita que um APP_ORIGIN cadastrado como
// "https://festou.th.app.br/" bloqueie todas as requisicoes de escrita (403).
export function normalizeOrigin(value, fallback) {
  const origin = String(value ?? '').trim()
  if (!origin) return fallback
  return origin.replace(/\/+$/, '')
}

export const trustProxy = parseTrustProxy(process.env.TRUST_PROXY)

export const port = readInteger(process.env.PORT, 3000)
export const host = process.env.HOST || '127.0.0.1'
export const appOrigin = normalizeOrigin(process.env.APP_ORIGIN, 'http://127.0.0.1:5173')
export const isProduction = process.env.NODE_ENV === 'production'
export const authRateLimit = readInteger(process.env.AUTH_RATE_LIMIT, 10)
export const rsvpRateLimit = readInteger(process.env.RSVP_RATE_LIMIT, 30)
export const jsonBodyLimit = process.env.JSON_BODY_LIMIT || '16kb'

// Provedor de e-mail para recuperação de senha. Sem a chave, o servidor
// registra a mensagem no console (útil em desenvolvimento) e não envia nada.
export const resendApiKey = process.env.RESEND_API_KEY || ''
export const defaultMailFrom = 'Festou! <nao-responda@festou.app>'
export const mailFrom = process.env.MAIL_FROM || defaultMailFrom
export const passwordResetTtlMs = readInteger(process.env.PASSWORD_RESET_TTL_MINUTES, 60) * 60 * 1000

// Confere o que costuma faltar no primeiro deploy. Nao derruba o processo:
// imprime um bloco no log para o erro aparecer antes do primeiro usuario.
export function productionConfigWarnings(env = process.env) {
  if (env.NODE_ENV !== 'production') return []

  const warnings = []

  if (env.HOST !== '0.0.0.0' && env.HOST !== '::') {
    warnings.push('HOST nao esta em 0.0.0.0: em container/PaaS o servidor pode nao aceitar conexoes externas.')
  }
  if (!env.APP_ORIGIN) {
    warnings.push('APP_ORIGIN nao definida: o link de recuperacao e a validacao de origem usariam o padrao local.')
  } else if (!/^https:\/\//.test(env.APP_ORIGIN)) {
    warnings.push('APP_ORIGIN nao usa https: o cookie de sessao Secure nao sera enviado pelo navegador.')
  }
  if (!env.TRUST_PROXY) {
    warnings.push('TRUST_PROXY nao definida: atras de proxy/Cloudflare o rate limit conta o IP do proxy e vira um limite global.')
  }
  if (env.TRUST_PROXY === 'true') {
    warnings.push('TRUST_PROXY=true confia em qualquer proxy (inclusive X-Forwarded-For forjado). Prefira o numero de saltos.')
  }
  if (!env.DATABASE_URL || !/sslmode=require/.test(env.DATABASE_URL)) {
    warnings.push('DATABASE_URL sem sslmode=require: a conexao com o Neon pode ser recusada.')
  }
  if (!env.RESEND_API_KEY) {
    warnings.push('RESEND_API_KEY ausente: nenhum e-mail de recuperacao de senha sera enviado.')
  }
  if (!env.MAIL_FROM) {
    warnings.push(`MAIL_FROM no padrao (${defaultMailFrom}): use um remetente de dominio verificado no Resend.`)
  }
  if (!env.GOOGLE_CLIENT_ID) {
    warnings.push('GOOGLE_CLIENT_ID ausente: o login com Google respondera 500.')
  }

  return warnings
}
