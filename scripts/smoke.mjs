import 'dotenv/config'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Teste de fumaça ponta a ponta.
// Uso: npm run smoke. Por padrão este script sobe um servidor próprio, na porta
// SMOKE_PORT, com os limitadores de requisição elevados, para não depender do
// ambiente de desenvolvimento e não estourar o rate limit de produção.
// Defina SMOKE_BASE_URL para usar um servidor já em execução.
// As contas criadas usam o domínio smoke.*@festou.test e são removidas ao final.

const porta = Number(process.env.SMOKE_PORT) || 3100
const base = process.env.SMOKE_BASE_URL || `http://127.0.0.1:${porta}`
const origin = process.env.SMOKE_ORIGIN || base
const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const stamp = Date.now()
const clienteEmail = `smoke.cliente.${stamp}@festou.test`
const fornecedorEmail = `smoke.fornecedor.${stamp}@festou.test`
const senha = 'SenhaDeTeste123'

const cookies = new Map()

function cookieHeader() {
  return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

function storeCookies(response) {
  const raw = response.headers.getSetCookie?.() || []
  for (const line of raw) {
    const [pair] = line.split(';')
    const index = pair.indexOf('=')
    cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim())
  }
}

async function call(method, path, body, options = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
      Cookie: cookieHeader(),
      ...(options.headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  storeCookies(response)

  const text = await response.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }

  return { status: response.status, data }
}

function check(label, condition, extra = '') {
  console.log(`${condition ? 'OK  ' : 'FALHA'} | ${label}${extra ? ` -> ${extra}` : ''}`)
  if (!condition) process.exitCode = 1
}

async function ping() {
  try {
    const response = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1500) })
    return response.ok
  } catch {
    return false
  }
}

let servidor = null

function encerrarServidor() {
  if (!servidor) return
  servidor.kill()
  servidor = null
}

process.on('exit', encerrarServidor)
process.on('SIGINT', () => { encerrarServidor(); process.exit(130) })
process.on('SIGTERM', () => { encerrarServidor(); process.exit(143) })

if (process.env.SMOKE_BASE_URL) {
  console.log(`Usando o servidor informado em ${base}.`)
  if (!(await ping())) {
    console.error(`FALHA | o servidor em ${base} não respondeu`)
    process.exit(1)
  }
} else {
  console.log(`Subindo servidor próprio em ${base}...`)

  servidor = spawn(process.execPath, [join(rootDir, 'server', 'index.js')], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: String(porta),
      HOST: '127.0.0.1',
      AUTH_RATE_LIMIT: '1000',
      RSVP_RATE_LIMIT: '1000',
    },
    stdio: 'ignore',
  })

  for (let tentativa = 0; tentativa < 40; tentativa += 1) {
    if (await ping()) break
    await delay(300)
  }

  if (!(await ping())) {
    console.error('FALHA | o servidor não subiu a tempo')
    encerrarServidor()
    process.exit(1)
  }
}

console.log('== 1. Saúde da API ==')
const health = await call('GET', '/api/health')
check('GET /api/health', health.status === 200 && health.data.status === 'ok', JSON.stringify(health.data))

console.log('\n== 2. Cadastro de fornecedor e cliente ==')
const fornecedor = await call('POST', '/api/auth/register', { nome: 'Doces da Ana', email: fornecedorEmail, senha, tipo_perfil: 'fornecedor' })
check('cadastro do fornecedor', fornecedor.status === 201, `status ${fornecedor.status}`)

const cliente = await call('POST', '/api/auth/register', { nome: 'Marina Teste', email: clienteEmail, senha, tipo_perfil: 'cliente' })
check('cadastro do cliente', cliente.status === 201, `status ${cliente.status}`)

const login = await call('POST', '/api/auth/login', { email: clienteEmail, senha })
check('login do cliente', login.status === 200 && login.data.user.email === clienteEmail, `status ${login.status}`)

console.log('\n== 3. Publicacao de produto ==')
cookies.clear()
await call('POST', '/api/auth/login', { email: fornecedorEmail, senha })
const produto = await call('POST', '/api/products', { nome: 'Bolo de chocolate', categoria: 'bolos', descricao: 'Bolo de chocolate com cobertura e recheio de brigadeiro.', preco: 89.9 })
check('fornecedor publica produto', produto.status === 201, `status ${produto.status} ${JSON.stringify(produto.data).slice(0, 120)}`)
const produtoId = produto.data?.product?.id

console.log('\n== 4. Vitrine pública ==')
const vitrine = await call('GET', '/api/products')
check('vitrine lista o produto', vitrine.status === 200 && vitrine.data.products.some((p) => p.id === produtoId), `total=${vitrine.data?.products?.length}`)

const vitrineFiltrada = await call('GET', '/api/products?categoria=bolos')
check('filtro por categoria', vitrineFiltrada.status === 200 && vitrineFiltrada.data.products.every((p) => p.categoria === 'bolos'))

console.log('\n== 5. Pedido de orçamento ==')
cookies.clear()
await call('POST', '/api/auth/login', { email: clienteEmail, senha })
const pedido = await call('POST', '/api/orders', { items: [{ produto_id: produtoId, quantidade: 2 }], observacao: 'Entregar no dia 20.' })
check('criacao do pedido', pedido.status === 201, `status ${pedido.status} ${JSON.stringify(pedido.data).slice(0, 160)}`)
check('pedido devolve created_at', Boolean(pedido.data?.order?.created_at), pedido.data?.order?.created_at)
check('pedido devolve id do item', Boolean(pedido.data?.order?.itens?.[0]?.id))
check('total estimado', Number(pedido.data?.order?.total_estimado) === 179.8, String(pedido.data?.order?.total_estimado))
const pedidoId = pedido.data?.order?.id

const historico = await call('GET', '/api/orders')
const noHistorico = historico.data?.orders?.find((o) => o.id === pedidoId)
check('pedido aparece no histórico com o mesmo formato', Boolean(noHistorico?.created_at) && Boolean(noHistorico?.itens?.[0]?.id))

console.log('\n== 6. Convite e RSVP ==')
const dataEvento = new Date(Date.now() + 20 * 86400000).toISOString()
const convite = await call('POST', '/api/invitations', { titulo: 'Aniversário da Marina', anfitriao: 'Família Marina', data_evento: dataEvento, local_evento: 'Casa de campo', mensagem: 'Venham!', tema: 'jardim' })
check('criacao do convite', convite.status === 201, `status ${convite.status}`)
check('convite devolve aceita_rsvp', convite.data?.invitation?.aceita_rsvp === true, String(convite.data?.invitation?.aceita_rsvp))
const slug = convite.data?.invitation?.slug
const conviteId = convite.data?.invitation?.id

cookies.clear()
const visitante = { email: `smoke.convidado.${stamp}@festou.test`, nome: 'Convidado' }
const rsvp = await call('POST', `/api/invitations/${slug}/rsvp`, { nome: visitante.nome, email: visitante.email, resposta: 'confirmado', quantidade_pessoas: 3 })
check('RSVP registrado', rsvp.status === 200, `status ${rsvp.status}`)
check('resumo devolve número', rsvp.data?.summary?.pessoas_confirmadas === 3, `valor=${rsvp.data?.summary?.pessoas_confirmadas} (tipo ${typeof rsvp.data?.summary?.pessoas_confirmadas})`)

const rsvp2 = await call('POST', `/api/invitations/${slug}/rsvp`, { nome: visitante.nome, email: visitante.email, resposta: 'talvez', quantidade_pessoas: 1 })
check('RSVP atualizado pelo mesmo e-mail', rsvp2.status === 200 && rsvp2.data?.summary?.pessoas_confirmadas === 0 && rsvp2.data?.summary?.talvez === 1, JSON.stringify(rsvp2.data?.summary))

const publico = await call('GET', `/api/invitations/${slug}`)
check('convite público acessível', publico.status === 200 && publico.data?.invitation?.titulo === 'Aniversário da Marina')

console.log('\n== 7. Gestão do fornecedor ==')
cookies.clear()
await call('POST', '/api/auth/login', { email: fornecedorEmail, senha })
const pedidosFornecedor = await call('GET', '/api/orders')
check('fornecedor ve o pedido recebido', pedidosFornecedor.status === 200 && pedidosFornecedor.data.orders.some((o) => o.id === pedidoId), `total=${pedidosFornecedor.data?.orders?.length}`)

const negociacao = await call('PATCH', `/api/orders/${pedidoId}/status`, { status: 'em_negociacao' })
check('fornecedor negocia o pedido', negociacao.status === 200 && negociacao.data?.order?.status === 'em_negociacao', `status ${negociacao.status}`)

const confirmado = await call('PATCH', `/api/orders/${pedidoId}/status`, { status: 'confirmado' })
check('fornecedor confirma o pedido', confirmado.status === 200 && confirmado.data?.order?.status === 'confirmado', `status ${confirmado.status}`)

const catalogo = await call('GET', '/api/supplier/products')
check('catalogo do fornecedor', catalogo.status === 200 && catalogo.data.products.some((p) => p.id === produtoId))

const pausar = await call('PATCH', `/api/supplier/products/${produtoId}/toggle-active`)
check('pausar produto', pausar.status === 200 && pausar.data?.product?.ativo === false, `status ${pausar.status}`)

const vitrinePausado = await call('GET', '/api/products')
check('produto pausado sai da vitrine', !vitrinePausado.data.products.some((p) => p.id === produtoId))

const editarProduto = await call('PATCH', `/api/supplier/products/${produtoId}`, {
  nome: 'Bolo de chocolate edition',
  preco: 109.9,
})
check('fornecedor edita o proprio produto', editarProduto.status === 200 && editarProduto.data?.product?.nome === 'Bolo de chocolate edition', `status ${editarProduto.status}`)

const produtoDeOutro = await call('GET', `/api/supplier/products/${produtoId}`)
check('fornecedor consulta o proprio produto', produtoDeOutro.status === 200, `status ${produtoDeOutro.status}`)

const imagemInsegura = await call('POST', '/api/products', {
  nome: 'Produto com imagem http',
  categoria: 'bolos',
  descricao: 'Produto com link de imagem que nao usa https.',
  preco: 30,
  imagem_url: 'http://exemplo.com/foto.jpg',
})
check('imagem fora de https é recusada', imagemInsegura.status === 400, `status ${imagemInsegura.status}`)

const excluirProduto = await call('DELETE', `/api/supplier/products/${produtoId}`)
check('fornecedor exclui o proprio produto', excluirProduto.status === 200, `status ${excluirProduto.status}`)

const produtoExcluido = await call('GET', `/api/supplier/products/${produtoId}`)
check('produto excluido nao aparece mais', produtoExcluido.status === 404, `status ${produtoExcluido.status}`)

console.log('\n== 8. Autorizacao ==')
cookies.clear()
const visitanteSemSessao = await call('GET', '/api/orders')
check('rota privada exige sessao', visitanteSemSessao.status === 401, `status ${visitanteSemSessao.status}`)

const origemInvalida = await fetch(`${base}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: 'https://malicioso.example' },
  body: JSON.stringify({ email: clienteEmail, senha }),
})
check('origem invalida bloqueada', origemInvalida.status === 403, `status ${origemInvalida.status}`)

console.log('\n== 9. Gestao do convite pelo dono ==')
cookies.clear()
await call('POST', '/api/auth/login', { email: clienteEmail, senha })
const editarConvite = await call('PATCH', `/api/invitations/${conviteId}`, {
  titulo: 'Aniversário da Marina (editado)',
  tema: 'colorido',
})
check('dono edita o convite', editarConvite.status === 200 && editarConvite.data?.invitation?.titulo === 'Aniversário da Marina (editado)', `status ${editarConvite.status}`)

const outroCliente = await call('POST', '/api/auth/register', {
  nome: 'Cliente Curioso',
  email: `smoke.curioso.${stamp}@festou.test`,
  senha,
  tipo_perfil: 'cliente',
})
check('cadastro do segundo cliente', outroCliente.status === 201, `status ${outroCliente.status}`)

const editarConviteDeOutro = await call('PATCH', `/api/invitations/${conviteId}`, { titulo: 'Convite sequestrado' })
check('outro cliente nao edita o convite', editarConviteDeOutro.status === 404, `status ${editarConviteDeOutro.status}`)

// O cadastro do segundo cliente trocou a sessao do cookie: volta para a dona.
cookies.clear()
await call('POST', '/api/auth/login', { email: clienteEmail, senha })

const excluirConvite = await call('DELETE', `/api/invitations/${conviteId}`)
check('dono exclui o convite', excluirConvite.status === 200, `status ${excluirConvite.status}`)

const conviteExcluido = await call('GET', `/api/invitations/${slug}`)
check('convite excluido some do link publico', conviteExcluido.status === 404, `status ${conviteExcluido.status}`)

console.log('\n== 10. SPA compilado ==')
const spa = await fetch(`${base}/`)
const spaHtml = await spa.text()
check('GET / serve o index', spa.status === 200 && spaHtml.includes('<div id="app">'))

const rotaSPA = await fetch(`${base}/fornecedor/painel`)
const rotaHtml = await rotaSPA.text()
check('GET /fornecedor/painel devolve o index', rotaSPA.status === 200 && rotaHtml.includes('<div id="app">'))

const api404 = await call('GET', '/api/rota-inexistente')
check('/api inexistente responde 404 em JSON', api404.status === 404 && api404.data?.message, JSON.stringify(api404.data))

console.log('\n== 11. Limpeza ==')
const { sql } = await import('../server/db.js').then(async (m) => ({ sql: m.getDatabase() }))
await sql.query('delete from public.pedidos p using public.perfis c where c.id = p.cliente_id and c.email like $1', [`smoke.%@festou.test`])
await sql.query('delete from public.perfis where email like $1', [`smoke.%@festou.test`])
const sobras = await sql.query('select email from public.perfis where email like $1', [`%@festou.test`])
check('dados de teste removidos', sobras.length === 0, `restantes=${sobras.length}`)

console.log(`\nConcluido.${process.exitCode ? ' Houve falhas.' : ' Tudo passou.'}`)

encerrarServidor()
