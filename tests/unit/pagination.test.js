import { describe, expect, it } from 'vitest'
import { buildPagination, readPagination } from '../../server/schemas/pagination.js'

describe('paginação', () => {
  it('usa os valores padrão quando a query está vazia', () => {
    expect(readPagination({}, { defaultLimit: 12 })).toEqual({ pagina: 1, limite: 12, offset: 0 })
  })

  it('converte strings da query em números e calcula o offset', () => {
    expect(readPagination({ pagina: '3', limite: '10' })).toEqual({ pagina: 3, limite: 10, offset: 20 })
  })

  it('recusa pagina e limite fora da faixa', () => {
    expect(() => readPagination({ pagina: '0' })).toThrow()
    expect(() => readPagination({ limite: '61' })).toThrow()
    expect(() => readPagination({ pagina: 'abc' })).toThrow()
  })

  it('informa total de páginas e se há mais itens', () => {
    expect(buildPagination({ pagina: 1, limite: 10, total: 25 })).toEqual({
      pagina: 1,
      limite: 10,
      total: 25,
      totalPaginas: 3,
      temMais: true,
    })

    expect(buildPagination({ pagina: 3, limite: 10, total: 25 }).temMais).toBe(false)
    expect(buildPagination({ pagina: 1, limite: 10, total: 0 })).toMatchObject({
      totalPaginas: 1,
      temMais: false,
    })
  })
})
