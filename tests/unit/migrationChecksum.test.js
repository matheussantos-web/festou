import { describe, expect, it } from 'vitest'
import { checksumsOf } from '../../server/sql/migrationChecksum.js'

const sqlText = 'create table exemplo (\n  id uuid primary key\n);\n'

describe('checksum das migrations', () => {
  it('ignora a diferença entre CRLF e LF', () => {
    const lf = checksumsOf(sqlText)
    const crlf = checksumsOf(sqlText.replace(/\n/g, '\r\n'))

    expect(crlf.normalized).toBe(lf.normalized)
  })

  it('registra a variante CRLF para reconhecer bancos aplicados no Windows', () => {
    const lf = checksumsOf(sqlText)
    const crlf = checksumsOf(sqlText.replace(/\n/g, '\r\n'))

    expect(crlf.crlf).toBe(lf.crlf)
    expect(lf.crlf).not.toBe(lf.normalized)
  })

  it('muda quando o SQL muda de verdade', () => {
    const original = checksumsOf(sqlText)
    const editado = checksumsOf(sqlText.replace('exemplo', 'exemplo2'))

    expect(editado.normalized).not.toBe(original.normalized)
  })
})
