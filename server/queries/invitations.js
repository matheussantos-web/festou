import { getDatabase } from '../db.js'

export async function fetchRsvpSummary(invitationId) {
  const sql = getDatabase()
  const [summary] = await sql`
    select
      (count(*) filter (where resposta = 'confirmado'))::int as confirmados,
      (coalesce(sum(quantidade_pessoas) filter (where resposta = 'confirmado'), 0))::int as pessoas_confirmadas,
      (count(*) filter (where resposta = 'talvez'))::int as talvez,
      (count(*) filter (where resposta = 'recusado'))::int as recusados
    from public.confirmacoes_presenca
    where convite_id = ${invitationId}
  `

  return summary
}
