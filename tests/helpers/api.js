import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { app } from '../../server/index.js'
import { getDatabase } from '../../server/db.js'

export const appOrigin = process.env.APP_ORIGIN || 'http://127.0.0.1:5173'
export const testEmailPattern = 'teste.%@festou.test'

export function createClient() {
  const agent = request.agent(app)

  return {
    get: (url) => agent.get(url),
    post: (url) => agent.post(url).set('Origin', appOrigin),
    patch: (url) => agent.patch(url).set('Origin', appOrigin),
    put: (url) => agent.put(url).set('Origin', appOrigin),
    delete: (url) => agent.delete(url).set('Origin', appOrigin),
  }
}

export async function createAccount(tipoPerfil = 'cliente') {
  const email = `teste.${randomUUID()}@festou.test`
  const client = createClient()

  const response = await client.post('/api/auth/register').send({
    nome: `Conta ${tipoPerfil}`,
    email,
    senha: 'SenhaDeTeste123',
    tipo_perfil: tipoPerfil,
  })

  if (response.status !== 201) {
    throw new Error(`Falha ao criar conta de teste: ${response.status} ${JSON.stringify(response.body)}`)
  }

  return { client, email, id: response.body.user.id, nome: response.body.user.nome }
}

export async function createProduct(supplier, overrides = {}) {
  const payload = {
    nome: `Produto de teste ${randomUUID().slice(0, 8)}`,
    categoria: 'bolos',
    descricao: 'Produto criado automaticamente pela suite de testes.',
    preco: 99.9,
    cidade: 'São Paulo',
    imagem_url: '',
    ...overrides,
  }

  const response = await supplier.client.post('/api/products').send(payload)

  if (response.status !== 201) {
    throw new Error(`Falha ao criar produto de teste: ${response.status} ${JSON.stringify(response.body)}`)
  }

  return response.body.product
}

export async function cleanupTestData() {
  const sql = getDatabase()

  await sql.query(
    `delete from public.pedidos
      where cliente_id in (select id from public.perfis where email like '${testEmailPattern}')`,
  )

  await sql.query(`delete from public.perfis where email like '${testEmailPattern}'`)
}
