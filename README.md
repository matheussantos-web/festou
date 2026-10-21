# Festou!

Plataforma de festas e eventos com Vue 3, Vite, Tailwind CSS, Express e Neon PostgreSQL.

Visão geral do produto, arquitetura, rotas, modelo de dados e instruções de manutenção da documentação: [docs/PROJETO.md](./docs/PROJETO.md).

## Configuração local

1. Revogue a senha Neon que foi compartilhada e crie uma nova credencial no painel do Neon.
2. Crie `.env` na raiz do projeto com as variáveis abaixo. Nunca compartilhe o valor de `DATABASE_URL`.

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST/neondb?sslmode=require
APP_ORIGIN=http://127.0.0.1:5173
PORT=3000
HOST=127.0.0.1
NODE_ENV=development
AUTH_RATE_LIMIT=10
RSVP_RATE_LIMIT=30
```

3. Execute `npm run db:setup` para criar as tabelas no Neon.
4. Execute `npm install` e `npm run dev`.
5. Abra `http://127.0.0.1:5173`.

O desenvolvimento inicia o frontend Vite e a API Express em conjunto. O Vite encaminha `/api` para o backend local. A string do banco e as senhas nunca devem ser expostas ao frontend.

O pacote de identidade visual da marca — paleta, tipografia, uso de grafismos e tom de voz — está documentado em [docs/IDENTIDADE-VISUAL.md](./docs/IDENTIDADE-VISUAL.md). Os tokens estão em `tailwind.config.js`; o padrão de confetes, o favicon e a arte principal ficam em `public/`.

## Testes

```bash
npm test            # suíte completa (unitários + integração da API)
npm run test:unit   # apenas as libs do frontend
npm run test:api    # apenas os endpoints, com supertest
npm run smoke       # fluxo real ponta a ponta, com o servidor em execução
```

Os testes de integração usam o mesmo banco Neon do `.env`, criam contas com e-mail `teste.*@festou.test` e removem os dados ao final de cada arquivo. O `npm run smoke` cria contas `smoke.*@festou.test` e também limpa tudo ao terminar.

## Autenticação e dados

O backend cria perfis `cliente` e `fornecedor`, armazena senhas com scrypt e usa sessões aleatórias em cookies HttpOnly. Produtos são lidos pela vitrine pública e só fornecedores autenticados podem anunciá-los. A autorização ocorre na API; o Neon não é acessado pelo navegador.

Clientes podem adicionar produtos ao carrinho, ajustar quantidades e solicitar um orçamento em `/carrinho`. O backend consulta novamente os produtos ativos, calcula os valores e grava o pedido e seus itens em uma transação. O histórico do cliente também aparece nessa tela.

Clientes também podem criar convites digitais em `/convites`, escolher um tema e compartilhar o link público `/convite/:slug`. Os convidados podem confirmar, recusar ou responder talvez sem criar conta; enviar outra resposta com o mesmo e-mail atualiza o RSVP existente. O anfitrião acompanha as respostas e a quantidade de pessoas confirmadas na lista de convites.

Para produção, execute `npm run build` e inicie com `npm start`: o mesmo processo passa a servir o SPA compilado em `dist/` com fallback de rota e a API em `/api`. Configure `DATABASE_URL`, `APP_ORIGIN`, `NODE_ENV=production`, `HOST=0.0.0.0` e um proxy HTTPS que encaminhe o tráfego para o servidor Express.
