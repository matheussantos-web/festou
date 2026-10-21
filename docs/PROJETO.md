# Projeto Festou!

> Documento vivo de produto e engenharia. Atualizado em 21/10/2026 (endurecimento da API, migrations versionadas e CI).

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
| 8. Dependências | Vitest 5 e correção transitiva do PostCSS; Tailwind 3 mantido de propósito | Implementada |
| 9. Endurecimento da API | `trust proxy`, erros 4xx reais, limite de login por e-mail, edição/exclusão de produtos e convites | Implementada |
| 10. Arquitetura do backend | Rotas, esquemas, middlewares e queries separados; migrations versionadas; CI no GitHub Actions | Implementada |
| 11. Sessão e integridade | Sessão compartilhada no frontend, hash de senha versionado com rehash, RSVP bloqueado após o evento e aviso de preço no carrinho | Implementada |
| 12. Vitrine paginada e prévia | Paginação da vitrine e metadados Open Graph no link público do convite | Implementada |
| 13. Recuperação de senha e LGPD | Link de redefinição por e-mail, sessões encerradas na troca e e-mail do cliente mascarado até a confirmação | Implementada |

Este quadro descreve o que existe no repositório hoje, não um compromisso com um cronograma. Novas etapas e prioridades devem ser definidas conforme o produto evoluir.

## Funcionalidades e rotas

| Rota | Acesso | Função |
| --- | --- | --- |
| `/` | Público | Página inicial e acesso à vitrine |
| `/cadastro` | Público | Criação de perfil de cliente ou fornecedor |
| `/login` | Público | Entrada na conta |
| `/recuperar-senha` | Público | Pedido do link de redefinição de senha |
| `/redefinir-senha` | Público | Criação de nova senha a partir do token do link |
| `/vitrine` | Público | Busca e filtro por categoria de produto |
| `/carrinho` | Cliente autenticado | Ajuste de itens, envio de orçamento e histórico |
| `/fornecedor/painel` | Fornecedor autenticado | Gestão de orçamentos recebidos e catálogo de produtos |
| `/fornecedor/produtos/novo` | Fornecedor autenticado | Publicação de produto na vitrine |
| `/fornecedor/produtos/:id/editar` | Fornecedor autenticado | Edição de produto já publicado |
| `/convites` | Cliente autenticado | Criação de convites e consulta das respostas |
| `/convite/:slug` | Público | Visualização do convite e envio/atualização de RSVP |

Categorias de produto: bolos, doces, brinquedos e convites digitais. Estados do RSVP: confirmado, recusado e talvez. A chave de atualização de resposta é o par convite/e-mail.

## Arquitetura

- **Frontend:** Vue 3 com Single File Components, Vue Router, Vite e Tailwind CSS.
- **API:** Node.js com Express; endpoints REST sob `/api`.
- **Banco:** PostgreSQL hospedado no Neon, acessado pelo pacote `@neondatabase/serverless`.
- **Validação:** Zod no servidor para validar os dados recebidos; os esquemas ficam em `server/schemas/` e são compartilhados entre as rotas.
- **Segurança:** sessões com cookies HttpOnly, senhas com scrypt, validação de origem em requisições mutáveis, Helmet e rate limiting para autenticação e RSVP. A validação de origem aceita `APP_ORIGIN`, a própria origem do servidor (quando o Express também serve o SPA) e requisições sem cabeçalho `Origin` (o cookie de sessão é `SameSite=Lax`, o que já impede o envio em requisições de terceiros).
- **Senhas:** os parâmetros do scrypt (`N=16384`, `r=8`, `p=1`, 64 bytes) ficam fixos no código e o hash versionado guarda os valores usados (`scrypt$N$r$p$salt$hash`). Os hashes no formato antigo continuam aceitos e são refeitos automaticamente no próximo login.
- **RSVP:** a resposta é atualizada pelo par convite/e-mail; o anfitrião pode encerrar as confirmações e o servidor também recusa respostas depois da data do evento.
- **Rate limiting por IP:** o Express só considera `X-Forwarded-For` quando `TRUST_PROXY` informa quantos proxies reversos existem na frente da aplicação. Sem isso, o limitador contaria o IP do proxy e valeria para todo mundo.
- **Erros:** o corpo inválido responde 400 e o corpo grande demais responde 413, em vez de virar 500 genérico. Erros de banco sem `DATABASE_URL` respondem 503.
- **Integração local:** Vite encaminha `/api` ao Express; `npm run dev` inicia ambos.
- **Produção:** `npm run build` gera `dist/` e `npm start` passa a servir o SPA compilado com fallback de rota, mantendo a API no mesmo processo. O endereço de escuta vem de `HOST` (padrão `127.0.0.1`; use `0.0.0.0` atrás de proxy).

### Organização principal

```text
src/
  lib/                 Cliente da API e utilitários do frontend
    api.js             Requisições, erros tipados e normalização de listas
    cart.js            Carrinho persistido no navegador e sincronização de preços
    session.js         Sessão compartilhada, com cache e requisição única
    format.js          Formatação de preço, data e texto
    orderStatus.js     Rótulos e cores de status de pedido
  router/              Rotas e proteção de páginas
  views/               Páginas Vue
  components/          Componentes compartilhados (AppHeader, AppFooter, FestouDecor)
  style.css            Tailwind e regras globais da identidade
server/
  app.js                Montagem do app Express (middlewares, rotas e estáticos)
  index.js              Ponto de entrada: sobe o servidor
  config.js             Leitura e validação das variáveis de ambiente
  db.js                 Conexão Neon
  migrate.js            Aplicação das migrations versionadas
  security.js           Senhas, sessões e validação de origem
  mailer.js             Envio de e-mail (Resend por HTTP, console sem chave)
  meta.js               Metadados Open Graph das páginas públicas
  migrations/           Migrations SQL numeradas
  routes/               Rotas por domínio (auth, passwordReset, products, orders, invitations, health)
  schemas/              Esquemas Zod por domínio
  middleware/           Sessão, origem, limitadores e tratamento de erros
  queries/              Consultas reutilizadas entre rotas
  sql/                  Auxiliares de SQL (atualização parcial)
tests/
  helpers/api.js       Cliente de teste, criação de contas e limpeza de dados
  unit/                Testes unitários das libs do frontend e da configuração
  api/                 Testes de integração dos endpoints
.github/workflows/
  ci.yml               Build, testes e smoke a cada push e pull request
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
- `recuperacao_senha`: hash do token de redefinição, validade e marcação de uso.
- `schema_migrations`: migrations já aplicadas, com o nome do arquivo e o checksum do conteúdo.

O schema versionado está em [`../server/migrations/`](../server/migrations/), em arquivos SQL numerados. Para aplicar a estrutura no banco configurado, use `npm run db:setup`: o comando cria `schema_migrations`, aplica apenas as migrations pendentes, cada uma em uma transação, e recusa continuar se um arquivo já aplicado tiver sido editado — nesse caso, crie uma nova migration com o próximo número.

## Identidade visual

A direção vigente é a **noite festiva**: hero em gradiente `#4F46E5 → #8B5CF6 → #FF5E62`, surfaces claras com borda em gradiente, header fixo em glassmorphism, rodapé noturno e camadas de confetes/estrelas.

- Paleta oficial: rosa magenta `#FF5E62`, roxo profundo `#4F46E5`, amarelo ouro `#F59E0B` e azul turquesa `#06B6D4`.
- Por contraste AA, o Tailwind expõe variantes profundas (`#E11D48`, `#B45309`, `#0E7490`) para texto e botões sobre fundo claro.
- Tipografia: Baloo 2 (`font-heading`), Poppins (`font-display`) e Inter (`font-sans`).
- Tokens, gradientes, sombras e animações ficam em `tailwind.config.js`; as primitivas visuais em `src/style.css`.
- O guia completo com códigos de cor e orientações de aplicação está em [`IDENTIDADE-VISUAL.md`](./IDENTIDADE-VISUAL.md).

## Configuração e comandos

Requisitos: Node.js compatível com o projeto e uma base PostgreSQL Neon.

1. Crie um arquivo `.env` local com as configurações abaixo. Não inclua valores secretos no repositório ou em documentação.

   ```env
   DATABASE_URL=<sua-conexao-neon>
   APP_ORIGIN=http://127.0.0.1:5173
   PORT=3000
   HOST=127.0.0.1
   NODE_ENV=development
   TRUST_PROXY=0
   AUTH_RATE_LIMIT=10
   RSVP_RATE_LIMIT=30
   JSON_BODY_LIMIT=100kb
   RESEND_API_KEY=
   MAIL_FROM=Festou! <nao-responda@festou.app>
   PASSWORD_RESET_TTL_MINUTES=60
   ```

   `TRUST_PROXY` é o número de proxies reversos na frente da aplicação (0 = nenhum, 1 = nginx padrão). `LOGIN_EMAIL_RATE_LIMIT` limita as tentativas de login por e-mail. `JSON_BODY_LIMIT` define o tamanho máximo do corpo aceito. `RESEND_API_KEY` habilita o envio do e-mail de recuperação de senha; sem ela, o link aparece no console fora de produção. `PASSWORD_RESET_TTL_MINUTES` define a validade do link (60 minutos por padrão).

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
| `npm run db:setup` | Aplica as migrations pendentes ao banco Neon |
| `npm run build` | Compila o frontend para produção |
| `npm run preview` | Serve localmente a compilação de produção |
| `npm test` | Roda toda a suíte de testes |
| `npm run test:watch` | Roda os testes em modo interativo |
| `npm run test:unit` | Roda apenas os testes unitários do frontend |
| `npm run test:api` | Roda apenas os testes de integração da API |
| `npm run smoke` | Percorre o fluxo real ponta a ponta contra um servidor em execução |

## API atual

| Método | Endpoint | Uso |
| --- | --- | --- |
| `GET` | `/api/health` | Verificar API e conexão com o banco |
| `POST` | `/api/auth/register` | Criar conta |
| `POST` | `/api/auth/login` | Iniciar sessão |
| `GET` | `/api/auth/me` | Consultar sessão |
| `POST` | `/api/auth/logout` | Encerrar sessão |
| `POST` | `/api/auth/forgot-password` | Enviar link de recuperação de senha; responde igual exista ou não o e-mail |
| `POST` | `/api/auth/reset-password` | Trocar a senha com o token do link e encerrar as sessões da conta |
| `GET` | `/api/products` | Consultar vitrine; aceita `categoria`, `pagina` e `limite` e devolve `pagination` com total e total de páginas |
| `POST` | `/api/products` | Publicar produto como fornecedor |
| `GET` | `/api/supplier/products` | Consultar catálogo completo do fornecedor autenticado (ativos e pausados) |
| `GET` | `/api/supplier/products/:id` | Consultar um produto do fornecedor autenticado |
| `PATCH` | `/api/supplier/products/:id` | Editar produto do fornecedor autenticado |
| `DELETE` | `/api/supplier/products/:id` | Excluir produto do fornecedor autenticado |
| `PATCH` | `/api/supplier/products/:id/toggle-active` | Alternar visibilidade (pausar ou reativar) de produto na vitrine |
| `GET` | `/api/orders` | Consultar pedidos conforme perfil autenticado |
| `POST` | `/api/orders` | Criar pedido/orçamento como cliente |
| `POST` | `/api/invitations` | Criar convite como cliente |
| `GET` | `/api/invitations/mine` | Listar convites e respostas do anfitrião |
| `PATCH` | `/api/invitations/:id/rsvp-status` | Reabrir ou encerrar confirmações de presença como cliente |
| `PATCH` | `/api/invitations/:id` | Editar convite como cliente dono |
| `DELETE` | `/api/invitations/:id` | Excluir convite como cliente dono |
| `GET` | `/api/invitations/:slug` | Consultar convite público |
| `POST` | `/api/invitations/:slug/rsvp` | Criar ou atualizar resposta do convidado |
| `PATCH` | `/api/orders/:id/status` | Atualizar status do pedido conforme perfil (cancelar, negociar, confirmar, concluir) |

## Testes automatizados

A suíte usa Vitest 5 e roda contra o mesmo banco Neon configurado em `.env`. Os testes de integração criam contas com e-mail no domínio `teste.*@festou.test` e removem os dados ao final de cada arquivo (`cleanupTestData`).

| Arquivo | Cobertura |
| --- | --- |
| `tests/unit/format.test.js` | Formatação de preço, data e texto |
| `tests/unit/orderStatus.test.js` | Rótulos e estilos de status de pedido |
| `tests/unit/cart.test.js` | Persistência, limites, totais do carrinho e sincronização de preços |
| `tests/unit/session.test.js` | Cache da sessão, requisições simultâneas, login e logout |
| `tests/unit/security.test.js` | Hash de senha, formato antigo, rehash e comparação de tempo |
| `tests/unit/meta.test.js` | Título, descrição e escape das tags Open Graph do convite |
| `tests/unit/config.test.js` | Leitura e validação das variáveis de ambiente do servidor |
| `tests/api/auth.test.js` | Cadastro, login, sessão, origem e rotas protegidas |
| `tests/api/products.test.js` | Vitrine pública, filtro por categoria, permissões de fornecedor e edição/exclusão de produto |
| `tests/api/orders.test.js` | Criação e listagem de pedidos, negociação de status, isolamento entre perfis e e-mail mascarado até a confirmação |
| `tests/api/passwordReset.test.js` | Pedido de recuperação sem revelar cadastro, troca de senha, reuso do link e encerramento das sessões |
| `tests/api/invitations.test.js` | Convites, RSVP, reabertura, edição/exclusão e listagem das respostas |
| `tests/api/errors.test.js` | Corpo inválido (400), corpo grande demais (413) e rotas inexistentes |
| `tests/api/rateLimit.test.js` | Contagem por IP real atrás de proxy e limites de login e cadastro |

Variáveis usadas nos testes: `AUTH_RATE_LIMIT` e `RSVP_RATE_LIMIT` são elevadas para 1000 em `tests/setup.js`, para que a suíte não seja bloqueada pelo limitador de requisições.

Além da suíte automatizada, `scripts/smoke.mjs` (`npm run smoke`) percorre o fluxo real ponta a ponta: cadastro de fornecedor e cliente, publicação de produto, consulta da vitrine, criação de pedido, negociação de status pelo fornecedor, criação de convite, RSVP com atualização pelo mesmo e-mail, checagem de autorização, rotas do SPA e limpeza dos dados criados.

O smoke sobe o próprio servidor na porta `3100` (configurável em `SMOKE_PORT`), com `AUTH_RATE_LIMIT` e `RSVP_RATE_LIMIT` elevados, e encerra o processo ao final — inclusive em `Ctrl+C`. Para rodar contra um servidor já em execução, defina `SMOKE_BASE_URL` (por exemplo `http://127.0.0.1:3000`); `SMOKE_ORIGIN` ajusta a origem enviada nas requisições.

## Validação da auditoria de dependências

Em 21/10/2026 o `npm audit` apontava 10 vulnerabilidades (3 moderate, 5 high, 2 critical). Tratamento:

- **Vitest 3 → 5.0.5:** elimina as falhas de `@vitest/mocker` e `tinypool` (incluindo as duas críticas). A suíte não precisou de mudança de API; `npm test` segue com 49 testes aprovados.
- **`postcss-selector-parser` ≥ 7.1.6:** aplicado por `overrides` no `package.json`, sem migrar o Tailwind. O `npm run build` continua gerando o CSS.
- **`braces` (5 high restantes):** o aviso vale para *todas* as versões publicadas e chega pelo `chokidar`/`micromatch` do Tailwind CSS 3.4.19 (último 3.x). O `npm audit fix --force` instalaria Tailwind 4, breaking change fora desta etapa. O impacto é DoS por padrões globais aninhados em ferramenta de *build*, não no servidor de produção. Aceito até uma migração consciente do Tailwind.

## Validação executada na etapa de estabilização

- `npm run build` concluído com sucesso (39 módulos).
- `npm test` com 49 testes aprovados em 7 arquivos.
- `npm run smoke` com 27 verificações aprovadas no fluxo ponta a ponta.
- `npm start` verificado servindo o SPA compilado (`/`, rota de convite e `/api/health` respondendo 200).
- Auditoria de encoding dos fontes: nenhum caractere corrompido ou BOM indevido.
- Banco conferido ao final da suíte: apenas os dados de origem permanecem, sem resíduos de teste.

Correções aplicadas na etapa: retorno de `created_at` e dos identificadores de item na criação de pedido (quebravam a tela do carrinho), `aceita_rsvp` na criação de convite, agregados de confirmação convertidos para número, limites de requisição configuráveis por ambiente, duplicação de requisição na vitrine, `APP_ORIGIN` deixado de ser fixo no código, aceitação de requisições de mesma origem (a validação anterior bloqueava toda a aplicação quando o Express servia o SPA), 404 de API em JSON e cabeçalho global com navegação acessível.

## Validação executada na etapa de identidade visual

- `npm run build` concluído com sucesso (40 módulos) e classes conferidas no CSS gerado.
- `npm test` com 50 testes aprovados em 7 arquivos (inclui regressão do CSP para imagens externas).
- `npm run smoke` com 27 verificações aprovadas no fluxo ponta a ponta.
- Hero, vitrine, carrinho, convites, painel do fornecedor, telas de acesso e 404 migrados para a noite festiva.
- Rodapé global criado (`AppFooter.vue`) e header convertido para fixo com glassmorphism.
- `img-src` do CSP ampliado para `https:` — as fotos de produto hospedadas fora do domínio leave de ser bloqueadas pelo navegador.

## Validação executada na etapa de endurecimento da API

- `npm run build` concluído com sucesso (42 módulos).
- `npm test` com 70 testes aprovados em 10 arquivos.
- `npm run smoke` com 39 verificações aprovadas no fluxo ponta a ponta, incluindo a edição e a exclusão de produto e de convite e a recusa de imagem fora de https.
- `npm run db:setup` aplicou as duas migrations e, na segunda execução, não repetiu nada; a edição de uma migration já aplicada foi recusada com mensagem explicando o motivo.
- Login com e-mail inexistente mede o mesmo tempo de resposta do login com e-mail existente, com a comparação feita contra um hash fictício.
- `npm start` continua servindo o SPA compilado e a API no mesmo processo após o desenho modular.

## Validação executada na etapa de arquitetura do backend

- `server/index.js` caiu de 1079 linhas para 16: as regras de negócio foram para `server/routes/`, os esquemas Zod para `server/schemas/`, a sessão, a origem, os limitadores e o tratamento de erros para `server/middleware/`, e as consultas reutilizadas para `server/queries/`.
- Cada rota foi movida sem mudança de contrato: os 70 testes e as 39 verificações do smoke continuaram passando.
- `server/app.js` monta o app e `server/index.js` apenas sobe o servidor, o que mantém `npm start`, o smoke e os testes usando o mesmo ponto de entrada.
- `.github/workflows/ci.yml` compila o frontend, roda os testes unitários e, quando o segredo `DATABASE_URL` existe no repositório, também os testes de API e o smoke.

## Validação executada na etapa de sessão e integridade dos dados

- `npm run build` concluído com sucesso (43 módulos).
- `npm test` com 90 testes aprovados em 12 arquivos.
- `npm run smoke` com 39 verificações aprovadas no fluxo ponta a ponta.
- A sessão do frontend passou a ser carregada uma única vez e compartilhada pelo cabeçalho e pelos guards de rota; a navegação para `/carrinho` sem sessão continua caindo em `/login` (conferido no DOM renderizado).
- O carrinho compara os preços salvos com a vitrine ao abrir a tela e avisa quando um preço mudou ou um item saiu do catálogo.
- `POST /api/health` passa a responder 405 com `Allow: GET, HEAD`; assets com hash no nome ficam em cache de um ano e o `index.html` é sempre revalidado.

## Validação executada na etapa de vitrine paginada e prévia

- `npm run build` concluído com sucesso (43 módulos).
- `npm test` com 100 testes aprovados em 13 arquivos.
- `npm run smoke` com 43 verificações aprovadas no fluxo ponta a ponta.
- `GET /api/products` devolve `pagination` com `pagina`, `limite`, `total`, `totalPaginas` e `temMais`; página 1 e 2 não repetem itens e `pagina`/`limite` inválidos respondem 400.
- A vitrine renderizou em navegador real com os produtos ativos e sem erro; o botão "Carregar mais" só aparece quando há próxima página.
- `/convite/:slug` passou a entregar `og:title`, `og:description`, `og:url`, `og:image` e as tags do Twitter, com escape de HTML; um slug inexistente continua servindo o SPA sem metadados.

## Validação executada na etapa de recuperação de senha e LGPD

- `npm run build` concluído com sucesso (45 módulos).
- `npm test` com 106 testes aprovados em 14 arquivos.
- `npm run smoke` com 46 verificações aprovadas no fluxo ponta a ponta.
- `POST /api/auth/forgot-password` responde 202 com a mesma mensagem para e-mail existente e inexistente; o pedido invalida links anteriores e o link expira em 60 minutos.
- `POST /api/auth/reset-password` troca a senha, marca o token como usado (reuso responde 400) e encerra todas as sessões da conta — a sessão aberta antes da troca deixa de autenticar.
- Sem `RESEND_API_KEY`, o e-mail é registrado no console fora de produção; com a chave, usa a API HTTP do Resend em `server/mailer.js`.
- O fornecedor recebe o e-mail do cliente mascarado (`t***@dominio`) até o pedido ser confirmado; depois vê o endereço completo.

## Próximos passos

Não há um roadmap fechado neste documento. Ao priorizar a continuação, considerar:

- revisar a interface responsiva em telas pequenas e a camada de decoração nos convites públicos;
- avaliar migração do Tailwind 3 para 4 quando houver folga, para sair do `braces` flagrado no `npm audit`;
- avaliar verificação de e-mail no cadastro (hoje a conta já entra direto) e confirmação de troca de e-mail;
- mover o limitador de requisições para um store compartilhado se a API passar a rodar em mais de uma instância (as sessões já ficam no banco);
- definir status por item se pedidos com vários fornecedores passarem a precisar de negociação independente;
- planejar deploy, observabilidade, backups e configuração de produção.

## Como manter este documento

Este arquivo deve evoluir junto com o código. Ao concluir uma mudança relevante:

1. Atualize o estado das etapas e as rotas se o produto mudar.
2. Registre alterações de arquitetura, endpoints, modelo de dados e comandos.
3. Atualize validações e testes de acordo com o que realmente foi executado.
4. Mantenha decisões futuras na seção de próximos passos, sem descrevê-las como funcionalidades existentes.
5. Nunca adicione credenciais, dados pessoais ou valores de `.env`.
