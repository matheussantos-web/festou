import { invitationImageVersion } from '../shared/invitationImageVersion.js'

const htmlEscapes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => htmlEscapes[char])
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
})

export function buildInvitationMeta(invitation, origin) {
  const when = dateFormatter.format(new Date(invitation.data_evento))
  const title = `${invitation.titulo} — convite de ${invitation.anfitriao}`
  const description = `${when} · ${invitation.local_evento}. Confirme sua presença.`
  const url = `${origin}/convite/${invitation.slug}`
  const image = `${url}/imagem.png?v=${invitationImageVersion(invitation)}`

  return {
    title,
    description,
    url,
    image,
    imageAlt: `Convite de ${invitation.titulo} para ${invitation.anfitriao}`,
  }
}

// O SPA é servido pelo próprio Express, mas os robôs de prévia (WhatsApp,
// Telegram, redes sociais) não executam JavaScript. As tags por convite são
// injetadas no HTML antes de enviar.
export function injectMeta(html, meta) {
  const tags = [
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Festou!" />',
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.url)}" />`,
    `<meta property="og:image" content="${escapeHtml(meta.image)}" />`,
    '<meta property="og:image:type" content="image/png" />',
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${escapeHtml(meta.imageAlt || meta.title)}" />`,
    '<meta property="og:locale" content="pt_BR" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(meta.image)}" />`,
  ].join('\n    ')

  const withTitle = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(meta.title)}</title>`,
  )

  if (!withTitle.includes('</head>')) return withTitle

  const tagsToInsert = tags.split('\n    ')
  let result = withTitle
  const missingTags = []

  for (const tag of tagsToInsert) {
    const identity = tag.match(/^<meta\s+(name|property)="([^"]+)"/i)
    if (!identity) {
      missingTags.push(tag)
      continue
    }

    const [, attribute, value] = identity
    const escapedAttribute = attribute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const existing = new RegExp(`<meta\\s+(?=[^>]*\\b${escapedAttribute}=["']${escapedValue}["'])[^>]*\\/?\\s*>`, 'i')

    if (existing.test(result)) result = result.replace(existing, tag)
    else missingTags.push(tag)
  }

  return result.replace('</head>', `${missingTags.join('\n    ')}\n  </head>`)
}
