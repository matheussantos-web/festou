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
    .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
    .max(128, 'A senha pode ter no maximo 128 caracteres.'),
  tipo_perfil: z.enum(['cliente', 'fornecedor'], {
    error: 'Selecione cliente ou fornecedor.',
  }),
})

export const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  senha: z.string().min(1).max(128),
})
