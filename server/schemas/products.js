import { z } from 'zod'
import { PRODUCT_CATEGORY_VALUES } from '../../shared/productCategories.js'

export const categorySchema = z.enum(PRODUCT_CATEGORY_VALUES)

// Imagens de produto ficam em servidores externos: só https é aceito, para
// não misturar http com https na página e não vazar tráfego em claro.
export const httpsUrl = z.string().trim()
  .url('Informe um link valido.')
  .max(2048)
  .refine((value) => new URL(value).protocol === 'https:', {
    message: 'O link da imagem precisa usar https.',
  })

export const productSchema = z.object({
  nome: z.string().trim().min(3).max(120),
  categoria: categorySchema,
  descricao: z.string().trim().min(10).max(1000),
  preco: z.coerce.number().finite().positive().max(99999999),
  cidade: z.string().trim().max(100).optional().transform((value) => value || null),
  imagem_url: z.union([z.literal(''), httpsUrl])
    .optional()
    .transform((value) => value || null),
  imagens_url: z.array(httpsUrl).max(5, 'Adicione no maximo 5 fotos.')
    .optional()
    .default([]),
})

export const productUpdateSchema = productSchema.partial().refine(
  (value) => Object.values(value).some((field) => field !== undefined),
  { message: 'Informe ao menos um campo para atualizar o produto.' },
)
