// Chave estavel compartilhada pelo servidor e pelo Vue para invalidar o cache
// da imagem social quando qualquer dado visual do convite for alterado.
export function invitationImageVersion(invitation) {
  const source = [
    invitation.titulo,
    invitation.anfitriao,
    invitation.data_evento,
    invitation.local_evento,
    invitation.mensagem,
    invitation.tema,
  ].join('|')

  let hash = 2166136261
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(16)
}
