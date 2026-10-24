import { deflateSync } from 'node:zlib'

const WIDTH = 1200
const HEIGHT = 630
const CHANNELS = 4

const palettes = {
  jardim: { top: [224, 244, 230], bottom: [255, 245, 220], card: [255, 255, 250], ink: [31, 74, 59], accent: [39, 132, 91], detail: [218, 163, 76] },
  colorido: { top: [50, 24, 100], bottom: [184, 43, 111], card: [255, 248, 253], ink: [42, 25, 74], accent: [226, 54, 139], detail: [255, 184, 72] },
  'ceu-estrelado': { top: [15, 25, 66], bottom: [53, 48, 112], card: [244, 248, 255], ink: [26, 38, 82], accent: [40, 142, 190], detail: [255, 205, 105] },
}

const glyphRows = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'], B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'], D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'], F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'], H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'], J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'], L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'], N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'], P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'], R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'], T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'], V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'], X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'], Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'], 1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'], 3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'], 5: ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  6: ['01110', '10000', '10000', '11110', '10001', '10001', '01110'], 7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'], 9: ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'], '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '00110', '00110'], ',': ['00000', '00000', '00000', '00000', '00110', '00110', '00100'],
  ':': ['00000', '00110', '00110', '00000', '00110', '00110', '00000'], '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'], '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'], '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '\'': ['00100', '00100', '00000', '00000', '00000', '00000', '00000'],
}

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const name = Buffer.from(type)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])))
  return Buffer.concat([length, name, data, checksum])
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 .,:/!?&+'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function centeredText(value, centerX, y, scale, color, drawText) {
  const text = normalizeText(value)
  const width = Math.max(0, text.length * 6 * scale - scale)
  drawText(text, Math.round(centerX - width / 2), y, scale, color)
}

function roundedRect(pixels, x, y, width, height, radius, color) {
  const left = Math.max(0, x)
  const top = Math.max(0, y)
  const right = Math.min(WIDTH, x + width)
  const bottom = Math.min(HEIGHT, y + height)
  for (let py = top; py < bottom; py += 1) {
    for (let px = left; px < right; px += 1) {
      const cx = px < x + radius ? x + radius : px >= x + width - radius ? x + width - radius - 1 : px
      const cy = py < y + radius ? y + radius : py >= y + height - radius ? y + height - radius - 1 : py
      const dx = px - cx
      const dy = py - cy
      if (dx * dx + dy * dy > radius * radius) continue
      const offset = (py * WIDTH + px) * CHANNELS
      pixels[offset] = color[0]
      pixels[offset + 1] = color[1]
      pixels[offset + 2] = color[2]
      pixels[offset + 3] = 255
    }
  }
}

function drawInvitationText(pixels, value, x, y, scale, color) {
  const text = normalizeText(value)
  for (let index = 0; index < text.length; index += 1) {
    const rows = glyphRows[text[index]] || glyphRows[' ']
    for (let row = 0; row < rows.length; row += 1) {
      for (let column = 0; column < rows[row].length; column += 1) {
        if (rows[row][column] !== '1') continue
        for (let sy = 0; sy < scale; sy += 1) {
          for (let sx = 0; sx < scale; sx += 1) {
            const px = x + index * 6 * scale + column * scale + sx
            const py = y + row * scale + sy
            if (px < 0 || px >= WIDTH || py < 0 || py >= HEIGHT) continue
            const offset = (py * WIDTH + px) * CHANNELS
            pixels[offset] = color[0]
            pixels[offset + 1] = color[1]
            pixels[offset + 2] = color[2]
            pixels[offset + 3] = 255
          }
        }
      }
    }
  }
}

function wrapText(value, maxLength, maxLines = 2) {
  const words = normalizeText(value).split(' ').filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (candidate.length <= maxLength || !line) {
      line = candidate.slice(0, maxLength)
    } else {
      lines.push(line)
      line = word.slice(0, maxLength)
      if (lines.length === maxLines - 1) break
    }
  }
  if (line && lines.length < maxLines) lines.push(line)
  return lines
}

export function renderInvitationPng(invitation) {
  const palette = palettes[invitation.tema] || palettes.jardim
  const pixels = Buffer.alloc(WIDTH * HEIGHT * CHANNELS)

  for (let y = 0; y < HEIGHT; y += 1) {
    const ratio = y / (HEIGHT - 1)
    for (let x = 0; x < WIDTH; x += 1) {
      const offset = (y * WIDTH + x) * CHANNELS
      pixels[offset] = Math.round(palette.top[0] * (1 - ratio) + palette.bottom[0] * ratio)
      pixels[offset + 1] = Math.round(palette.top[1] * (1 - ratio) + palette.bottom[1] * ratio)
      pixels[offset + 2] = Math.round(palette.top[2] * (1 - ratio) + palette.bottom[2] * ratio)
      pixels[offset + 3] = 255
    }
  }

  // Cartao central e detalhes simples criam um visual coerente com cada tema.
  roundedRect(pixels, 93, 55, 1014, 520, 34, palette.card)
  roundedRect(pixels, 118, 80, 964, 8, 4, palette.accent)
  roundedRect(pixels, 490, 146, 220, 4, 2, palette.detail)

  centeredText('CONVITE DIGITAL', WIDTH / 2, 105, 3, palette.accent, (text, x, y, scale, color) => drawInvitationText(pixels, text, x, y, scale, color))
  centeredText('VOCE ESTA CONVIDADO PARA', WIDTH / 2, 174, 2, palette.ink, (text, x, y, scale, color) => drawInvitationText(pixels, text, x, y, scale, color))

  const titleLines = wrapText(invitation.titulo, 35, 2)
  const titleScale = titleLines.some((line) => line.length > 27) ? 4 : 5
  titleLines.forEach((line, index) => centeredText(line, WIDTH / 2, 208 + index * 48, titleScale, palette.ink, (text, x, y, scale, color) => drawInvitationText(pixels, text, x, y, scale, color)))

  const host = normalizeText(invitation.anfitriao)
  centeredText(`COM CARINHO, ${host}`.slice(0, 48), WIDTH / 2, 322, 3, palette.accent, (text, x, y, scale, color) => drawInvitationText(pixels, text, x, y, scale, color))

  const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(invitation.data_evento))
  centeredText(normalizeText(date), WIDTH / 2, 394, 2, palette.ink, (text, x, y, scale, color) => drawInvitationText(pixels, text, x, y, scale, color))
  const locationLines = wrapText(invitation.local_evento, 42, 2)
  locationLines.forEach((line, index) => centeredText(`LOCAL: ${line}`.slice(0, 48), WIDTH / 2, 434 + index * 22, 2, palette.ink, (text, x, y, scale, color) => drawInvitationText(pixels, text, x, y, scale, color)))

  roundedRect(pixels, 500, 520, 200, 3, 1, palette.detail)
  centeredText('FESTOU!', WIDTH / 2, 540, 3, palette.accent, (text, x, y, scale, color) => drawInvitationText(pixels, text, x, y, scale, color))

  const scanlines = Buffer.alloc((WIDTH * CHANNELS + 1) * HEIGHT)
  for (let y = 0; y < HEIGHT; y += 1) {
    const rowOffset = y * (WIDTH * CHANNELS + 1)
    scanlines[rowOffset] = 0
    pixels.copy(scanlines, rowOffset + 1, y * WIDTH * CHANNELS, (y + 1) * WIDTH * CHANNELS)
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(WIDTH, 0)
  header.writeUInt32BE(HEIGHT, 4)
  header[8] = 8 // bits per channel
  header[9] = 6 // RGBA
  header[10] = 0
  header[11] = 0
  header[12] = 0

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}
