const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export function isGoogleConfigured() {
  return Boolean(googleClientId)
}

export function googleLoginUrl(redirect) {
  const origin = window.location.origin
  const nonce = Math.random().toString(36).slice(2)
  const destination = typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect
    : '/vitrine'

  sessionStorage.setItem('google_nonce', nonce)
  sessionStorage.setItem('auth_redirect', destination)

  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: `${origin}/auth/google/callback`,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce,
    prompt: 'select_account',
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export function consumeGoogleRedirect() {
  const redirect = sessionStorage.getItem('auth_redirect') || '/vitrine'
  sessionStorage.removeItem('auth_redirect')
  sessionStorage.removeItem('google_nonce')
  sessionStorage.removeItem('google_id_token')
  return redirect
}

export function readIdTokenFromUrl() {
  // No fluxo id_token (implicit) o Google devolve os dados no fragmento
  // (#id_token=...). Erros podem vir na query string.
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))

  const error = search.get('error') || hash.get('error')
  if (error) {
    return {
      error: search.get('error_description') || hash.get('error_description') || 'Login com Google cancelado.',
    }
  }

  const idToken = hash.get('id_token') || search.get('id_token')
  if (!idToken) return { error: 'Não recebemos o token do Google. Tente novamente.' }

  return { idToken }
}
