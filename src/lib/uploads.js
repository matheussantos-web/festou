const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxImageSize = 5 * 1024 * 1024

export async function uploadImage(file, kind) {
  if (!acceptedImageTypes.has(file.type)) {
    throw new Error('Escolha uma imagem JPG, PNG ou WebP.')
  }
  if (file.size > maxImageSize) {
    throw new Error('A imagem deve ter no maximo 5 MB.')
  }

  let response
  try {
    response = await fetch(`/api/uploads/${kind}`, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
      credentials: 'include',
    })
  } catch {
    throw new Error('Nao foi possivel conectar ao servidor para enviar a imagem.')
  }

  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || 'Nao foi possivel enviar a imagem.')
  return result
}
