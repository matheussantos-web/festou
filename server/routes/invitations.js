import { Router } from 'express'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { getDatabase } from '../db.js'
import { requireUser } from '../middleware/session.js'
import { rsvpLimiter } from '../middleware/rateLimits.js'
import { buildUpdate } from '../sql/buildUpdate.js'
import { fetchRsvpSummary } from '../queries/invitations.js'
import {
  invitationSchema,
  invitationUpdateSchema,
  rsvpSchema,
  rsvpStatusSchema,
} from '../schemas/invitations.js'

export const invitationsRouter = Router()

const invitationIdSchema = z.string().uuid('Identificador de convite inválido.')

function requireCliente(request, response) {
  if (request.user.tipo_perfil !== 'cliente') {
    response.status(403).json({ message: 'Somente clientes podem gerenciar convites.' })
    return false
  }
  return true
}

invitationsRouter.post('/', requireUser, async (request, response, next) => {
  try {
    if (request.user.tipo_perfil !== 'cliente') {
      return response.status(403).json({ message: 'Somente clientes podem criar convites.' })
    }

    const input = invitationSchema.parse(request.body)
    const slug = randomBytes(24).toString('base64url')
    const sql = getDatabase()
    const [invitation] = await sql`
      insert into public.convites (
        dono_id, slug, titulo, anfitriao, data_evento, local_evento, mensagem, tema
      ) values (
        ${request.user.id}, ${slug}, ${input.titulo}, ${input.anfitriao},
        ${input.data_evento}, ${input.local_evento}, ${input.mensagem}, ${input.tema}
      )
      returning id, slug, titulo, anfitriao, data_evento, local_evento, mensagem, tema, aceita_rsvp, created_at
    `

    response.status(201).json({ invitation })
  } catch (error) {
    return next(error)
  }
})

invitationsRouter.get('/mine', requireUser, async (request, response, next) => {
  try {
    if (request.user.tipo_perfil !== 'cliente') {
      return response.status(403).json({ message: 'Este perfil nao pode consultar convites.' })
    }

    const sql = getDatabase()
    const invitations = await sql`
      select
        c.id,
        c.slug,
        c.titulo,
        c.anfitriao,
        c.data_evento,
        c.local_evento,
        c.mensagem,
        c.tema,
        c.aceita_rsvp,
        c.created_at,
        coalesce(
          json_agg(json_build_object(
            'nome', r.nome,
            'email', r.email,
            'resposta', r.resposta,
            'quantidade_pessoas', r.quantidade_pessoas,
            'mensagem', r.mensagem,
            'updated_at', r.updated_at
          )) filter (where r.id is not null),
          '[]'::json
        ) as confirmacoes
      from public.convites c
      left join public.confirmacoes_presenca r on r.convite_id = c.id
      where c.dono_id = ${request.user.id}
      group by c.id
      order by c.data_evento desc
      limit 100
    `

    response.json({ invitations })
  } catch (error) {
    return next(error)
  }
})

invitationsRouter.patch('/:id/rsvp-status', requireUser, async (request, response, next) => {
  try {
    if (!requireCliente(request, response)) return

    const invitationId = invitationIdSchema.parse(request.params.id)
    const input = rsvpStatusSchema.parse(request.body)
    const sql = getDatabase()

    const [updated] = await sql`
      update public.convites
      set aceita_rsvp = ${input.aceita_rsvp}
      where id = ${invitationId} and dono_id = ${request.user.id}
      returning id, slug, titulo, aceita_rsvp
    `

    if (!updated) {
      return response.status(404).json({ message: 'Convite não encontrado ou você não tem permissão para editá-lo.' })
    }

    const message = input.aceita_rsvp
      ? 'Confirmações de presença reabertas com sucesso.'
      : 'Confirmações de presença encerradas com sucesso.'

    response.json({ message, invitation: updated })
  } catch (error) {
    return next(error)
  }
})

invitationsRouter.patch('/:id', requireUser, async (request, response, next) => {
  try {
    if (!requireCliente(request, response)) return

    const invitationId = invitationIdSchema.parse(request.params.id)
    const input = invitationUpdateSchema.parse(request.body)
    const { assignments, values } = buildUpdate(
      ['titulo', 'anfitriao', 'data_evento', 'local_evento', 'mensagem', 'tema'],
      input,
    )
    const sql = getDatabase()

    const [updated] = await sql.query(
      `update public.convites
       set ${assignments.join(', ')}
       where id = $${values.length + 1} and dono_id = $${values.length + 2}
       returning id, slug, titulo, anfitriao, data_evento, local_evento, mensagem, tema, aceita_rsvp`,
      [...values, invitationId, request.user.id],
    )

    if (!updated) {
      return response.status(404).json({ message: 'Convite não encontrado ou você não tem permissão para editá-lo.' })
    }

    response.json({ message: 'Convite atualizado com sucesso.', invitation: updated })
  } catch (error) {
    return next(error)
  }
})

invitationsRouter.delete('/:id', requireUser, async (request, response, next) => {
  try {
    if (!requireCliente(request, response)) return

    const invitationId = invitationIdSchema.parse(request.params.id)
    const sql = getDatabase()

    const [deleted] = await sql`
      delete from public.convites
      where id = ${invitationId} and dono_id = ${request.user.id}
      returning id, titulo
    `

    if (!deleted) {
      return response.status(404).json({ message: 'Convite não encontrado ou você não tem permissão para excluí-lo.' })
    }

    response.json({ message: `O convite "${deleted.titulo}" foi excluído.` })
  } catch (error) {
    return next(error)
  }
})

invitationsRouter.get('/:slug', async (request, response, next) => {
  try {
    const sql = getDatabase()
    const [invitation] = await sql`
      select id, slug, titulo, anfitriao, data_evento, local_evento, mensagem, tema, aceita_rsvp
      from public.convites
      where slug = ${request.params.slug}
      limit 1
    `

    if (!invitation) return response.status(404).json({ message: 'Convite nao encontrado.' })

    const summary = await fetchRsvpSummary(invitation.id)

    response.set('Cache-Control', 'no-store')
    response.json({ invitation, summary })
  } catch (error) {
    return next(error)
  }
})

invitationsRouter.post('/:slug/rsvp', rsvpLimiter, async (request, response, next) => {
  try {
    const input = rsvpSchema.parse(request.body)
    const sql = getDatabase()
    const [invitation] = await sql`
      select id, aceita_rsvp, data_evento
      from public.convites
      where slug = ${request.params.slug}
      limit 1
    `

    if (!invitation) return response.status(404).json({ message: 'Convite nao encontrado.' })
    if (!invitation.aceita_rsvp) {
      return response.status(409).json({ message: 'As confirmacoes para este convite foram encerradas.' })
    }
    // Respostas depois do evento nao fazem sentido e ainda distorcem o resumo
    // que o anfitriao acompanha.
    if (new Date(invitation.data_evento).getTime() < Date.now()) {
      return response.status(409).json({ message: 'O evento ja aconteceu; as confirmacoes estao encerradas.' })
    }

    await sql`
      insert into public.confirmacoes_presenca (
        convite_id, nome, email, resposta, quantidade_pessoas, mensagem
      ) values (
        ${invitation.id}, ${input.nome}, ${input.email}, ${input.resposta},
        ${input.quantidade_pessoas}, ${input.mensagem}
      )
      on conflict (convite_id, email) do update set
        nome = excluded.nome,
        resposta = excluded.resposta,
        quantidade_pessoas = excluded.quantidade_pessoas,
        mensagem = excluded.mensagem,
        updated_at = now()
    `

    const summary = await fetchRsvpSummary(invitation.id)

    response.status(200).json({ message: 'Resposta registrada.', summary })
  } catch (error) {
    return next(error)
  }
})
