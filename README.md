# Festou!

Plataforma para organizar festas, encontrar fornecedores e montar orcamentos.

## Desenvolvimento

```sh
npm install
npm run dev
```

Crie um arquivo `.env` na raiz usando `.env.example` como modelo e preencha as credenciais publicas do projeto Supabase.

## Autenticacao e perfis

Execute o SQL de `supabase/migrations/20261021000000_create_perfis.sql` no SQL Editor do Supabase. A migration cria a tabela `public.perfis`, ativa RLS e cria automaticamente um perfil para cada novo usuario autenticado.

O cadastro suporta os perfis `cliente` e `fornecedor`. Quando a confirmacao de e-mail estiver ativa, o usuario recebe uma mensagem para confirmar o endereco antes de entrar.
