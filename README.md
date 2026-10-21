# Festou!

Plataforma de festas e eventos com Vue 3, Vite, Tailwind CSS, Express e Neon PostgreSQL.

## Configuracao local

1. Revogue a senha Neon que foi compartilhada e crie uma nova credencial no painel do Neon.
2. Crie `.env` na raiz do projeto com as variaveis abaixo. Nunca compartilhe o valor de `DATABASE_URL`.

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST/neondb?sslmode=require
APP_ORIGIN=http://127.0.0.1:5173
PORT=3000
NODE_ENV=development
```

3. Execute `npm run db:setup` para criar as tabelas no Neon.
4. Execute `npm install` e `npm run dev`.
5. Abra `http://127.0.0.1:5173`.

O desenvolvimento inicia o frontend Vite e a API Express em conjunto. O Vite encaminha `/api` para o backend local. A string do banco e as senhas nunca devem ser expostas ao frontend.

## Autenticacao e dados

O backend cria perfis `cliente` e `fornecedor`, armazena senhas com scrypt e usa sessoes aleatorias em cookies HttpOnly. Produtos sao lidos pela vitrine publica e so fornecedores autenticados podem anuncia-los. A autorizacao ocorre na API; o Neon nao e acessado pelo navegador.

Para producao, configure `DATABASE_URL`, `APP_ORIGIN`, `NODE_ENV=production` e um proxy HTTPS que encaminhe `/api` para o servidor Express.
