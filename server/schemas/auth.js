import { z } from 'zod'

export const registerSchema = z.object({
  nome: z.string().trim()
    .min(3, 'Informe um nome com pelo menos 3 caracteres.')
    .max(100, 'O nome pode ter no maximo 100 caracteres.'),
  email: z.string().trim()
    .email('Informe um e-mail valido, como nome@dominio.com.')
    .max(254, 'O e-mail pode ter no maximo 254 caracteres.')
    .transform((email) => email.toLowerCase()),
  senha: z.string()
    .min(12, 'A senha precisa ter pelo menos 12 caracteres.')
    .max(128, 'A senha pode ter no maximo 128 caracteres.'),
  tipo_perfil: z.enum(['cliente', 'fornecedor'], {
    error: 'Selecione cliente ou fornecedor.',
  }),
  telefone: z.string().trim().max(30).optional().transform((value) => value || null),
  cidade: z.string().trim().max(100).optional().transform((value) => value || null),
  segmento: z.string().trim().max(100).optional().transform((value) => value || null),
})

export const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  senha: z.string().min(1).max(128),
  tipo_perfil: z.enum(['cliente', 'fornecedor']).optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim()
    .email('Informe um e-mail valido, como nome@dominio.com.')
    .max(254)
    .transform((email) => email.toLowerCase()),
})

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(20, 'Informe o link completo recebido por e-mail.').max(200),
  senha: z.string()
    .min(12, 'A senha precisa ter pelo menos 12 caracteres.')
    .max(128, 'A senha pode ter no maximo 128 caracteres.'),
})

export const emailSchema = z.object({
  email: z.string().trim()
    .email('Informe um e-mail valido, como nome@dominio.com.')
    .max(254)
    .transform((email) => email.toLowerCase()),
})

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(20, 'Link de confirmacao invalido.').max(200),
})
