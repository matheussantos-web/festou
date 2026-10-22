const networkErrorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'

export class ApiError extends Error {
  constructor(message, { status = 0, field = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.field = field
  }
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')

  let response

  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers,
      credentials: 'include',
    })
  } catch {
    throw new ApiError(networkErrorMessage, { status: 0 })
  }

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new ApiError(result.message || 'O servidor não conseguiu concluir a solicitação.', {
      status: response.status,
      field: result.field ?? null,
    })
  }

  return result
}

export function asArray(value) {
  return Array.isArray(value) ? value : []
}
