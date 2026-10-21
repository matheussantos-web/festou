import { describe, expect, it } from 'vitest'
import { parseTrustProxy } from '../../server/config.js'

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
})
