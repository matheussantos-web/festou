import { randomUUID } from 'node:crypto'
import { Router, raw } from 'express'
import { rateLimit } from 'express-rate-limit'
import { getDatabase } from '../db.js'
import { requireUser } from '../middleware/session.js'

export const uploadsRouter = Router()

const imageTypes = new Map([
  ['image/jpeg', { extension: 'jpg', matches: (file) => file[0] === 0xff && file[1] === 0xd8 && file[2] === 0xff }],
  ['image/png', { extension: 'png', matches: (file) => file.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) }],
  ['image/webp', { extension: 'webp', matches: (file) => file.toString('ascii', 0, 4) === 'RIFF' && file.toString('ascii', 8, 12) === 'WEBP' }],
])
const imageBody = raw({ type: [...imageTypes.keys()], limit: '5mb' })
const bucketByKind = { product: 'produtos', profile: 'perfil' }
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (request) => request.user.id,
  message: { message: 'Voce enviou muitas fotos. Aguarde alguns minutos e tente novamente.' },
})

class StorageError extends Error {
  constructor(message, status = 502) {
    super(message)
    this.status = status
  }
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '')
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null

  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== 'localhost') return null
  } catch {
    return null
  }

  return { url, key }
}

async function checkPublicBucket({ url, key }, bucket) {
  const response = await fetch(`${url}/storage/v1/bucket/${bucket}`, {
    headers: { apikey: key },
    signal: AbortSignal.timeout(10000),
  })
  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new StorageError(result.message || `Nao foi possivel acessar o bucket ${bucket}.`, response.status)
  }
  if (result.public !== true) {
    throw new StorageError(`O bucket ${bucket} precisa estar publico para exibir as fotos no Festou.`, 400)
  }
}

function fileExtension(file, contentType) {
  const definition = imageTypes.get(contentType)
  return definition?.matches(file) ? definition.extension : null
}

async function uploadToSupabase(bucket, path, file, contentType, config) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  const response = await fetch(`${config.url}/storage/v1/object/${bucket}/${encodedPath}`, {
    method: 'POST',
    headers: {
      apikey: config.key,
      'Content-Type': contentType,
      'Cache-Control': 'max-age=31536000',
      'x-upsert': 'false',
    },
    body: file,
    signal: AbortSignal.timeout(20000),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new StorageError(result.message || result.error || 'O Supabase nao conseguiu salvar a imagem.', response.status)
  }

  return `${config.url}/storage/v1/object/public/${bucket}/${encodedPath}`
}

async function uploadImage(request, response, next, kind) {
  try {
    const bucket = bucketByKind[kind]
    const config = getSupabaseConfig()
    if (!config) {
      return response.status(503).json({ message: 'Configure SUPABASE_URL e SUPABASE_SECRET_KEY no servidor.' })
    }

    const file = request.body
    const contentType = request.get('content-type')?.split(';')[0].trim().toLowerCase()
    const extension = Buffer.isBuffer(file) ? fileExtension(file, contentType) : null
    if (!extension) {
      return response.status(400).json({ message: 'Envie uma imagem JPG, PNG ou WebP valida.' })
    }

    await checkPublicBucket(config, bucket)
    const path = `${request.user.id}/${randomUUID()}.${extension}`
    const imageUrl = await uploadToSupabase(bucket, path, file, contentType, config)

    if (kind === 'profile') {
      const sql = getDatabase()
      const [profile] = await sql`
        update public.perfis
        set avatar_url = ${imageUrl}
        where id = ${request.user.id}
        returning avatar_url
      `
      return response.json({ image_url: profile.avatar_url, user: { ...request.user, avatar_url: profile.avatar_url } })
    }

    return response.status(201).json({ image_url: imageUrl })
  } catch (error) {
    if (error instanceof StorageError) {
      return response.status(error.status >= 500 ? 502 : 400).json({ message: error.message })
    }
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return response.status(504).json({ message: 'O envio demorou demais. Tente novamente.' })
    }
    return next(error)
  }
}

uploadsRouter.post('/product', requireUser, uploadLimiter, imageBody, async (request, response, next) => {
  if (request.user.tipo_perfil !== 'fornecedor') {
    return response.status(403).json({ message: 'Somente fornecedores podem enviar fotos de produtos.' })
  }
  return uploadImage(request, response, next, 'product')
})

uploadsRouter.post('/profile', requireUser, uploadLimiter, imageBody, async (request, response, next) => {
  return uploadImage(request, response, next, 'profile')
})
