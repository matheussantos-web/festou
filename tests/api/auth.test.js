import { afterAll, describe, expect, it } from 'vitest'
import { randomBytes, scrypt } from 'node:crypto'
import { promisify } from 'node:util'
import request from 'supertest'
import { app } from '../../server/index.js'
import { getDatabase } from '../../server/db.js'
import { cleanupTestData, createAccount, createClient } from '../helpers/api.js'

afterAll(cleanupTestData)

// Reproduz o formato de hash anterior: salt:hash, 64 bytes, sem versao.
async function createLegacyHash(senha) {
  const salt = randomBytes(16).toString('hex')
  const derived = await promisify(scrypt)(senha, salt, 64)
  return `${salt}:${derived.toString('hex')}`
}

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

  it('atualiza o hash antigo para o formato atual no proximo login', async () => {
    const { email } = await createAccount('cliente')
    const sql = getDatabase()

    // Hash no formato anterior (salt:hash, sem parametros), como as contas
    // criadas antes da versionagem do scrypt.
    const legacyHash = await createLegacyHash('SenhaDeTeste123')
    await sql`update public.perfis set senha_hash = ${legacyHash} where email = ${email}`

    const client = createClient()
    const response = await client.post('/api/auth/login').send({
      email,
      senha: 'SenhaDeTeste123',
    })

    expect(response.status).toBe(200)

    const [updated] = await sql`select senha_hash from public.perfis where email = ${email}`
    expect(updated.senha_hash).not.toBe(legacyHash)
    expect(updated.senha_hash.startsWith('scrypt$16384$8$1$')).toBe(true)
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

  it('aceita requisições de mesma origem do proprio servidor', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Host', 'festou.local')
      .set('Origin', 'http://festou.local')
      .send({ email: 'alguem@exemplo.com', senha: 'SenhaDeTeste123' })

    expect(response.status).not.toBe(403)
  })

  it('aceita a mesma origem quando o proxy termina o TLS', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Host', 'festou.local')
      .set('X-Forwarded-Proto', 'https')
      .set('Origin', 'https://festou.local')
      .send({ email: 'alguem@exemplo.com', senha: 'SenhaDeTeste123' })

    expect(response.status).not.toBe(403)
  })

  it('aceita clientes sem cabecalho Origin', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alguem@exemplo.com', senha: 'SenhaDeTeste123' })

    expect(response.status).not.toBe(403)
  })

  it('devolve 404 em JSON para endpoints inexistentes', async () => {
    const response = await request(app).get('/api/rota-que-nao-existe')

    expect(response.status).toBe(404)
    expect(response.body.message).toBeTruthy()
  })

  it('permite imagens externas no CSP para exibir fotos de produtos', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)

    const csp = response.headers['content-security-policy']

    expect(csp).toBeTruthy()
    expect(csp).toContain("img-src 'self' data: blob: https:")
    expect(csp).toContain('font-src \'self\' data: https://fonts.gstatic.com')
  })
})
