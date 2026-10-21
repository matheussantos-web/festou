import { describe, expect, it } from 'vitest'
import { emptyValue, formatDate, formatPrice, formatText } from '../../src/lib/format.js'

function normalize(value) {
  return value.replace(/\u00a0/g, ' ')
}

describe('formatPrice', () => {
  it('formata números e strings numéricas em Real', () => {
    expect(normalize(formatPrice(123.45))).toBe('R$ 123,45')
    expect(normalize(formatPrice('123.45'))).toBe('R$ 123,45')
    expect(normalize(formatPrice(0))).toBe('R$ 0,00')
  })

  it('devolve um traço para valores ausentes ou inválidos', () => {
    expect(formatPrice(null)).toBe(emptyValue)
    expect(formatPrice(undefined)).toBe(emptyValue)
    expect(formatPrice('abc')).toBe(emptyValue)
    expect(formatPrice(Number.NaN)).toBe(emptyValue)
    expect(formatPrice(Number.POSITIVE_INFINITY)).toBe(emptyValue)
  })
})

describe('formatDate', () => {
  it('formata uma data válida em pt-BR', () => {
    const formatted = formatDate('2026-12-25T18:30:00.000Z')

    expect(formatted).toContain('25')
    expect(formatted).toContain('2026')
  })

  it('devolve um traço para datas ausentes ou inválidas', () => {
    expect(formatDate(null)).toBe(emptyValue)
    expect(formatDate(undefined)).toBe(emptyValue)
    expect(formatDate('data-invalida')).toBe(emptyValue)
  })

  it('aceita ajustar o estilo da data', () => {
    expect(formatDate('2026-12-25T18:30:00.000Z', { dateStyle: 'full', timeStyle: 'short' }))
      .toContain('dezembro')
  })
})

describe('formatText', () => {
  it('normaliza textos vazios', () => {
    expect(formatText('  Festou!  ')).toBe('Festou!')
    expect(formatText('   ')).toBe(emptyValue)
    expect(formatText(null)).toBe(emptyValue)
    expect(formatText(42)).toBe(emptyValue)
  })
})
