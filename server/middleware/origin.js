import { isAllowedOrigin } from '../security.js'

// Bloqueia requisicoes de escrita vindas de outra origem. O cookie de sessao e
// SameSite=Lax, entao esta checagem e a segunda camada contra CSRF.
export function createOriginGuard(configuredOrigin) {
  return (request, response, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next()

    if (!isAllowedOrigin(request, configuredOrigin)) {
      return response.status(403).json({ message: 'Origem da solicitacao nao permitida.' })
    }

    return next()
  }
}
