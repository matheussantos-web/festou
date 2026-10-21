import { neon } from '@neondatabase/serverless'

let sql

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL nao configurada. Copie .env.example para .env e preencha a conexao do Neon.')
  }

  sql ??= neon(connectionString)
  return sql
}