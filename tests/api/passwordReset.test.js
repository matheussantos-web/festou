import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { appOrigin, cleanupTestData, createAccount, createClient } from '../helpers/api.js'

// Captura os e-mails disparados pelo fluxo para extrair o link do token.
const mailer = vi.hoisted(() => ({ sent: [] }))

vi.mock('../../server/mailer.js', () => ({
  sendMail: async (message) => {
    mailer.sent.push(message)
    return { delivered: false }
  },
}))

const request = (await import('supertest')).default
const { app } = await import('../../server/index.js')

afterAll(cleanupTestData)

beforeEach(() => {
  mailer.sent.length = 0
})

function extractToken(message) {
  const link = message.text.match(/https?:\/\/\S+\/redefinir-senha\?token=(\S+)/)
  return link?.[1]
}

describe('recuperação de senha', () => {
  it('responde igual para e-mail cadastrado e desconhecido', async () => {
    const cliente = createClient()
    const desconhecido = await cliente.post('/api/auth/forgot-password').send({
      email: `teste.desconhecido.${Date.now()}@festou.test`,
    })

    expect(desconhecido.status).toBe(202)
    expect(desconhecido.body.message).toContain('Se este e-mail estiver cadastrado')
    expect(mailer.sent).toHaveLength(0)

    const { email } = await createAccount('cliente')
    const cadastrado = await createClient().post('/api/auth/forgot-password').send({ email })

    expect(cadastrado.status).toBe(202)
    expect(cadastrado.body.message).toBe(desconhecido.body.message)
    expect(mailer.sent).toHaveLength(1)
    expect(mailer.sent[0].to).toBe(email)
  })

  it('valida o formato do e-mail', async () => {
    const response = await createClient().post('/api/auth/forgot-password').send({ email: 'nao-e-email' })

    expect(response.status).toBe(400)
    expect(mailer.sent).toHaveLength(0)
  })

  it('redefine a senha, encerra as sessões e invalida o link', async () => {
    const { client, email } = await createAccount('cliente')
    const pedido = await client.post('/api/auth/forgot-password').send({ email })
    expect(pedido.status).toBe(202)

    const token = extractToken(mailer.sent[0])
    expect(token).toBeTruthy()
    expect(mailer.sent[0].text).toContain(`${appOrigin}/redefinir-senha?token=`)

    // A sessão aberta antes da troca deixa de valer.
    const reset = await createClient().post('/api/auth/reset-password').send({
      token,
      senha: 'NovaSenhaSegura456',
    })
    expect(reset.status).toBe(200)

    expect((await client.get('/api/auth/me')).body.user).toBeNull()
    expect((await client.get('/api/orders')).status).toBe(401)

    const loginAntigo = await createClient().post('/api/auth/login').send({ email, senha: 'SenhaDeTeste123' })
    expect(loginAntigo.status).toBe(401)

    const loginNovo = await createClient().post('/api/auth/login').send({ email, senha: 'NovaSenhaSegura456' })
    expect(loginNovo.status).toBe(200)

    const reuso = await createClient().post('/api/auth/reset-password').send({
      token,
      senha: 'OutraSenha789',
    })
    expect(reuso.status).toBe(400)
  })

  it('invalida links anteriores quando um novo é pedido', async () => {
    const { email } = await createAccount('cliente')
    const cliente = createClient()

    await cliente.post('/api/auth/forgot-password').send({ email })
    const primeiro = extractToken(mailer.sent[0])
    await cliente.post('/api/auth/forgot-password').send({ email })
    const segundo = extractToken(mailer.sent[1])

    expect(segundo).not.toBe(primeiro)

    const antigo = await createClient().post('/api/auth/reset-password').send({
      token: primeiro,
      senha: 'NovaSenhaSegura456',
    })
    expect(antigo.status).toBe(400)

    const novo = await createClient().post('/api/auth/reset-password').send({
      token: segundo,
      senha: 'NovaSenhaSegura456',
    })
    expect(novo.status).toBe(200)
  })

  it('recusa token inexistente e senha curta', async () => {
    const inexistente = await createClient().post('/api/auth/reset-password').send({
      token: 'a'.repeat(43),
      senha: 'NovaSenhaSegura456',
    })
    expect(inexistente.status).toBe(400)

    const curta = await createClient().post('/api/auth/reset-password').send({
      token: 'a'.repeat(43),
      senha: 'curta',
    })
    expect(curta.status).toBe(400)
  })
})
