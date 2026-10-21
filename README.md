# Festou!

Plataforma de festas e eventos com Vue 3, Vite, Tailwind CSS, Express e Neon PostgreSQL.

Visão geral do produto, arquitetura, rotas, modelo de dados e instruções de manutenção da documentação: [docs/PROJETO.md](./docs/PROJETO.md).

## Configuração local

1. Revogue a senha Neon que foi compartilhada e crie uma nova credencial no painel do Neon.
2. Copie `.env.example` para `.env` e preencha as variáveis. Nunca compartilhe o valor de `DATABASE_URL`.

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST/neondb?sslmode=require
APP_ORIGIN=http://127.0.0.1:5173
PORT=3000
HOST=127.0.0.1
NODE_ENV=development
TRUST_PROXY=0
AUTH_RATE_LIMIT=10
RSVP_RATE_LIMIT=30
RESEND_API_KEY=
MAIL_FROM=Festou! <nao-responda@festou.app>
PASSWORD_RESET_TTL_MINUTES=60
```

`TRUST_PROXY` é o número de proxies reversos na frente da aplicação (0 = nenhum, 1 = nginx padrão). Sem essa variável o Express ignora o `X-Forwarded-For` e o limitador de requisições passa a contar o IP do proxy, o que transforma o limite em um teto global. `LOGIN_EMAIL_RATE_LIMIT` limita as tentativas de login por e-mail, e `JSON_BODY_LIMIT` define o tamanho máximo do corpo aceito.

`RESEND_API_KEY`, `MAIL_FROM` e `PASSWORD_RESET_TTL_MINUTES` controlam o e-mail de recuperação de senha. Sem a chave, o link é impresso no console do servidor (fora de produção) em vez de ser enviado — é o suficiente para testar o fluxo localmente.

3. Execute `npm run db:setup` para criar as tabelas no Neon.
4. Execute `npm install` e `npm run dev`.
5. Abra `http://127.0.0.1:5173`.

O desenvolvimento inicia o frontend Vite e a API Express em conjunto. O Vite encaminha `/api` para o backend local. A string do banco e as senhas nunca devem ser expostas ao frontend.

O pacote de identidade visual da marca — paleta, tipografia, uso de grafismos e tom de voz — está documentado em [docs/IDENTIDADE-VISUAL.md](./docs/IDENTIDADE-VISUAL.md). Os tokens estão em `tailwind.config.js`; o padrão de confetes, o favicon e a arte principal ficam em `public/`.

## Identidade visual

A direção vigente é a **noite festiva**: hero em gradiente `#4F46E5 → #8B5CF6 → #FF5E62`, cards claros com borda em gradiente, header fixo em glassmorphism e rodapé noturno com confetes.

- Paleta oficial e regras de contraste: [docs/IDENTIDADE-VISUAL.md](./docs/IDENTIDADE-VISUAL.md).
- Tokens de cor, gradientes, sombras e animações: `tailwind.config.js`.
- Primitivas visuais (wordmark, botões, cards, vidro, campo de confetes): `src/style.css`.
- Camada de estrelas, confetes e balões: `src/components/FestouDecor.vue`.
- Rodapé global: `src/components/AppFooter.vue`.

As cores puras da marca não passam em contraste AA sobre fundo claro, por isso o Tailwind expõe variantes profundas (`festou-primary`, `festou-accent`, `festou-turquoise`) para texto e botões. Animações são desligadas em `prefers-reduced-motion: reduce`.

## Testes

```bash
npm test            # suíte completa (unitários + integração da API)
npm run test:unit   # apenas as libs do frontend
npm run test:api    # apenas os endpoints, com supertest
npm run smoke       # fluxo real ponta a ponta, com servidor próprio
```

Os testes de integração usam o mesmo banco Neon do `.env`, criam contas com e-mail `teste.*@festou.test` e removem os dados ao final de cada arquivo. O `npm run smoke` cria contas `smoke.*@festou.test` e também limpa tudo ao terminar. No GitHub Actions, os passos de API e smoke só rodam quando existe o secret `DATABASE_URL` — use um branch do Neon dedicado ao CI — e aplicam as migrations com `npm run db:setup` antes dos testes.

O smoke sobe o próprio servidor na porta `3100`, com os limitadores de requisição elevados, e o encerra ao final. Para apontá-lo para outro alvo, defina `SMOKE_PORT` (porta do servidor próprio) ou `SMOKE_BASE_URL` (URL de um servidor já em execução, por exemplo `http://127.0.0.1:3000`); `SMOKE_ORIGIN` ajusta a origem enviada nas requisições.

## Autenticação e dados

O backend cria perfis `cliente` e `fornecedor`, armazena senhas com scrypt (parâmetros fixos no código, hash versionado e rehash automático no login) e usa sessões aleatórias em cookies HttpOnly. Produtos são lidos pela vitrine pública — em páginas de 12, com filtro por categoria e botão de carregar mais — e só fornecedores autenticados podem anunciá-los. A autorização ocorre na API; o Neon não é acessado pelo navegador.

Quem esquece a senha usa `/recuperar-senha`: o backend gera um token de uso único (guardado como hash, com validade configurável), envia o link por e-mail e, ao redefinir em `/redefinir-senha`, troca a senha e encerra todas as sessões daquela conta. A resposta do pedido é sempre a mesma, exista ou não o e-mail, para não revelar quem tem conta.

Clientes podem adicionar produtos ao carrinho, ajustar quantidades e solicitar um orçamento em `/carrinho`. O backend consulta novamente os produtos ativos, calcula os valores e grava o pedido e seus itens em uma transação. Se um preço tiver mudado desde que o item entrou no carrinho, a tela avisa e atualiza o valor antes do envio. O histórico do cliente aparece nessa tela em páginas de 10, com botão de carregar mais.

Clientes também podem criar convites digitais em `/convites`, escolher um tema e compartilhar o link público `/convite/:slug`. Os convidados podem confirmar, recusar ou responder talvez sem criar conta; enviar outra resposta com o mesmo e-mail atualiza o RSVP existente. O anfitrião acompanha as respostas e a quantidade de pessoas confirmadas na lista de convites, edita o convite, encerra ou reabre as confirmações e exclui o convite quando a festa passa. Ao compartilhar o link, o servidor injeta as tags Open Graph no HTML, então o WhatsApp e as redes sociais mostram o título do evento, a data, o local e a imagem da marca na prévia.

Fornecedores anunciam produtos em `/fornecedor/produtos/novo` e os editam, pausam ou excluem em `/fornecedor/painel`. Os orçamentos recebidos ficam na aba "Orçamentos Recebidos", também paginada, onde o fornecedor negocia, confirma ou recusa cada pedido. Toda rota de fornecedor confere a posse do recurso: um fornecedor não alcança o produto nem o pedido de outro. O e-mail do cliente só é liberado depois que o pedido é confirmado; antes disso o fornecedor vê o endereço mascarado (`t***@dominio`).

Para produção, execute `npm run build` e inicie com `npm start`: o mesmo processo passa a servir o SPA compilado em `dist/` com fallback de rota e a API em `/api`. Configure `DATABASE_URL`, `APP_ORIGIN`, `NODE_ENV=production`, `HOST=0.0.0.0` e um proxy HTTPS que encaminhe o tráfego para o servidor Express — nesse cenário, ajuste `TRUST_PROXY` para o número de proxies na frente da aplicação.
