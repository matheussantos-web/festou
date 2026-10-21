import 'dotenv/config'
import { readdir, readFile } from 'node:fs/promises'
import { getDatabase } from './db.js'
import { checksumsOf } from './sql/migrationChecksum.js'

// Cada migration e um arquivo .sql numerado em server/migrations. O que ja foi
// aplicado fica registrado em public.schema_migrations com o checksum do
// arquivo, entao rodar de novo nao repete nada e arquivo editado e recusado.
const migrationsDir = new URL('./migrations/', import.meta.url)

function splitStatements(content) {
  return content
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean)
}

// O checksum normalizado e o mesmo em qualquer sistema operacional.

const sql = getDatabase()

await sql`
  create table if not exists public.schema_migrations (
    nome text primary key,
    checksum text not null,
    applied_at timestamptz not null default now()
  )
`

const files = (await readdir(migrationsDir))
  .filter((file) => file.endsWith('.sql'))
  .sort()

const applied = await sql`select nome, checksum from public.schema_migrations`
const appliedByName = new Map(applied.map((row) => [row.nome, row.checksum]))

let pending = 0

for (const file of files) {
  const content = await readFile(new URL(file, migrationsDir), 'utf8')
  const checksum = checksumsOf(content)
  const previousChecksum = appliedByName.get(file)

  if (previousChecksum) {
    if (previousChecksum !== checksum.normalized) {
      if (previousChecksum === checksum.crlf) {
        await sql`
          update public.schema_migrations
          set checksum = ${checksum.normalized}
          where nome = ${file}
        `
        console.log(`Checksum de ${file} normalizado (fim de linha).`)
        continue
      }

      throw new Error(
        `A migration ${file} mudou depois de aplicada. Crie uma nova migration com outro numero.`,
      )
    }
    continue
  }

  const statements = splitStatements(content)

  await sql.transaction(statements.map((statement) => sql.query(statement)))

  await sql`
    insert into public.schema_migrations (nome, checksum)
    values (${file}, ${checksum.normalized})
  `

  pending += 1
  console.log(`Migration aplicada: ${file} (${statements.length} statements)`)
}

console.log(
  pending === 0
    ? `Neon schema pronto (${files.length} migrations, nada pendente).`
    : `Neon schema pronto (${pending} de ${files.length} migrations aplicadas agora).`,
)
