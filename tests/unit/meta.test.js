import { describe, expect, it } from 'vitest'
import { buildInvitationMeta, escapeHtml, injectMeta } from '../../server/meta.js'

const invitation = {
  slug: 'festa-da-marina',
  titulo: 'Aniversário da Marina',
  anfitriao: 'Família Silva',
  data_evento: '2026-12-20T22:00:00.000Z',
  local_evento: 'Buffet Estrela',
}

describe('metadados do convite', () => {
  it('monta titulo, descricao, url e imagem', () => {
    const meta = buildInvitationMeta(invitation, 'https://festou.app')

    expect(meta.title).toBe('Aniversário da Marina — convite de Família Silva')
    expect(meta.description).toContain('Buffet Estrela')
    expect(meta.description).toContain('Confirme sua presença')
    expect(meta.url).toBe('https://festou.app/convite/festa-da-marina')
    expect(meta.image).toMatch(/^https:\/\/festou\.app\/convite\/festa-da-marina\/imagem\.png\?v=/)
  })

  it('escapa os caracteres perigosos', () => {
    expect(escapeHtml('<script>&"\'')).toBe('&lt;script&gt;&amp;&quot;&#39;')
  })

  it('injeta as tags no head e troca o title', () => {
    const html = '<!doctype html><html><head><title>Festou!</title></head><body></body></html>'
    const result = injectMeta(html, buildInvitationMeta(invitation, 'https://festou.app'))

    expect(result).toContain('<title>Aniversário da Marina — convite de Família Silva</title>')
    expect(result).not.toContain('<title>Festou!</title>')
    expect(result).toContain('property="og:title"')
    expect(result).toContain('property="og:url" content="https://festou.app/convite/festa-da-marina"')
    expect(result.match(/property="og:image"/g)).toHaveLength(1)
    expect(result).toContain('property="og:image:type" content="image/png"')
    expect(result).toContain('name="twitter:card" content="summary_large_image"')
    expect(result.indexOf('og:title')).toBeLessThan(result.indexOf('</head>'))
  })

  it('nao deixa o titulo escapar do atributo', () => {
    const html = '<html><head><title>Festou!</title></head><body></body></html>'
    const meta = buildInvitationMeta(
      { ...invitation, titulo: 'Festa "TOP" <3', local_evento: 'Rua A & B' },
      'https://festou.app',
    )
    const result = injectMeta(html, meta)

    expect(result).toContain('&quot;TOP&quot;')
    expect(result).toContain('&amp;')
    expect(result).not.toContain('content="Festa "TOP"')
  })

  it('devolve o html sem alteracao quando nao existe head', () => {
    expect(injectMeta('<p>sem head</p>', { title: 'x', description: 'y', url: 'z', image: 'w' }))
      .toBe('<p>sem head</p>')
  })
})
