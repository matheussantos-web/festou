import 'dotenv/config'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import { appOrigin, jsonBodyLimit, trustProxy } from './config.js'
import { getDatabase } from './db.js'
import { buildInvitationMeta, injectMeta } from './meta.js'
import { renderInvitationPng } from './invitationImage.js'
import { createErrorHandler, createNotFoundHandler } from './middleware/errors.js'
import { createOriginGuard } from './middleware/origin.js'
import { authRouter } from './routes/auth.js'
import { healthRouter } from './routes/health.js'
import { invitationsRouter } from './routes/invitations.js'
import { ordersRouter } from './routes/orders.js'
import { passwordResetRouter } from './routes/passwordReset.js'
import { productsRouter, supplierProductsRouter } from './routes/products.js'
import { uploadsRouter } from './routes/uploads.js'

function requestOrigin(request) {
  const host = request.get('host')
  return host ? `${request.protocol}://${host}` : appOrigin
}

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
  app.use('/api/auth', passwordResetRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/invitations', invitationsRouter)
  app.use('/api/products', productsRouter)
  app.use('/api/supplier/products', supplierProductsRouter)
  app.use('/api/uploads', uploadsRouter)
  app.use('/api/orders', ordersRouter)

  app.use('/api', createNotFoundHandler())

  const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')

  if (existsSync(distDir)) {
    const indexPath = join(distDir, 'index.html')
    let indexHtmlPromise = null
    const readIndexHtml = () => {
      indexHtmlPromise ??= readFile(indexPath, 'utf8')
      return indexHtmlPromise
    }

    // Imagem PNG publica renderizada no servidor a partir dos dados do convite.
    // O formato raster funciona com crawlers que nao executam o Vue nem aceitam SVG.
    app.get('/convite/:slug/imagem.png', async (request, response, next) => {
      try {
        const sql = getDatabase()
        const [invitation] = await sql`
          select slug, titulo, anfitriao, data_evento, local_evento, tema
          from public.convites
          where slug = ${request.params.slug}
          limit 1
        `

        if (!invitation) return response.status(404).type('text').send('Convite nao encontrado.')

        response.set({
          'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
          'X-Content-Type-Options': 'nosniff',
        })
        return response.type('png').send(renderInvitationPng(invitation))
      } catch (error) {
        return next(error)
      }
    })

    // Link público do convite: injeta as tags de prévia no HTML, porque os
    // robôs do WhatsApp e das redes sociais não executam o SPA.
    app.get('/convite/:slug', async (request, response, next) => {
      try {
        const sql = getDatabase()
        const [invitation] = await sql`
          select slug, titulo, anfitriao, data_evento, local_evento, mensagem, tema
          from public.convites
          where slug = ${request.params.slug}
          limit 1
        `

        const html = await readIndexHtml()

        if (!invitation) {
          response.set('Cache-Control', 'no-cache')
          return response.type('html').send(html)
        }

        const meta = buildInvitationMeta(invitation, requestOrigin(request))
        response.set('Cache-Control', 'no-cache')
        return response.type('html').send(injectMeta(html, meta))
      } catch (error) {
        // Banco fora do ar: entrega o SPA normal em vez de quebrar o link.
        try {
          const html = await readIndexHtml()
          response.set('Cache-Control', 'no-cache')
          return response.type('html').send(html)
        } catch {
          return next(error)
        }
      }
    })

    // Os arquivos de assets carregam hash no nome, entao podem ficar em cache
    // por muito tempo; o index.html precisa ser revalidado a cada acesso.
    app.use('/assets', express.static(join(distDir, 'assets'), {
      maxAge: '1y',
      immutable: true,
    }))
    app.use(express.static(distDir, { maxAge: '1h' }))

    app.use(async (request, response, next) => {
      if (request.method !== 'GET' && request.method !== 'HEAD') return next()
      if (request.path.startsWith('/api')) return next()

      try {
        const html = await readIndexHtml()
        response.set('Cache-Control', 'no-cache')
        response.type('html').send(html)
      } catch (error) {
        next(error)
      }
    })
  }

  app.use(createErrorHandler(jsonBodyLimit))

  return app
}

export const app = createApp()
