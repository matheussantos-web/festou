import { Router } from 'express'
import { getDatabase } from '../db.js'
import { requireUser } from '../middleware/session.js'
import { profileUpdateSchema } from '../schemas/profile.js'

export const profileRouter = Router()

profileRouter.get('/', requireUser, async (request, response, next) => {
  try {
    const sql = getDatabase()
    const [profile] = await sql`
      select id, nome, email, tipo_perfil, avatar_url, cover_url, whatsapp,
             biografia, instagram_url, facebook_url, site_url
      from public.perfis
      where id = ${request.user.id}
      limit 1
    `
    if (!profile) return response.status(404).json({ message: 'Perfil nao encontrado.' })
    response.json({ user: profile })
  } catch (error) {
    next(error)
  }
})

profileRouter.patch('/', requireUser, async (request, response, next) => {
  try {
    const input = profileUpdateSchema.parse(request.body)
    const sql = getDatabase()
    const [profile] = await sql`
      update public.perfis
      set nome = ${input.nome},
          whatsapp = ${input.whatsapp},
          biografia = ${input.biografia},
          instagram_url = ${input.instagram_url},
          facebook_url = ${input.facebook_url},
          site_url = ${input.site_url}
      where id = ${request.user.id}
      returning id, nome, email, tipo_perfil, avatar_url, cover_url, whatsapp,
                biografia, instagram_url, facebook_url, site_url
    `
    if (!profile) return response.status(404).json({ message: 'Perfil nao encontrado.' })
    response.json({ user: profile })
  } catch (error) {
    next(error)
  }
})
