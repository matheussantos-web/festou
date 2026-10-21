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

  return {
    title,
    description,
    url,
    image: `${origin}/festou-marca.png`,
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

  return withTitle.replace('</head>', `  ${tags}\n  </head>`)
}
