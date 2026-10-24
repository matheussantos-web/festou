import { deflateSync } from 'node:zlib'

const WIDTH = 1200
const HEIGHT = 630
const CHANNELS = 4

const palettes = {
  jardim: { top: [232, 248, 235], bottom: [255, 248, 230], ink: [31, 74, 59], accent: [39, 132, 91], detail: [218, 163, 76] },
  colorido: { top: [50, 24, 100], bottom: [125, 28, 91], ink: [255, 255, 255], accent: [255, 224, 105], detail: [255, 184, 72] },
  'ceu-estrelado': { top: [17, 24, 63], bottom: [3, 6, 23], ink: [248, 250, 252], accent: [191, 219, 254], detail: [255, 230, 138] },
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

function centeredText(pixels, value, centerX, y, scale, color) {
  const text = normalizeText(value)
  const width = Math.max(0, text.length * 6 * scale - scale)
  drawInvitationText(pixels, text, Math.round(centerX - width / 2), y, scale, color)
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

function drawSkyDecoration(pixels) {
  const stars = [
    [92, 88, 3], [238, 148, 2], [391, 72, 2], [548, 131, 2],
    [728, 83, 2], [877, 151, 3], [1032, 116, 2], [1110, 214, 2],
    [128, 510, 2], [1061, 502, 3], [925, 553, 2], [294, 553, 2],
  ]
  const starColor = [219, 234, 254]

  for (const [centerX, centerY, radius] of stars) {
    for (let y = centerY - radius; y <= centerY + radius; y += 1) {
      for (let x = centerX - radius; x <= centerX + radius; x += 1) {
        if ((x - centerX) ** 2 + (y - centerY) ** 2 > radius ** 2) continue
        const offset = (y * WIDTH + x) * CHANNELS
        pixels[offset] = starColor[0]
        pixels[offset + 1] = starColor[1]
        pixels[offset + 2] = starColor[2]
        pixels[offset + 3] = 255
      }
    }
  }

  // Lua crescente no canto superior direito, como no tema CÃ©u Estrelado.
  roundedRect(pixels, 1030, 62, 52, 52, 26, [255, 230, 138])
  roundedRect(pixels, 1046, 52, 52, 52, 26, [29, 38, 83])
}

function wrapText(value, maxLength, maxLines = 2) {
  const words = normalizeText(value).split(' ').filter(Boolean)
  const lines = []
  let line = ''
  let truncated = false

  for (const word of words) {
    let remainingWord = word
    while (remainingWord) {
      const available = maxLength - line.length - (line ? 1 : 0)
      if (remainingWord.length <= available) {
        line = line ? `${line} ${remainingWord}` : remainingWord
        remainingWord = ''
      } else if (line && remainingWord.length <= maxLength) {
        lines.push(line)
        line = ''
        if (lines.length >= maxLines) {
          truncated = true
          break
        }
      } else if (available > 0 && line) {
        line += ` ${remainingWord.slice(0, available)}`
        remainingWord = remainingWord.slice(available)
      } else {
        if (line) lines.push(line)
        line = ''
        if (lines.length >= maxLines) {
          truncated = true
          break
        }
        if (remainingWord.length > maxLength) {
          lines.push(remainingWord.slice(0, maxLength))
          remainingWord = remainingWord.slice(maxLength)
          if (lines.length >= maxLines) truncated = Boolean(remainingWord)
        }
      }

      if (lines.length >= maxLines && remainingWord) {
        truncated = true
        break
      }
    }
    if (truncated) break
  }

  if (line && lines.length < maxLines) lines.push(line)
  if (truncated && lines.length) {
    const last = lines[lines.length - 1]
    lines[lines.length - 1] = `${last.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`
  }

  return lines
}

function titleScaleFor(length) {
  if (length <= 17) return 9
  if (length <= 19) return 8
  if (length <= 22) return 7
  if (length <= 26) return 6
  if (length <= 31) return 5
  return 4
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

  // A imagem OG representa somente o cartao: sem moldura externa, cabecalho,
  // acoes de pagina ou rodape. O fundo do cartao ocupa os 1200x630 pixels.
  if (invitation.tema === 'ceu-estrelado') drawSkyDecoration(pixels)

  centeredText(pixels, 'CONVITE DIGITAL', WIDTH / 2, 66, 4, palette.accent)
  centeredText(pixels, 'VOCE ESTA CONVIDADO PARA', WIDTH / 2, 124, 3, palette.ink)

  const title = normalizeText(invitation.titulo)
  const titleScale = titleScaleFor(title.length)
  const titleMaxLength = Math.floor(940 / (6 * titleScale))
  const titleLines = wrapText(title, titleMaxLength, 3)
  const titleLineHeight = titleScale * 9
  const titleY = 165
  titleLines.forEach((line, index) => centeredText(pixels, line, WIDTH / 2, titleY + index * titleLineHeight, titleScale, palette.ink))

  const host = wrapText(`COM CARINHO, ${invitation.anfitriao}`, 39, 2)
  const hostY = titleY + titleLines.length * titleLineHeight + 12
  host.forEach((line, index) => centeredText(pixels, line, WIDTH / 2, hostY + index * 30, 4, palette.accent))

  const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(invitation.data_evento))
  const dateLines = wrapText(date, 48, 2)
  const dateY = hostY + host.length * 30 + 22
  dateLines.forEach((line, index) => centeredText(pixels, line, WIDTH / 2, dateY + index * 27, 3, palette.ink))

  const locationLines = wrapText(`LOCAL: ${invitation.local_evento}`, 48, 2)
  const locationY = dateY + dateLines.length * 27 + 18
  locationLines.forEach((line, index) => centeredText(pixels, line, WIDTH / 2, locationY + index * 27, 3, palette.ink))

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
    pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}
