import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const WIDTH = 1200
const HEIGHT = 630
const RENDER_SCALE = 2
const brandLogo = readFileSync(new URL('../public/festou-logo-horizontal.png', import.meta.url)).toString('base64')

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function wrapText(value, maxLength, maxLines = 2) {
  const words = String(value ?? '').trim().split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (candidate.length <= maxLength) {
      line = candidate
      continue
    }

    if (line) lines.push(line)
    line = word
    if (lines.length === maxLines) break
  }

  if (line && lines.length < maxLines) lines.push(line)

  const content = lines.join(' ')
  const original = words.join(' ')
  if (content.length < original.length && lines.length) {
    const last = lines.length - 1
    lines[last] = `${lines[last].replace(/[.,;:!?\s]+$/, '').slice(0, Math.max(1, maxLength - 1))}…`
  }

  return lines
}

function textLines(lines, { x = WIDTH / 2, y, lineHeight, className = '' }) {
  return `<text class="${className}" x="${x}" y="${y}" text-anchor="middle">${lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join('')}</text>`
}

function star(cx, cy, radius, fill, opacity = 0.9) {
  const points = Array.from({ length: 10 }, (_, index) => {
    const angle = (Math.PI * index) / 5 - Math.PI / 2
    const pointRadius = index % 2 ? radius * 0.42 : radius
    return `${(cx + Math.cos(angle) * pointRadius).toFixed(1)},${(cy + Math.sin(angle) * pointRadius).toFixed(1)}`
  }).join(' ')
  return `<polygon points="${points}" fill="${fill}" opacity="${opacity}"/>`
}

function balloon(cx, cy, fill, scale = 1) {
  return `<g opacity=".88"><ellipse cx="${cx}" cy="${cy}" rx="${14 * scale}" ry="${19 * scale}" fill="${fill}"/><path d="M${cx - 3 * scale} ${cy + 18 * scale} L${cx} ${cy + 23 * scale} L${cx + 3 * scale} ${cy + 18 * scale}" fill="${fill}"/><path d="M${cx} ${cy + 23 * scale} C${cx - 4 * scale} ${cy + 40 * scale}, ${cx + 5 * scale} ${cy + 48 * scale}, ${cx} ${cy + 61 * scale}" fill="none" stroke="#FFFFFF" stroke-opacity=".6" stroke-width="1.5"/></g>`
}

function getEventDate(value) {
  if (!value) return 'Data a confirmar'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data a confirmar'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(date)
}

function buildInvitationSvg(invitation) {
  const title = invitation.titulo || 'Sua festa com a gente'
  const titleSize = title.length < 25 ? 52 : title.length < 40 ? 46 : 40
  const titleLines = wrapText(title, Math.floor(1000 / (titleSize * 0.57)), 2)
  const titleY = 218
  const titleLineHeight = titleSize * 1.08
  const titleLastBaseline = titleY + (titleLines.length - 1) * titleLineHeight

  const message = invitation.mensagem || 'Você está convidado para celebrar com a gente!'
  const messageLines = wrapText(message, 72, 2)
  const messageY = titleLastBaseline + titleSize * 0.88
  const messageLineHeight = 31
  const messageLastBaseline = messageY + (messageLines.length - 1) * messageLineHeight

  const panelY = Math.min(402, Math.max(368, messageLastBaseline + 43))
  const dateLines = wrapText(getEventDate(invitation.data_evento), 40, 2)
  const locationLines = wrapText(invitation.local_evento || 'Local a confirmar', 38, 2)

  const titleMarkup = textLines(titleLines, {
    y: titleY,
    lineHeight: titleLineHeight,
    className: 'title',
  })
  const messageMarkup = textLines(messageLines, {
    y: messageY,
    lineHeight: messageLineHeight,
    className: 'message',
  })
  const dateMarkup = textLines(dateLines, {
    x: 352,
    y: panelY + 83,
    lineHeight: 29,
    className: 'detail-value',
  })
  const locationMarkup = textLines(locationLines, {
    x: 848,
    y: panelY + 83,
    lineHeight: 29,
    className: 'detail-value',
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1A1A3D"/>
        <stop offset="58%" stop-color="#35165D"/>
        <stop offset="100%" stop-color="#7B1FA2"/>
      </linearGradient>
      <radialGradient id="glow">
        <stop offset="0%" stop-color="#FF2D9B" stop-opacity=".24"/>
        <stop offset="100%" stop-color="#FF2D9B" stop-opacity="0"/>
      </radialGradient>
      <style>
        text { font-family: Inter, "DejaVu Sans", Arial, sans-serif; }
        .title { fill: #FFFFFF; font-size: ${titleSize}px; font-weight: 800; letter-spacing: -.6px; }
        .message { fill: #FFD93B; font-size: 23px; font-weight: 600; }
        .detail-label { fill: #FFD93B; font-size: 14px; font-weight: 800; letter-spacing: 1.8px; }
        .detail-value { fill: #FFFFFF; font-size: 21px; font-weight: 700; }
      </style>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#background)"/>
    <circle cx="76" cy="88" r="210" fill="url(#glow)"/>
    <circle cx="1110" cy="526" r="240" fill="url(#glow)"/>

    ${star(78, 75, 13, '#FFD93B')}
    ${star(1120, 91, 11, '#00C2D1')}
    ${star(92, 478, 10, '#FF2D9B')}
    ${star(1105, 450, 13, '#FFD93B')}
    <circle cx="155" cy="161" r="4" fill="#FFFFFF" opacity=".8"/>
    <circle cx="1051" cy="178" r="4" fill="#FFFFFF" opacity=".75"/>
    <rect x="111" y="321" width="8" height="22" rx="4" fill="#00C2D1" transform="rotate(18 115 332)"/>
    <rect x="1082" y="319" width="8" height="22" rx="4" fill="#FF2D9B" transform="rotate(-18 1086 330)"/>
    ${balloon(75, 260, '#FF2D9B', 1.05)}
    ${balloon(1126, 263, '#00C2D1', 1.05)}

    <image x="420" y="15" width="360" height="146" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${brandLogo}" xlink:href="data:image/png;base64,${brandLogo}"/>
    ${titleMarkup}
    ${messageMarkup}

    <g>
      <rect x="126" y="${panelY}" width="452" height="142" rx="22" fill="#FFFFFF" fill-opacity=".09" stroke="#FFFFFF" stroke-opacity=".24" stroke-width="1.5"/>
      <rect x="622" y="${panelY}" width="452" height="142" rx="22" fill="#FFFFFF" fill-opacity=".09" stroke="#FFFFFF" stroke-opacity=".24" stroke-width="1.5"/>
      <text class="detail-label" x="352" y="${panelY + 49}" text-anchor="middle">DATA E HORÁRIO</text>
      <text class="detail-label" x="848" y="${panelY + 49}" text-anchor="middle">LOCAL</text>
      ${dateMarkup}
      ${locationMarkup}
    </g>
  </svg>`
}

/**
 * Renderiza o cartão em SVG vetorial e o rasteriza em 2x antes de reduzi-lo
 * com Lanczos para o formato OG 1200 x 630. O texto permanece nítido e a logo
 * mantém o canal alfa ao ser composta diretamente sobre o fundo roxo.
 */
export async function renderInvitationPng(invitation) {
  const svg = Buffer.from(buildInvitationSvg(invitation))

  return sharp(svg, { density: 72 * RENDER_SCALE })
    .resize(WIDTH, HEIGHT, {
      fit: 'fill',
      kernel: 'lanczos3',
      fastShrinkOnLoad: false,
    })
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toBuffer()
}
