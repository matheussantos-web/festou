import { readFileSync } from 'node:fs'
import { deflateSync, inflateSync } from 'node:zlib'

const WIDTH = 1200
const HEIGHT = 630
const CHANNELS = 4

const brand = {
  top: [26, 26, 61], // #1A1A3D
  bottom: [123, 31, 162], // #7B1FA2
  white: [255, 255, 255],
  yellow: [255, 217, 56],
  pink: [255, 45, 152],
  cyan: [0, 194, 209],
}

// Versao horizontal processada para remover o fundo branco do arquivo original.
const brandLogo = decodeBrandPng(readFileSync(new URL('../public/festou-logo-horizontal.png', import.meta.url)))

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

// Decodifica PNG RGB ou RGBA uma vez para compor o logo com seu canal alpha.
function decodeBrandPng(buffer) {
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  const imageData = []

  for (let offset = 8; offset < buffer.length;) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    const data = buffer.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
    } else if (type === 'IDAT') {
      imageData.push(data)
    } else if (type === 'IEND') {
      break
    }
    offset += length + 12
  }

  if (bitDepth !== 8 || ![2, 6].includes(colorType) || !width || !height) {
    throw new Error('A logo do Festou precisa ser uma PNG RGB/RGBA de 8 bits.')
  }

  const channels = colorType === 6 ? 4 : 3
  const bytesPerPixel = channels
  const rowLength = width * bytesPerPixel
  const compressedPixels = inflateSync(Buffer.concat(imageData))
  const pixels = Buffer.alloc(rowLength * height)
  let sourceOffset = 0

  for (let y = 0; y < height; y += 1) {
    const filter = compressedPixels[sourceOffset]
    sourceOffset += 1
    const rowOffset = y * rowLength
    const previousRowOffset = rowOffset - rowLength

    for (let x = 0; x < rowLength; x += 1) {
      const raw = compressedPixels[sourceOffset + x]
      const left = x >= bytesPerPixel ? pixels[rowOffset + x - bytesPerPixel] : 0
      const above = y ? pixels[previousRowOffset + x] : 0
      const upperLeft = y && x >= bytesPerPixel ? pixels[previousRowOffset + x - bytesPerPixel] : 0
      let predictor = 0

      if (filter === 1) predictor = left
      else if (filter === 2) predictor = above
      else if (filter === 3) predictor = Math.floor((left + above) / 2)
      else if (filter === 4) {
        const estimate = left + above - upperLeft
        const leftDistance = Math.abs(estimate - left)
        const aboveDistance = Math.abs(estimate - above)
        const upperLeftDistance = Math.abs(estimate - upperLeft)
        predictor = leftDistance <= aboveDistance && leftDistance <= upperLeftDistance
          ? left
          : aboveDistance <= upperLeftDistance ? above : upperLeft
      } else if (filter !== 0) {
        throw new Error(`Filtro PNG nao suportado no brand kit: ${filter}`)
      }

      pixels[rowOffset + x] = (raw + predictor) & 0xff
    }

    sourceOffset += rowLength
  }

  return { width, height, channels, pixels }
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

function drawBrandLogo(pixels) {
  // Sem placa/container: os pixels transparentes revelam o fundo roxo do card.
  const targetWidth = 350
  const targetHeight = Math.round(targetWidth * brandLogo.height / brandLogo.width)
  const targetX = Math.round((WIDTH - targetWidth) / 2)
  const targetY = 16

  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = (y + 0.5) * brandLogo.height / targetHeight - 0.5
    const sourceY0 = Math.max(0, Math.floor(sourceY))
    const sourceY1 = Math.min(brandLogo.height - 1, sourceY0 + 1)
    const weightY = Math.max(0, sourceY - sourceY0)
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = (x + 0.5) * brandLogo.width / targetWidth - 0.5
      const sourceX0 = Math.max(0, Math.floor(sourceX))
      const sourceX1 = Math.min(brandLogo.width - 1, sourceX0 + 1)
      const weightX = Math.max(0, sourceX - sourceX0)
      const sourceOffset00 = (sourceY0 * brandLogo.width + sourceX0) * brandLogo.channels
      const sourceOffset01 = (sourceY0 * brandLogo.width + sourceX1) * brandLogo.channels
      const sourceOffset10 = (sourceY1 * brandLogo.width + sourceX0) * brandLogo.channels
      const sourceOffset11 = (sourceY1 * brandLogo.width + sourceX1) * brandLogo.channels
      const targetOffset = ((targetY + y) * WIDTH + targetX + x) * CHANNELS
      for (let channel = 0; channel < 3; channel += 1) {
        const top = brandLogo.pixels[sourceOffset00 + channel] * (1 - weightX) + brandLogo.pixels[sourceOffset01 + channel] * weightX
        const bottom = brandLogo.pixels[sourceOffset10 + channel] * (1 - weightX) + brandLogo.pixels[sourceOffset11 + channel] * weightX
        const color = top * (1 - weightY) + bottom * weightY
        const topAlpha = brandLogo.channels === 4 ? brandLogo.pixels[sourceOffset00 + 3] * (1 - weightX) + brandLogo.pixels[sourceOffset01 + 3] * weightX : 255
        const bottomAlpha = brandLogo.channels === 4 ? brandLogo.pixels[sourceOffset10 + 3] * (1 - weightX) + brandLogo.pixels[sourceOffset11 + 3] * weightX : 255
        const alpha = (topAlpha * (1 - weightY) + bottomAlpha * weightY) / 255
        pixels[targetOffset + channel] = Math.round(color * alpha + pixels[targetOffset + channel] * (1 - alpha))
      }
    }
  }
}

function drawBrandEdgeDetails(pixels) {
  const stars = [[68, 70], [1135, 76], [63, 415], [1136, 410], [240, 183], [962, 190]]
  for (const [centerX, centerY] of stars) {
    for (let offset = -8; offset <= 8; offset += 1) {
      setPixel(pixels, centerX + offset, centerY, brand.yellow)
      setPixel(pixels, centerX, centerY + offset, brand.yellow)
    }
  }

  // Confetes e baloes nas laterais, preservando o centro para os dados.
  fillRect(pixels, 110, 125, 9, 22, brand.cyan)
  fillRect(pixels, 1081, 140, 9, 22, brand.pink)
  fillRect(pixels, 132, 365, 9, 20, brand.yellow)
  fillRect(pixels, 1060, 360, 9, 20, brand.cyan)
  drawBalloon(pixels, 78, 246, 19, 25, brand.pink)
  drawBalloon(pixels, 1120, 264, 19, 25, brand.cyan)
  drawBalloon(pixels, 110, 315, 15, 21, brand.yellow)
  drawBalloon(pixels, 1090, 326, 15, 21, brand.pink)
  // Decoracao sutil nas bordas; o rodape e o centro ficam livres para leitura.
  drawCastle(pixels, 22, 600, 1)
  drawCastle(pixels, 1024, 600, 1)
}

function setPixel(pixels, x, y, color) {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return
  const offset = (y * WIDTH + x) * CHANNELS
  pixels[offset] = color[0]
  pixels[offset + 1] = color[1]
  pixels[offset + 2] = color[2]
  pixels[offset + 3] = 255
}

function fillRect(pixels, x, y, width, height, color) {
  for (let py = y; py < y + height; py += 1) {
    for (let px = x; px < x + width; px += 1) setPixel(pixels, px, py, color)
  }
}

function fillEllipse(pixels, centerX, centerY, radiusX, radiusY, color) {
  for (let y = -radiusY; y <= radiusY; y += 1) {
    for (let x = -radiusX; x <= radiusX; x += 1) {
      if ((x * x) / (radiusX * radiusX) + (y * y) / (radiusY * radiusY) <= 1) {
        setPixel(pixels, centerX + x, centerY + y, color)
      }
    }
  }
}

function drawBalloon(pixels, centerX, centerY, radiusX, radiusY, color) {
  fillEllipse(pixels, centerX, centerY, radiusX, radiusY, color)
  fillRect(pixels, centerX - 2, centerY + radiusY - 1, 5, 5, color)
  for (let step = 0; step < 28; step += 1) {
    const x = centerX - 1 + Math.round(step / 28 * 5)
    setPixel(pixels, x, centerY + radiusY + 4 + step, [255, 255, 255])
  }
}

function drawCastle(pixels, x, baseY, scale) {
  const body = [255, 45, 152]
  const tower = [0, 194, 209]
  const roof = [255, 217, 56]
  const width = 142 * scale
  const bodyY = baseY - 48 * scale

  fillRect(pixels, x + 28 * scale, bodyY, 86 * scale, 48 * scale, body)
  fillRect(pixels, x + 8 * scale, baseY - 72 * scale, 30 * scale, 72 * scale, roof)
  fillRect(pixels, x + 104 * scale, baseY - 72 * scale, 30 * scale, 72 * scale, roof)
  fillRect(pixels, x + 62 * scale, baseY - 72 * scale, 30 * scale, 72 * scale, tower)

  for (const towerX of [x + 8 * scale, x + 62 * scale, x + 104 * scale]) {
    const roofX = towerX + 15 * scale
    for (let row = 0; row < 22 * scale; row += 1) {
      const halfWidth = Math.round(row * 15 / 22)
      fillRect(pixels, roofX - halfWidth, baseY - 94 * scale + row, halfWidth * 2 + 1, 1, tower)
    }
  }

  fillRect(pixels, x + 62 * scale, baseY - 34 * scale, 30 * scale, 34 * scale, [26, 26, 61])
  fillRect(pixels, x + 18 * scale, baseY - 52 * scale, 9 * scale, 12 * scale, [26, 26, 61])
  fillRect(pixels, x + 115 * scale, baseY - 52 * scale, 9 * scale, 12 * scale, [26, 26, 61])
  fillRect(pixels, x, baseY, width, 3 * scale, brand.yellow)
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
  const pixels = Buffer.alloc(WIDTH * HEIGHT * CHANNELS)

  // Fundo horizontal do brand kit: roxo profundo para violeta.
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const ratio = x / (WIDTH - 1)
      const offset = (y * WIDTH + x) * CHANNELS
      pixels[offset] = Math.round(brand.top[0] * (1 - ratio) + brand.bottom[0] * ratio)
      pixels[offset + 1] = Math.round(brand.top[1] * (1 - ratio) + brand.bottom[1] * ratio)
      pixels[offset + 2] = Math.round(brand.top[2] * (1 - ratio) + brand.bottom[2] * ratio)
      pixels[offset + 3] = 255
    }
  }

  // Compoe decoracoes discretas e o logo transparente sobre o proprio fundo.
  drawBrandEdgeDetails(pixels)
  drawBrandLogo(pixels)

  const textCenter = WIDTH / 2
  const textWidth = 900

  const title = normalizeText(invitation.titulo || 'SUA FESTA COM A GENTE')
  const titleScale = Math.min(titleScaleFor(title.length), 7)
  const titleMaxLength = Math.floor(textWidth / (6 * titleScale))
  const titleLines = wrapText(title, titleMaxLength, 2)
  const titleLineHeight = titleScale * 9
  const titleY = 170
  titleLines.forEach((line, index) => centeredText(pixels, line, textCenter, titleY + index * titleLineHeight, titleScale, brand.white))

  const titleBottom = titleY + titleLines.length * titleLineHeight
  const message = normalizeText(invitation.mensagem || 'VOCE ESTA CONVIDADO')
  const messageLines = wrapText(message, 64, 1)
  const messageY = titleBottom + 12
  messageLines.forEach((line, index) => centeredText(pixels, line, textCenter, messageY + index * 27, 3, brand.pink))

  const date = invitation.data_evento
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(invitation.data_evento))
    : 'DATA A CONFIRMAR'
  const dateLines = wrapText(date, 40, 2)
  const detailsY = Math.max(326, messageY + messageLines.length * 27 + 18)
  centeredText(pixels, 'DATA E HORARIO', textCenter, detailsY, 3, brand.yellow)
  dateLines.forEach((line, index) => centeredText(pixels, line, textCenter, detailsY + 30 + index * 27, 3, brand.white))

  const locationLines = wrapText(invitation.local_evento || 'LOCAL A CONFIRMAR', 40, 2)
  const locationLabelY = detailsY + 78 + (dateLines.length - 1) * 27
  centeredText(pixels, 'LOCAL', textCenter, locationLabelY, 3, brand.yellow)
  locationLines.forEach((line, index) => centeredText(pixels, line, textCenter, locationLabelY + 30 + index * 27, 3, brand.white))

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
