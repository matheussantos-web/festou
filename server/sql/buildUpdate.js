// Monta o trecho SET de uma atualizacao parcial. Os nomes das colunas vem de
// uma lista fixa e os valores sao sempre parametrizados.
export function buildUpdate(fields, input) {
  const assignments = []
  const values = []

  for (const field of fields) {
    if (input[field] === undefined) continue
    assignments.push(`${field} = $${values.length + 1}`)
    values.push(input[field])
  }

  return { assignments, values }
}
