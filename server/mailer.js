import { isProduction, mailFrom, resendApiKey } from './config.js'

// Envio de e-mail em um único lugar. Com RESEND_API_KEY definida, usa a API
// HTTP do Resend; sem ela, registra no console fora de produção e apenas
// avisa em produção — assim o fluxo não quebra por falta de provedor.
export async function sendMail({ to, subject, text }) {
  if (!resendApiKey) {
    if (isProduction) {
      console.error('[mailer] RESEND_API_KEY ausente: nenhum e-mail foi enviado.')
      return { delivered: false }
    }

    console.log(`[mailer] para ${to}\nAssunto: ${subject}\n${text}\n`)
    return { delivered: false }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: mailFrom, to, subject, text }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Falha ao enviar e-mail (${response.status}): ${detail.slice(0, 200)}`)
  }

  return { delivered: true }
}
