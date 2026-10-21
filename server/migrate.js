import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { getDatabase } from './db.js'

const schemaUrl = new URL('./schema.sql', import.meta.url)
const schema = await readFile(schemaUrl, 'utf8')
const statements = schema
  .split(/;\s*(?:\r?\n|$)/)
  .map((statement) => statement.trim())
  .filter(Boolean)

const sql = getDatabase()

for (const statement of statements) {
  await sql.query(statement)
}

console.log(`Neon schema ready (${statements.length} statements).`)