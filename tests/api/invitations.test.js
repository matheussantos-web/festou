import { afterAll, describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import request from 'supertest'
import { app } from '../../server/index.js'
import { getDatabase } from '../../server/db.js'
import { cleanupTestData, createAccount, createClient } from '../helpers/api.js'

afterAll(cleanupTestData)

function futureDate() {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
}

async function createInvitation(customer, overrides = {}) {
  const response = await customer.client.post('/api/invitations').send({
    titulo: 'Aniversario de Teste',
    anfitriao: 'Familia Teste',
    data_evento: futureDate(),
    local_evento: 'Buffet de Teste',
    mensagem: 'Venha celebrar com a gente.',
    tema: 'jardim',
    ...overrides,
  })

  return response
}

describe('convites e RSVP', () => {
  it('cria um convite com o estado de confirmacao', async () => {
    const customer = await createAccount('cliente')

    const response = await createInvitation(customer)

    expect(response.status).toBe(201)
    expect(response.body.invitation.slug).toBeTruthy()

    // RegressÃ£o: sem aceita_rsvp na resposta, o anfitriao nunca consegue
    // encerrar as confirmacoes de um convite recem-criado.
    expect(response.body.invitation.aceita_rsvp).toBe(true)
  })

  it('recusa data do evento no passado', async () => {
    const customer = await createAccount('cliente')

    const response = await createInvitation(customer, {
      data_evento: new Date(Date.now() - 86_400_000).toISOString(),
    })

    expect(response.status).toBe(400)
  })

  it('impede que fornecedores criem convites', async () => {
    const supplier = await createAccount('fornecedor')

    const response = await createInvitation(supplier)

    expect(response.status).toBe(403)
  })

  it('registra e atualiza a resposta de um convidado pelo mesmo e-mail', async () => {
    const customer = await createAccount('cliente')
    const created = await createInvitation(customer)
    const { slug } = created.body.invitation

    const visitor = createClient()

    const first = await visitor.post(`/api/invitations/${slug}/rsvp`).send({
      nome: 'Convidado Um',
      email: 'convidado@festou.test',
      resposta: 'confirmado',
      quantidade_pessoas: 2,
    })

    expect(first.status).toBe(200)
    expect(first.body.summary.pessoas_confirmadas).toBe(2)

    const second = await visitor.post(`/api/invitations/${slug}/rsvp`).send({
      nome: 'Convidado Um',
      email: 'convidado@festou.test',
      resposta: 'talvez',
      quantidade_pessoas: 1,
    })

    expect(second.status).toBe(200)
    expect(second.body.summary.pessoas_confirmadas).toBe(0)
    expect(second.body.summary.talvez).toBe(1)

    const publicView = await visitor.get(`/api/invitations/${slug}`)
    expect(publicView.status).toBe(200)
    expect(publicView.body.invitation.titulo).toBe('Aniversario de Teste')
  })

  it('recusa resposta para convite inexistente', async () => {
    const visitor = createClient()

    const response = await visitor.post('/api/invitations/slug-inexistente/rsvp').send({
      nome: 'Convidado',
      email: 'convidado@festou.test',
      resposta: 'confirmado',
      quantidade_pessoas: 1,
    })

    expect(response.status).toBe(404)
  })

  it('encerra as confirmacoes depois da data do evento', async () => {
    const customer = await createAccount('cliente')
    const created = await createInvitation(customer)
    const { id, slug } = created.body.invitation

    // A API recusa criar convite no passado, entao o cenario so pode ser
    // montado direto no banco.
    const sql = getDatabase()
    await sql`
      update public.convites
      set data_evento = ${new Date(Date.now() - 3_600_000).toISOString()}
      where id = ${id}
    `

    const visitor = createClient()
    const response = await visitor.post(`/api/invitations/${slug}/rsvp`).send({
      nome: 'Convidado Atrasado',
      email: 'atrasado@festou.test',
      resposta: 'confirmado',
      quantidade_pessoas: 2,
    })

    expect(response.status).toBe(409)
    expect(response.body.message).toContain('evento ja aconteceu')
  })

  it('encerra e reabre as confirmacoes de presenÃ§a', async () => {
    const customer = await createAccount('cliente')
    const created = await createInvitation(customer)
    const { id, slug } = created.body.invitation
    const visitor = createClient()

    const closed = await customer.client.patch(`/api/invitations/${id}/rsvp-status`)
      .send({ aceita_rsvp: false })
    expect(closed.status).toBe(200)
    expect(closed.body.invitation.aceita_rsvp).toBe(false)

    const blocked = await visitor.post(`/api/invitations/${slug}/rsvp`).send({
      nome: 'Convidado Tarde',
      email: 'tarde@festou.test',
      resposta: 'confirmado',
      quantidade_pessoas: 1,
    })
    expect(blocked.status).toBe(409)

    const reopened = await customer.client.patch(`/api/invitations/${id}/rsvp-status`)
      .send({ aceita_rsvp: true })
    expect(reopened.body.invitation.aceita_rsvp).toBe(true)

    const allowed = await visitor.post(`/api/invitations/${slug}/rsvp`).send({
      nome: 'Convidado Tarde',
      email: 'tarde@festou.test',
      resposta: 'confirmado',
      quantidade_pessoas: 1,
    })
    expect(allowed.status).toBe(200)
  })

  it('impede que outro cliente altere as confirmacoes de um convite', async () => {
    const owner = await createAccount('cliente')
    const stranger = await createAccount('cliente')
    const created = await createInvitation(owner)

    const response = await stranger.client.patch(`/api/invitations/${created.body.invitation.id}/rsvp-status`)
      .send({ aceita_rsvp: false })

    expect(response.status).toBe(404)
  })

  it('lista os convites do proprio cliente com as respostas recebidas', async () => {
    const customer = await createAccount('cliente')
    const created = await createInvitation(customer)
    const visitor = createClient()

    await visitor.post(`/api/invitations/${created.body.invitation.slug}/rsvp`).send({
      nome: 'Convidado Lista',
      email: 'lista@festou.test',
      resposta: 'confirmado',
      quantidade_pessoas: 3,
    })

    const response = await customer.client.get('/api/invitations/mine')

    expect(response.status).toBe(200)
    const invitation = response.body.invitations.find((item) => item.id === created.body.invitation.id)
    expect(invitation).toBeDefined()
    expect(invitation.aceita_rsvp).toBe(true)
    expect(invitation.confirmacoes).toHaveLength(1)
    expect(invitation.confirmacoes[0].quantidade_pessoas).toBe(3)
  })
})

describe('ediÃ§Ã£o e exclusÃ£o de convites', () => {
  it('edita um convite do prÃ³prio cliente', async () => {
    const customer = await createAccount('cliente')
    const created = await createInvitation(customer)
    const { id } = created.body.invitation

    const response = await customer.client.patch(`/api/invitations/${id}`).send({
      titulo: 'Aniversario de Teste Editado',
      tema: 'colorido',
    })

    expect(response.status).toBe(200)
    expect(response.body.invitation.titulo).toBe('Aniversario de Teste Editado')
    expect(response.body.invitation.tema).toBe('colorido')
    expect(response.body.invitation.local_evento).toBe('Buffet de Teste')
  })

  it('impede que outro cliente edite o convite', async () => {
    const owner = await createAccount('cliente')
    const stranger = await createAccount('cliente')
    const created = await createInvitation(owner)

    const response = await stranger.client.patch(`/api/invitations/${created.body.invitation.id}`)
      .send({ titulo: 'Convite sequestrado' })

    expect(response.status).toBe(404)
  })

  it('exclui um convite do prÃ³prio cliente', async () => {
    const customer = await createAccount('cliente')
    const created = await createInvitation(customer)
    const { id, slug } = created.body.invitation

    const response = await customer.client.delete(`/api/invitations/${id}`)

    expect(response.status).toBe(200)
    expect(response.body.message).toContain('Aniversario de Teste')

    const publicView = await createClient().get(`/api/invitations/${slug}`)
    expect(publicView.status).toBe(404)
  })

  it('impede que outro cliente exclua o convite', async () => {
    const owner = await createAccount('cliente')
    const stranger = await createAccount('cliente')
    const created = await createInvitation(owner)

    const response = await stranger.client.delete(`/api/invitations/${created.body.invitation.id}`)

    expect(response.status).toBe(404)
  })
})

const distIndex = new URL('../../dist/index.html', import.meta.url)

describe.skipIf(!existsSync(distIndex))('prÃ©via do link pÃºblico', () => {
  it('injeta as tags Open Graph na pÃ¡gina do convite', async () => {
    const customer = await createAccount('cliente')
    const created = await createInvitation(customer, { titulo: 'Festa da Marina' })
    const { slug } = created.body.invitation

    const response = await request(app)
      .get(`/convite/${slug}`)
      .set('User-Agent', 'WhatsApp/2.24.1')

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.text).toContain('property="og:title"')
    expect(response.text).toContain('Festa da Marina')
    expect(response.text).toContain(`${slug}`)
    expect(response.text).toContain('property="og:image"')
  })

  it('entrega o SPA normal para convite inexistente', async () => {
    const response = await request(app).get('/convite/slug-que-nao-existe')

    expect(response.status).toBe(200)
    expect(response.text).not.toContain('property="og:title"')
  })
})
