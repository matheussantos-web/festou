import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.fn()

vi.mock('../../src/lib/api.js', () => ({
  api: (...args) => apiMock(...args),
}))

async function loadSessionStore() {
  vi.resetModules()
  return import('../../src/lib/session.js')
}

beforeEach(() => {
  apiMock.mockReset()
})

describe('sessao do frontend', () => {
  it('consulta /auth/me uma unica vez e reaproveita o resultado', async () => {
    apiMock.mockResolvedValue({ user: { id: '1', nome: 'Marina', tipo_perfil: 'cliente' } })
    const { loadSession } = await loadSessionStore()

    const first = await loadSession()
    const second = await loadSession()

    expect(apiMock).toHaveBeenCalledTimes(1)
    expect(first.user?.nome).toBe('Marina')
    expect(second.user?.nome).toBe('Marina')
  })

  it('junta chamadas simultaneas em uma so requisicao', async () => {
    apiMock.mockResolvedValue({ user: { id: '1', nome: 'Marina', tipo_perfil: 'cliente' } })
    const { loadSession } = await loadSessionStore()

    await Promise.all([loadSession(), loadSession(), loadSession()])

    expect(apiMock).toHaveBeenCalledTimes(1)
  })

  it('guarda o usuario depois do login sem nova requisicao', async () => {
    apiMock.mockResolvedValue({ user: null })
    const { loadSession, setSession, useSession } = await loadSessionStore()
    const { user } = useSession()

    await loadSession()
    expect(user.value).toBeNull()

    setSession({ id: '2', nome: 'Pedro', tipo_perfil: 'fornecedor' })
    expect(user.value?.nome).toBe('Pedro')

    const next = await loadSession()
    expect(next.user?.nome).toBe('Pedro')
    expect(apiMock).toHaveBeenCalledTimes(1)
  })

  it('limpa o usuario no logout', async () => {
    apiMock.mockResolvedValue({ user: { id: '1', nome: 'Marina', tipo_perfil: 'cliente' } })
    const { loadSession, clearSession, useSession } = await loadSessionStore()
    const { user } = useSession()

    await loadSession()
    expect(user.value).not.toBeNull()

    clearSession()
    expect(user.value).toBeNull()
  })

  it('devolve o erro quando a consulta de sessao falha', async () => {
    const failure = new Error('sem rede')
    apiMock.mockRejectedValue(failure)
    const { loadSession } = await loadSessionStore()

    const result = await loadSession()

    expect(result.user).toBeNull()
    expect(result.error).toBe(failure)
  })

  it('permite forcar uma nova consulta', async () => {
    apiMock.mockResolvedValue({ user: null })
    const { loadSession } = await loadSessionStore()

    await loadSession()
    await loadSession({ force: true })

    expect(apiMock).toHaveBeenCalledTimes(2)
  })
})
