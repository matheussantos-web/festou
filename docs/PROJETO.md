# Projeto Festou!

> Documento vivo de produto e engenharia. Atualizado em 21/10/2026.

## Visão geral

Festou! é uma plataforma web para ajudar clientes a organizar festas: descobrir produtos e serviços de fornecedores, montar pedidos de orçamento e criar convites digitais com confirmação de presença (RSVP). Fornecedores podem divulgar produtos na vitrine. A experiência usa a identidade alegre e colorida da marca.

## Objetivos do produto

- Reunir em um só lugar recursos importantes para planejar uma festa.
- Conectar clientes e fornecedores por meio de uma vitrine e solicitações de orçamento.
- Facilitar convites digitais públicos e o acompanhamento das respostas dos convidados.
- Manter autenticação, autorização e acesso ao banco no servidor.

## Estado atual

| Etapa | Entrega | Estado |
| --- | --- | --- |
| 1. Fundação | Aplicação Vue/Vite, estilos Tailwind e servidor Express | Implementada |
| 2. Autenticação | Cadastro, login, sessões e perfis cliente/fornecedor | Implementada |
| 3. Vitrine | Consulta pública e cadastro de produtos por fornecedores | Implementada |
| 4. Carrinho e pedidos | Carrinho no cliente, solicitações de orçamento e histórico | Implementada |
| 5. Convites e RSVP | Convite público, respostas dos convidados e painel do anfitrião | Implementada |
| 6. Identidade visual | Paleta Festou!, tipografia, grafismos e aplicação nas telas | Implementada |
| 7. Estabilização | Hotfixes de contrato, saneamento de código, acessibilidade, cabeçalho global e suíte de testes | Implementada |

Este quadro descreve o que existe no repositório hoje, não um compromisso com um cronograma. Novas etapas e prioridades devem ser definidas conforme o produto evoluir.

## Funcionalidades e rotas

| Rota | Acesso | Função |
| --- | --- | --- |
| `/` | Público | Página inicial e acesso à vitrine |
| `/cadastro` | Público | Criação de perfil de cliente ou fornecedor |
| `/login` | Público | Entrada na conta |
| `/vitrine` | Público | Busca e filtro por categoria de produto |
| `/carrinho` | Cliente autenticado | Ajuste de itens, envio de orçamento e histórico |
| `/fornecedor/painel` | Fornecedor autenticado | Gestão de orçamentos recebidos e catálogo de produtos |
| `/fornecedor/produtos/novo` | Fornecedor autenticado | Publicação de produto na vitrine |
| `/convites` | Cliente autenticado | Criação de convites e consulta das respostas |
| `/convite/:slug` | Público | Visualização do convite e envio/atualização de RSVP |

Categorias de produto: bolos, doces, brinquedos e convites digitais. Estados do RSVP: confirmado, recusado e talvez. A chave de atualização de resposta é o par convite/e-mail.

## Arquitetura

- **Frontend:** Vue 3 com Single File Components, Vue Router, Vite e Tailwind CSS.
- **API:** Node.js com Express; endpoints REST sob `/api`.
- **Banco:** PostgreSQL hospedado no Neon, acessado pelo pacote `@neondatabase/serverless`.
- **Validação:** Zod no servidor para validar os dados recebidos.
- **Segurança:** sessões com cookies HttpOnly, senhas com scrypt, validação de origem em requisições mutáveis, Helmet e rate limiting para autenticação e RSVP.
- **Integração local:** Vite encaminha `/api` ao Express; `npm run dev` inicia ambos.
- **Produção:** `npm run build` gera `dist/` e `npm start` passa a servir o SPA compilado com fallback de rota, mantendo a API no mesmo processo. O endereço de escuta vem de `HOST` (padrão `127.0.0.1`; use `0.0.0.0` atrás de proxy).

### Organização principal

```text
src/
  lib/                 Cliente da API e utilitários do frontend
    api.js             Requisições, erros tipados e normalização de listas
    cart.js            Carrinho persistido no navegador
    format.js          Formatação de preço, data e texto
    orderStatus.js     Rótulos e cores de status de pedido
  router/              Rotas e proteção de páginas
  views/               Páginas Vue
  components/          Componentes compartilhados (AppHeader)
  style.css            Tailwind e regras globais da identidade
server/
  db.js                Conexão Neon
  index.js             API, autenticação e regras de negócio
  migrate.js           Aplicação do schema SQL
  schema.sql           Tabelas, restrições e índices
  security.js          Senhas, sessões e validação de origem
tests/
  helpers/api.js       Cliente de teste, criação de contas e limpeza de dados
  unit/                Testes unitários das libs do frontend
  api/                 Testes de integração dos endpoints
public/
  festou-marca.png     Arte principal da marca
  festou-confetti.svg  Grafismo reutilizável
  favicon.svg          Ícone do site
docs/
  IDENTIDADE-VISUAL.md Guia da marca
  PROJETO.md           Este documento
```

## Modelo de dados atual

- `perfis`: clientes e fornecedores.
- `sessoes`: hash de token e expiração da sessão.
- `produtos`: catálogo publicado pelos fornecedores.
- `pedidos`: solicitações de orçamento criadas por clientes.
- `itens_pedido`: itens e valores registrados em cada pedido.
- `convites`: informações do evento, tema, slug público e estado de RSVP.
- `confirmacoes_presenca`: resposta por convite, com nome, e-mail, quantidade e mensagem.

O schema versionado está em [`../server/schema.sql`](../server/schema.sql). Para aplicar a estrutura no banco configurado, use `npm run db:setup`.

## Identidade visual

A marca combina fundo marinho, magenta vibrante, roxo, turquesa, amarelo e laranja, com Baloo 2 em títulos, Inter em textos e grafismos de festa. O guia com códigos de cor e orientações de aplicação está em [`IDENTIDADE-VISUAL.md`](./IDENTIDADE-VISUAL.md).

## Configuração e comandos

Requisitos: Node.js compatível com o projeto e uma base PostgreSQL Neon.

1. Crie um arquivo `.env` local com as configurações abaixo. Não inclua valores secretos no repositório ou em documentação.

   ```env
   DATABASE_URL=<sua-conexao-neon>
   APP_ORIGIN=http://127.0.0.1:5173
   PORT=3000
   HOST=127.0.0.1
   NODE_ENV=development
   AUTH_RATE_LIMIT=10
   RSVP_RATE_LIMIT=30
   ```

2. Instale as dependências com `npm install`.
3. Crie/atualize as tabelas com `npm run db:setup`.
4. Inicie a API e o frontend com `npm run dev`.
5. Acesse `http://127.0.0.1:5173`.

Comandos disponíveis:

| Comando | Descrição |
| --- | --- |
| `npm run dev` | API em modo watch e frontend Vite |
| `npm run dev:api` | Apenas API em modo watch |
| `npm start` | Inicia a API e serve `dist/` quando o build existe |
| `npm run db:setup` | Aplica o schema ao banco Neon |
| `npm run build` | Compila o frontend para produção |
| `npm run preview` | Serve localmente a compilação de produção |
| `npm test` | Roda toda a suíte de testes |
| `npm run test:watch` | Roda os testes em modo interativo |
| `npm run test:unit` | Roda apenas os testes unitários do frontend |
| `npm run test:api` | Roda apenas os testes de integração da API |

## API atual

| Método | Endpoint | Uso |
| --- | --- | --- |
| `GET` | `/api/health` | Verificar API e conexão com o banco |
| `POST` | `/api/auth/register` | Criar conta |
| `POST` | `/api/auth/login` | Iniciar sessão |
| `GET` | `/api/auth/me` | Consultar sessão |
| `POST` | `/api/auth/logout` | Encerrar sessão |
| `GET` | `/api/products` | Consultar vitrine; aceita filtro de categoria |
| `POST` | `/api/products` | Publicar produto como fornecedor |
| `GET` | `/api/supplier/products` | Consultar catálogo completo do fornecedor autenticado (ativos e pausados) |
| `PATCH` | `/api/supplier/products/:id/toggle-active` | Alternar visibilidade (pausar ou reativar) de produto na vitrine |
| `GET` | `/api/orders` | Consultar pedidos conforme perfil autenticado |
| `POST` | `/api/orders` | Criar pedido/orçamento como cliente |
| `POST` | `/api/invitations` | Criar convite como cliente |
| `GET` | `/api/invitations/mine` | Listar convites e respostas do anfitrião |
| `PATCH` | `/api/invitations/:id/rsvp-status` | Reabrir ou encerrar confirmações de presença como cliente |
| `GET` | `/api/invitations/:slug` | Consultar convite público |
| `POST` | `/api/invitations/:slug/rsvp` | Criar ou atualizar resposta do convidado |
| `PATCH` | `/api/orders/:id/status` | Atualizar status do pedido conforme perfil (cancelar, negociar, confirmar, concluir) |

## Testes automatizados

A suíte usa Vitest e roda contra o mesmo banco Neon configurado em `.env`. Os testes de integração criam contas com e-mail no domínio `teste.*@festou.test` e removem os dados ao final de cada arquivo (`cleanupTestData`).

| Arquivo | Cobertura |
| --- | --- |
| `tests/unit/format.test.js` | Formatação de preço, data e texto |
| `tests/unit/orderStatus.test.js` | Rótulos e estilos de status de pedido |
| `tests/unit/cart.test.js` | Persistência, limites e totais do carrinho |
| `tests/api/auth.test.js` | Cadastro, login, sessão, origem e rotas protegidas |
| `tests/api/products.test.js` | Vitrine pública, filtro por categoria e permissões de fornecedor |
| `tests/api/orders.test.js` | Criação e listagem de pedidos, negociação de status e isolamento entre perfis |
| `tests/api/invitations.test.js` | Convites, RSVP, reabertura e listagem das respostas |

Variáveis usadas nos testes: `AUTH_RATE_LIMIT` e `RSVP_RATE_LIMIT` são elevadas para 1000 em `tests/setup.js`, para que a suíte não seja bloqueada pelo limitador de requisições.

## Validação executada na etapa de estabilização

- `npm run build` concluído com sucesso (39 módulos).
- `npm test` com 45 testes aprovados em 7 arquivos.
- `npm start` verificado servindo o SPA compilado (`/`, rota de convite e `/api/health` respondendo 200).
- Auditoria de encoding dos fontes: nenhum caractere corrompido ou BOM indevido.
- Banco conferido ao final da suíte: apenas os dados de origem permanecem, sem resíduos de teste.

Correções aplicadas na etapa: retorno de `created_at` e dos identificadores de item na criação de pedido (quebravam a tela do carrinho), `aceita_rsvp` na criação de convite, agregados de confirmação convertidos para número, limites de requisição configuráveis por ambiente, duplicação de requisição na vitrine, `APP_ORIGIN` deixado de ser fixo no código e cabeçalho global com navegação acessível.

## Próximos passos

Não há um roadmap fechado neste documento. Ao priorizar a continuação, considerar:

- revisar as vulnerabilidades apontadas pelo `npm audit` e avaliar atualizações de dependências;
- concluir a revisão visual responsiva e de acessibilidade em todas as rotas;
- definir as regras de negócio pendentes para edição/encerramento de convites e acompanhamento dos pedidos;
- planejar deploy, observabilidade, backups e configuração de produção.

## Como manter este documento

Este arquivo deve evoluir junto com o código. Ao concluir uma mudança relevante:

1. Atualize o estado das etapas e as rotas se o produto mudar.
2. Registre alterações de arquitetura, endpoints, modelo de dados e comandos.
3. Atualize validações e testes de acordo com o que realmente foi executado.
4. Mantenha decisões futuras na seção de próximos passos, sem descrevê-las como funcionalidades existentes.
5. Nunca adicione credenciais, dados pessoais ou valores de `.env`.
