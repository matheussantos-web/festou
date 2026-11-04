import 'dotenv/config'
import { pathToFileURL } from 'node:url'
import { host, port, productionConfigWarnings } from './config.js'
import { app } from './app.js'

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectRun) {
  const warnings = productionConfigWarnings()
  if (warnings.length > 0) {
    console.warn('\n[config] Revise estas variaveis antes do lancamento:')
    for (const warning of warnings) console.warn(`  - ${warning}`)
    console.warn('')
  }

  const server = app.listen(port, host, () => {
    console.log(`Festou API listening on http://${host}:${port}`)
  })

  // Em PaaS e containers o processo recebe SIGTERM no deploy. Fechar o servidor
  // evita cortar requisicoes em andamento (pagamentos/RSVP pela metade).
  let shuttingDown = false
  const shutdown = (signal) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`Recebido ${signal}. Encerrando o servidor...`)
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

export { app }
