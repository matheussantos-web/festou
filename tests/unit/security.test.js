import { describe, expect, it } from 'vitest'
import {
  hashPassword,
  passwordNeedsRehash,
  verifyPassword,
} from '../../server/security.js'

describe('senhas', () => {
  it('verifica a senha com o hash atual', async () => {
    const hash = await hashPassword('SenhaDeTeste123')

    expect(hash.startsWith('scrypt$16384$8$1$')).toBe(true)
    expect(await verifyPassword('SenhaDeTeste123', hash)).toBe(true)
    expect(await verifyPassword('SenhaErrada123', hash)).toBe(false)
  })

  it('nao guarda a senha em texto no hash', async () => {
    const hash = await hashPassword('SenhaDeTeste123')

    expect(hash).not.toContain('SenhaDeTeste123')
    expect(hash.split('$')).toHaveLength(6)
  })

  it('ainda verifica o formato antigo (salt:hash)', async () => {
    const { scrypt } = await import('node:crypto')
    const { promisify } = await import('node:util')
    const derive = promisify(scrypt)
    const salt = 'a1b2c3d4'
    const derived = await derive('SenhaDeTeste123', salt, 64)
    const legacyHash = `${salt}:${derived.toString('hex')}`

    expect(await verifyPassword('SenhaDeTeste123', legacyHash)).toBe(true)
    expect(await verifyPassword('SenhaErrada123', legacyHash)).toBe(false)
  })

  it('rejeita hash vazio ou corrompido', async () => {
    expect(await verifyPassword('SenhaDeTeste123', '')).toBe(false)
    expect(await verifyPassword('SenhaDeTeste123', 'sem-separador')).toBe(false)
    expect(await verifyPassword('SenhaDeTeste123', 'scrypt$x$y$z')).toBe(false)
    expect(await verifyPassword('SenhaDeTeste123', 'abc:zzzz')).toBe(false)
  })

  it('pede rehash para o formato antigo e nao para o atual', async () => {
    const currentHash = await hashPassword('SenhaDeTeste123')

    expect(passwordNeedsRehash(currentHash)).toBe(false)
    expect(passwordNeedsRehash('a1b2c3d4:deadbeef')).toBe(true)
    expect(passwordNeedsRehash('scrypt$4096$8$1$salt$deadbeef')).toBe(true)
    expect(passwordNeedsRehash(null)).toBe(true)
  })

  it('gera hashes diferentes para a mesma senha', async () => {
    const first = await hashPassword('SenhaDeTeste123')
    const second = await hashPassword('SenhaDeTeste123')

    expect(first).not.toBe(second)
    expect(await verifyPassword('SenhaDeTeste123', first)).toBe(true)
    expect(await verifyPassword('SenhaDeTeste123', second)).toBe(true)
  })
})
