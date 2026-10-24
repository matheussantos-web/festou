import { readFile, writeFile } from 'node:fs/promises'
import { deflateSync, inflateSync } from 'node:zlib'

const sourcePath = new URL('../public/03_logo_horizontal.png', import.meta.url)
const targetPath = new URL('../public/festou-logo-horizontal.png', import.meta.url)

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

function decodeRgbPng(buffer) {
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
    } else if (type === 'IDAT') imageData.push(data)
    else if (type === 'IEND') break
    offset += length + 12
  }

  if (bitDepth !== 8 || colorType !== 2 || !width || !height) {
    throw new Error('O logo horizontal deve ser uma PNG RGB de 8 bits.')
  }

  const channels = 3
  const rowLength = width * channels
  const decoded = inflateSync(Buffer.concat(imageData))
  const pixels = Buffer.alloc(rowLength * height)
  let decodedOffset = 0

  for (let y = 0; y < height; y += 1) {
    const filter = decoded[decodedOffset++]
    const rowOffset = y * rowLength
    const previousRowOffset = rowOffset - rowLength
    for (let x = 0; x < rowLength; x += 1) {
      const left = x >= channels ? pixels[rowOffset + x - channels] : 0
      const above = y ? pixels[previousRowOffset + x] : 0
      const upperLeft = y && x >= channels ? pixels[previousRowOffset + x - channels] : 0
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
      } else if (filter !== 0) throw new Error(`Filtro PNG nao suportado: ${filter}`)
      pixels[rowOffset + x] = (decoded[decodedOffset + x] + predictor) & 0xff
    }
    decodedOffset += rowLength
  }

  return { width, height, pixels }
}

function removeEdgeConnectedWhite({ width, height, pixels }) {
  const pixelCount = width * height
  const transparentBackground = new Uint8Array(pixelCount)
  const queue = new Int32Array(pixelCount)
  let readIndex = 0
  let writeIndex = 0

  function enqueueIfBackground(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return
    const index = y * width + x
    if (transparentBackground[index]) return
    const offset = index * 3
    if (pixels[offset] < 245 || pixels[offset + 1] < 245 || pixels[offset + 2] < 245) return
    transparentBackground[index] = 1
    queue[writeIndex++] = index
  }

  for (let x = 0; x < width; x += 1) {
    enqueueIfBackground(x, 0)
    enqueueIfBackground(x, height - 1)
  }
  for (let y = 0; y < height; y += 1) {
    enqueueIfBackground(0, y)
    enqueueIfBackground(width - 1, y)
  }

  while (readIndex < writeIndex) {
    const index = queue[readIndex++]
    const x = index % width
    const y = Math.floor(index / width)
    enqueueIfBackground(x - 1, y)
    enqueueIfBackground(x + 1, y)
    enqueueIfBackground(x, y - 1)
    enqueueIfBackground(x, y + 1)
  }

  const alpha = Buffer.alloc(pixelCount, 255)
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let index = 0; index < pixelCount; index += 1) {
    if (transparentBackground[index]) {
      alpha[index] = 0
      continue
    }

    const x = index % width
    const y = Math.floor(index / width)
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)

    const touchesTransparent = (x > 0 && transparentBackground[index - 1])
      || (x < width - 1 && transparentBackground[index + 1])
      || (y > 0 && transparentBackground[index - width])
      || (y < height - 1 && transparentBackground[index + width])
    if (!touchesTransparent) continue

    const offset = index * 3
    const minimumChannel = Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2])
    const edgeAlpha = 255 - minimumChannel
    if (edgeAlpha >= 8 && minimumChannel >= 180) {
      alpha[index] = edgeAlpha
      // Remove o halo branco deixado pela antialiasing sobre o fundo original.
      for (let channel = 0; channel < 3; channel += 1) {
        pixels[offset + channel] = Math.max(0, Math.min(255, Math.round(
          (pixels[offset + channel] - 255 * (1 - edgeAlpha / 255)) / (edgeAlpha / 255),
        )))
      }
    } else if (minimumChannel >= 245) alpha[index] = 0
  }

  // Remove a margem transparente ampla para o logo ocupar bem a navbar.
  const padding = 8
  minX = Math.max(0, minX - padding)
  minY = Math.max(0, minY - padding)
  maxX = Math.min(width - 1, maxX + padding)
  maxY = Math.min(height - 1, maxY + padding)
  const croppedWidth = maxX - minX + 1
  const croppedHeight = maxY - minY + 1
  const rgba = Buffer.alloc(croppedWidth * croppedHeight * 4)

  for (let y = 0; y < croppedHeight; y += 1) {
    for (let x = 0; x < croppedWidth; x += 1) {
      const sourceIndex = (y + minY) * width + x + minX
      const sourceOffset = sourceIndex * 3
      const targetOffset = (y * croppedWidth + x) * 4
      rgba[targetOffset] = pixels[sourceOffset]
      rgba[targetOffset + 1] = pixels[sourceOffset + 1]
      rgba[targetOffset + 2] = pixels[sourceOffset + 2]
      rgba[targetOffset + 3] = alpha[sourceIndex]
    }
  }

  return { width: croppedWidth, height: croppedHeight, pixels: rgba }
}

function encodeRgbaPng({ width, height, pixels }) {
  const scanlines = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 4 + 1)
    scanlines[rowOffset] = 0
    pixels.copy(scanlines, rowOffset + 1, y * width * 4, (y + 1) * width * 4)
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 6 // RGBA

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function resizeRgba({ width, height, pixels }, targetWidth) {
  const targetHeight = Math.round(targetWidth * height / width)
  const resized = Buffer.alloc(targetWidth * targetHeight * 4)

  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = (y + 0.5) * height / targetHeight - 0.5
    const y0 = Math.max(0, Math.floor(sourceY))
    const y1 = Math.min(height - 1, y0 + 1)
    const weightY = Math.max(0, sourceY - y0)
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = (x + 0.5) * width / targetWidth - 0.5
      const x0 = Math.max(0, Math.floor(sourceX))
      const x1 = Math.min(width - 1, x0 + 1)
      const weightX = Math.max(0, sourceX - x0)
      const samples = [
        [(y0 * width + x0) * 4, (1 - weightX) * (1 - weightY)],
        [(y0 * width + x1) * 4, weightX * (1 - weightY)],
        [(y1 * width + x0) * 4, (1 - weightX) * weightY],
        [(y1 * width + x1) * 4, weightX * weightY],
      ]
      const targetOffset = (y * targetWidth + x) * 4
      let alpha = 0
      const color = [0, 0, 0]

      for (const [sourceOffset, weight] of samples) {
        const sampleAlpha = pixels[sourceOffset + 3] / 255
        const weightedAlpha = sampleAlpha * weight
        alpha += weightedAlpha
        for (let channel = 0; channel < 3; channel += 1) {
          color[channel] += pixels[sourceOffset + channel] * weightedAlpha
        }
      }

      for (let channel = 0; channel < 3; channel += 1) {
        resized[targetOffset + channel] = alpha ? Math.round(color[channel] / alpha) : 0
      }
      resized[targetOffset + 3] = Math.round(alpha * 255)
    }
  }

  return { width: targetWidth, height: targetHeight, pixels: resized }
}

const source = decodeRgbPng(await readFile(sourcePath))
const transparentLogo = resizeRgba(removeEdgeConnectedWhite(source), 768)
await writeFile(targetPath, encodeRgbaPng(transparentLogo))
console.log(`Logo transparente criado: ${transparentLogo.width}x${transparentLogo.height}`)
