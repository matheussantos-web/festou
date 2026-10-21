import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../../server/index.js'

describe('tratamento de erros da API', () => {
  it('devolve 400 quando o JSON enviado está malformado', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "alguem@exemplo.com", "senha": }')

    expect(response.status).toBe(400)
    expect(response.body.message).toBeTruthy()
  })

  it('devolve 413 quando o corpo excede o limite aceito', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'alguem@exemplo.com', senha: 'x'.repeat(20_000) }))

    expect(response.status).toBe(413)
    expect(response.body.message).toBeTruthy()
  })

  it('mantem 400 com o campo invalido na validacao do zod', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nao-e-email', senha: 'x' })

    expect(response.status).toBe(400)
    expect(response.body.field).toBe('email')
  })

  it('nao expoe detalhes internos em erros de servidor', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body.message).toBeUndefined()
  })

  it('responde 405 para metodos nao suportados no health', async () => {
    const response = await request(app).post('/api/health')

    expect(response.status).toBe(405)
    expect(response.headers.allow).toBe('GET, HEAD')
    expect(response.body.message).toBeTruthy()
  })

  it('responde 404 em JSON para endpoint inexistente', async () => {
    const response = await request(app).get('/api/nao-existe')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ message: 'Endpoint nao encontrado.' })
  })
})
