import { afterAll, describe, expect, it } from 'vitest'
import { cleanupTestData, createAccount, createClient } from '../helpers/api.js'

afterAll(cleanupTestData)

describe('autenticação', () => {
  it('cadastra uma conta, cria a sessão e devolve o perfil', async () => {
    const client = createClient()
    const email = `teste.auth.${Date.now()}@festou.test`

    const response = await client.post('/api/auth/register').send({
      nome: 'Cliente de Teste',
      email,
      senha: 'SenhaDeTeste123',
      tipo_perfil: 'cliente',
    })

    expect(response.status).toBe(201)
    expect(response.body.user).toMatchObject({
      nome: 'Cliente de Teste',
      email,
      tipo_perfil: 'cliente',
    })
    expect(response.headers['set-cookie']?.join(';')).toContain('festou_session')
    expect(response.body.user.senha_hash).toBeUndefined()
  })

  it('recusa e-mails duplicados', async () => {
    const { email } = await createAccount('cliente')
    const client = createClient()

    const response = await client.post('/api/auth/register').send({
      nome: 'Outro Cliente',
      email,
      senha: 'SenhaDeTeste123',
      tipo_perfil: 'cliente',
    })

    expect(response.status).toBe(409)
  })

  it('valida os campos do cadastro', async () => {
    const client = createClient()

    const response = await client.post('/api/auth/register').send({
      nome: 'ab',
      email: 'email-invalido',
      senha: '123',
      tipo_perfil: 'admin',
    })

    expect(response.status).toBe(400)
    expect(response.body.message).toBeTruthy()
  })

  it('autentica com e-mail e senha corretos', async () => {
    const { client, email } = await createAccount('cliente')

    const response = await client.post('/api/auth/login').send({
      email,
      senha: 'SenhaDeTeste123',
    })

    expect(response.status).toBe(200)
    expect(response.body.user.email).toBe(email)
  })

  it('recusa senha incorreta', async () => {
    const { email } = await createAccount('cliente')
    const client = createClient()

    const response = await client.post('/api/auth/login').send({
      email,
      senha: 'SenhaErrada123',
    })

    expect(response.status).toBe(401)
  })

  it('consulta a sessão atual e encerra a sessão', async () => {
    const { client, email } = await createAccount('cliente')

    const me = await client.get('/api/auth/me')
    expect(me.status).toBe(200)
    expect(me.body.user.email).toBe(email)

    const logout = await client.post('/api/auth/logout')
    expect(logout.status).toBe(204)

    const afterLogout = await client.get('/api/auth/me')
    expect(afterLogout.body.user).toBeNull()
  })

  it('bloqueia rotas privadas para visitantes', async () => {
    const client = createClient()

    const response = await client.get('/api/orders')

    expect(response.status).toBe(401)
  })

  it('bloqueia requisições mutáveis vindas de outra origem', async () => {
    const client = createClient()

    const response = await client
      .post('/api/auth/login')
      .set('Origin', 'https://site-malicioso.example')
      .send({ email: 'alguem@exemplo.com', senha: 'SenhaDeTeste123' })

    expect(response.status).toBe(403)
  })
})
