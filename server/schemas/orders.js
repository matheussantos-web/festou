import { z } from 'zod'

export const orderSchema = z.object({
  items: z.array(z.object({
    produto_id: z.string().uuid(),
    quantidade: z.number().int().min(1).max(20),
  })).min(1).max(50),
  observacao: z.string().trim().max(500).optional().transform((value) => value || null),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['solicitado', 'em_negociacao', 'negocio_fechado', 'servico_concluido', 'recusado', 'cancelado'], {
    errorMap: () => ({ message: 'Status do pedido inválido.' }),
  }),
})

export const orderReviewSchema = z.object({
  nota: z.number().int().min(1).max(5),
  comentario: z.string().trim().max(1000).optional().transform((value) => value || null),
})

export const orderStatusEnum = updateOrderStatusSchema.shape.status
