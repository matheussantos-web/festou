import 'dotenv/config'
import { pathToFileURL } from 'node:url'
import { host, port } from './config.js'
import { app } from './app.js'

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectRun) {
  app.listen(port, host, () => {
    console.log(`Festou API listening on http://${host}:${port}`)
  })
}

export { app }
