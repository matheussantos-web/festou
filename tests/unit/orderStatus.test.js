import { describe, expect, it } from 'vitest'
import { orderStatusLabel, orderStatusStyle } from '../../src/lib/orderStatus.js'

describe('orderStatusLabel', () => {
  it('usa rótulos diferentes conforme a perspectiva', () => {
    expect(orderStatusLabel('solicitado', 'customer')).toBe('Aguardando fornecedor')
    expect(orderStatusLabel('solicitado', 'supplier')).toBe('Novo orçamento')
    expect(orderStatusLabel('cancelado', 'customer')).toBe('Cancelado')
    expect(orderStatusLabel('cancelado', 'supplier')).toBe('Cancelado pelo cliente')
  })

  it('mantem o status bruto quando não existe rótulo conhecido', () => {
    expect(orderStatusLabel('desconhecido')).toBe('desconhecido')
    expect(orderStatusLabel(undefined)).toBe(undefined)
  })
})

describe('orderStatusStyle', () => {
  it('devolve a classe visual de cada status', () => {
    expect(orderStatusStyle('confirmado')).toContain('emerald')
    expect(orderStatusStyle('recusado')).toContain('rose')
    expect(orderStatusStyle('cancelado')).toContain('slate')
  })

  it('devolve um estilo padrão para status desconhecidos', () => {
    expect(orderStatusStyle('inexistente')).toContain('slate')
  })
})
