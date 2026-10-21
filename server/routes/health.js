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
