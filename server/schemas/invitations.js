import { z } from 'zod'

export const invitationSchema = z.object({
  titulo: z.string().trim().min(3).max(100),
  anfitriao: z.string().trim().min(2).max(100),
  data_evento: z.string().datetime({ offset: true }).refine(
    (value) => new Date(value).getTime() > Date.now(),
    'A data do evento precisa estar no futuro.',
  ),
  local_evento: z.string().trim().min(3).max(180),
  mensagem: z.string().trim().max(500).optional().transform((value) => value || null),
  tema: z.enum(['jardim', 'colorido', 'ceu-estrelado']),
})

export const invitationUpdateSchema = z.object({
  titulo: z.string().trim().min(3).max(100).optional(),
  anfitriao: z.string().trim().min(2).max(100).optional(),
  data_evento: z.string().datetime({ offset: true }).refine(
    (value) => new Date(value).getTime() > Date.now(),
    'A data do evento precisa estar no futuro.',
  ).optional(),
  local_evento: z.string().trim().min(3).max(180).optional(),
  mensagem: z.string().trim().max(500).optional().transform((value) => value || null),
  tema: z.enum(['jardim', 'colorido', 'ceu-estrelado']).optional(),
}).refine(
  (value) => Object.values(value).some((field) => field !== undefined),
  { message: 'Informe ao menos um campo para atualizar o convite.' },
)

export const rsvpStatusSchema = z.object({
  aceita_rsvp: z.boolean({ required_error: 'Informe o estado de aceitação de confirmação.' }),
})

export const rsvpSchema = z.object({
  nome: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()).optional(),
  response_token: z.string().uuid().optional(),
  resposta: z.enum(['confirmado', 'recusado', 'talvez']),
  quantidade_pessoas: z.number().int().min(0).max(10),
  mensagem: z.string().trim().max(300).optional().transform((value) => value || null),
}).refine((value) => value.email || value.response_token, {
  message: 'Nao foi possivel identificar esta resposta. Atualize a pagina e tente novamente.',
  path: ['response_token'],
})
