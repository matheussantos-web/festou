import { z } from 'zod'

export const pageSchema = z.coerce.number()
  .int('A pagina precisa ser um numero inteiro.')
  .min(1)
  .max(10_000)

export const limitSchema = z.coerce.number()
  .int('O limite precisa ser um numero inteiro.')
  .min(1)
  .max(60)

// Converte pagina/limite da query string em valores seguros e no offset do SQL.
export function readPagination(query, { defaultLimit = 20 } = {}) {
  const pagina = pageSchema.parse(query.pagina ?? 1)
  const limite = limitSchema.parse(query.limite ?? defaultLimit)

  return { pagina, limite, offset: (pagina - 1) * limite }
}

export function buildPagination({ pagina, limite, total }) {
  const totalPaginas = Math.max(1, Math.ceil(total / limite))

  return {
    pagina,
    limite,
    total,
    totalPaginas,
    temMais: pagina < totalPaginas,
  }
}
