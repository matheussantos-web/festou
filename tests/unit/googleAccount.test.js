import { describe, expect, it } from 'vitest'
import { resolveGoogleLogin } from '../../server/googleAccount.js'

describe('vinculo da conta Google', () => {
  it('cria conta quando o e-mail ainda nao existe', () => {
    expect(resolveGoogleLogin(null, 'google-sub-1')).toBe('create')
    expect(resolveGoogleLogin(undefined, 'google-sub-1')).toBe('create')
  })

  it('entra quando o sub do Google confere', () => {
    expect(resolveGoogleLogin({ google_sub: 'google-sub-1' }, 'google-sub-1')).toBe('login')
  })

  it('exige login com senha para conta criada com senha', () => {
    // Pre-hijack: alguem cadastra o e-mail da vitima com senha e espera que ela
    // entre com Google. Sem google_sub, a sessao nao pode ser aberta.
    expect(resolveGoogleLogin({ google_sub: null }, 'google-sub-1')).toBe('link_required')
  })

  it('recusa quando o e-mail ja esta vinculado a outro Google', () => {
    expect(resolveGoogleLogin({ google_sub: 'google-sub-antigo' }, 'google-sub-novo')).toBe('conflict')
  })

  it('recusa token sem o claim sub', () => {
    expect(resolveGoogleLogin(null, '')).toBe('invalid')
    expect(resolveGoogleLogin(null, undefined)).toBe('invalid')
  })
})
