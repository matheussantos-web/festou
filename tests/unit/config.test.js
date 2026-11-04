import { describe, expect, it } from 'vitest'
import { normalizeOrigin, parseTrustProxy } from '../../server/config.js'

describe('configuração do ambiente', () => {
  it('não confia em proxies por padrão', () => {
    expect(parseTrustProxy(undefined)).toBe(false)
    expect(parseTrustProxy(null)).toBe(false)
    expect(parseTrustProxy('')).toBe(false)
    expect(parseTrustProxy('false')).toBe(false)
  })

  it('aceita o número de proxies reversos', () => {
    expect(parseTrustProxy('0')).toBe(0)
    expect(parseTrustProxy('1')).toBe(1)
    expect(parseTrustProxy('2')).toBe(2)
  })

  it('aceita a configuração permissiva', () => {
    expect(parseTrustProxy('true')).toBe(true)
  })

  it('ignora valores inválidos', () => {
    expect(parseTrustProxy('invalido')).toBe(false)
    expect(parseTrustProxy('-1')).toBe(false)
    expect(parseTrustProxy('1.5')).toBe(false)
  })

  it('normaliza APP_ORIGIN sem barra final', () => {
    // O navegador envia Origin sem barra; uma barra no .env bloqueava todas as
    // requisicoes de escrita com 403.
    expect(normalizeOrigin('https://festou.th.app.br/', 'x')).toBe('https://festou.th.app.br')
    expect(normalizeOrigin('https://festou.th.app.br///', 'x')).toBe('https://festou.th.app.br')
    expect(normalizeOrigin('  https://festou.th.app.br  ', 'x')).toBe('https://festou.th.app.br')
    expect(normalizeOrigin('', 'http://127.0.0.1:5173')).toBe('http://127.0.0.1:5173')
    expect(normalizeOrigin(undefined, 'http://127.0.0.1:5173')).toBe('http://127.0.0.1:5173')
  })
})
