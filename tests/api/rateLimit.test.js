import { describe, expect, it } from 'vitest'
import request from 'supertest'

// O app é importado depois das variáveis de ambiente para que o trust proxy e
// o limite de login sejam lidos na hora da configuração.
process.env.TRUST_PROXY = '1'
process.env.AUTH_RATE_LIMIT = '2'

const { app } = await import('../../server/index.js')

function attempt(ip) {
  return request(app)
    .post('/api/auth/login')
    .set('X-Forwarded-For', ip)
    .send({ email: 'inexistente@exemplo.com', senha: 'SenhaDeTeste123' })
}

describe('limitação de requisições atrás de proxy', () => {
  it('conta as tentativas pelo IP real do cliente, não pelo do proxy', async () => {
    expect((await attempt('203.0.113.10')).status).toBe(401)
    expect((await attempt('203.0.113.10')).status).toBe(401)
    expect((await attempt('203.0.113.10')).status).toBe(429)
  })

  it('mantém a contagem separada para cada IP', async () => {
    expect((await attempt('198.51.100.7')).status).toBe(401)
    expect((await attempt('198.51.100.7')).status).toBe(401)
    expect((await attempt('198.51.100.7')).status).toBe(429)
  })
})
