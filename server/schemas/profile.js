import { z } from 'zod'

const optionalUrl = (label) => z.string()
  .trim()
  .max(300, `${label} pode ter no maximo 300 caracteres.`)
  .refine((value) => !value || /^https?:\/\//i.test(value), `${label} precisa comecar com http:// ou https://.`)
  .transform((value) => value || null)

export const profileUpdateSchema = z.object({
  nome: z.string().trim().min(3, 'Informe um nome com pelo menos 3 caracteres.').max(100),
  whatsapp: z.string().trim().max(30).refine((value) => !value || /^[+\d()\s.-]{8,30}$/.test(value), 'Informe um WhatsApp valido.').transform((value) => value || null),
  biografia: z.string().trim().max(500, 'A biografia pode ter no maximo 500 caracteres.').transform((value) => value || null),
  instagram_url: optionalUrl('O link do Instagram'),
  facebook_url: optionalUrl('O link do Facebook'),
  site_url: optionalUrl('O site'),
})
