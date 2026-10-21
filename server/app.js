import 'dotenv/config'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import { appOrigin, jsonBodyLimit, trustProxy } from './config.js'
import { createErrorHandler, createNotFoundHandler } from './middleware/errors.js'
import { createOriginGuard } from './middleware/origin.js'
import { authRouter } from './routes/auth.js'
import { healthRouter } from './routes/health.js'
import { invitationsRouter } from './routes/invitations.js'
import { ordersRouter } from './routes/orders.js'
import { productsRouter, supplierProductsRouter } from './routes/products.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  // Sem trust proxy, o rate limit enxerga o IP do proxy reverso e o limite vira
  // global. O numero de proxies vem de TRUST_PROXY (0 = nenhum, 1 = nginx).
  app.set('trust proxy', trustProxy)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // Permite imagens de produtos hospedadas em dominios externos (imagem_url)
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  )
  app.use(express.json({ limit: jsonBodyLimit }))
  app.use(cookieParser())
  app.use('/api', createOriginGuard(appOrigin))

  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/invitations', invitationsRouter)
  app.use('/api/products', productsRouter)
  app.use('/api/supplier/products', supplierProductsRouter)
  app.use('/api/orders', ordersRouter)

  app.use('/api', createNotFoundHandler())

  const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')

  if (existsSync(distDir)) {
    app.use(express.static(distDir))

    app.use((request, response, next) => {
      if (request.method !== 'GET' && request.method !== 'HEAD') return next()
      if (request.path.startsWith('/api')) return next()

      response.sendFile(join(distDir, 'index.html'))
    })
  }

  app.use(createErrorHandler(jsonBodyLimit))

  return app
}

export const app = createApp()
