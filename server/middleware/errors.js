import { ZodError } from 'zod'

export function createNotFoundHandler() {
  return (request, response) => {
    response.status(404).json({ message: 'Endpoint nao encontrado.' })
  }
}

export function createErrorHandler(bodyLimit) {
  // Erros conhecidos do parser de corpo: sao falhas do cliente e nao devem
  // virar 500 generico.
  const bodyParserErrors = {
    'entity.parse.failed': { status: 400, message: 'Corpo da requisicao invalido: o JSON nao pode ser lido.' },
    'entity.verify.failed': { status: 400, message: 'Corpo da requisicao invalido.' },
    'entity.too.large': { status: 413, message: `Corpo da requisicao muito grande: o limite e de ${bodyLimit}.` },
    'parameters.too.many': { status: 413, message: 'Parametros demais na requisicao.' },
    'charset.unsupported': { status: 415, message: 'Codificacao de caracteres nao suportada.' },
    'encoding.unsupported': { status: 415, message: 'Codificacao de caracteres nao suportada.' },
  }

  return (error, _request, response, _next) => {
    if (error instanceof ZodError) {
      const issue = error.issues[0]
      return response.status(400).json({
        message: issue?.message || 'Confira os dados enviados.',
        field: issue?.path[0] ?? null,
      })
    }

    const knownBodyError = bodyParserErrors[error?.type]
    if (knownBodyError) {
      return response.status(knownBodyError.status).json({ message: knownBodyError.message })
    }

    if (error?.message?.startsWith('DATABASE_URL')) {
      return response.status(503).json({ message: error.message })
    }

    // Demais erros 4xx carregam o proprio status e nao revelam detalhes internos.
    const status = Number(error?.status ?? error?.statusCode)
    if (Number.isInteger(status) && status >= 400 && status < 500) {
      return response.status(status).json({ message: 'Requisicao invalida.' })
    }

    console.error(error)
    return response.status(500).json({ message: 'Erro interno. Tente novamente.' })
  }
}
