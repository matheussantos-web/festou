import { Router } from 'express'
import { getDatabase } from '../db.js'

export const healthRouter = Router()

healthRouter.get('/', async (_request, response, next) => {
  try {
    await getDatabase()`select 1`
    response.json({ status: 'ok' })
  } catch (error) {
    next(error)
  }
})

// Health check so aceita leitura: um POST aqui costuma ser erro de cliente e
// nao deve parecer "endpoint inexistente".
healthRouter.all('/', (_request, response) => {
  response.set('Allow', 'GET, HEAD')
  response.status(405).json({ message: 'Metodo nao permitido para este endpoint.' })
})
