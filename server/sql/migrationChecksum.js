import { createHash } from 'node:crypto'

// O checksum ignora o fim de linha: o mesmo arquivo tem CRLF no Windows e LF
// no Linux (CI), e sem normalizar o banco aplicado em um sistema seria
// recusado no outro. A variante CRLF e aceita para reconhecer registros
// antigos e reescreve-los no formato normalizado.
export function checksumsOf(content) {
  const normalized = content.replace(/\r\n/g, '\n')
  const crlf = normalized.replace(/\n/g, '\r\n')

  return {
    normalized: createHash('sha256').update(normalized).digest('hex'),
    crlf: createHash('sha256').update(crlf).digest('hex'),
  }
}
