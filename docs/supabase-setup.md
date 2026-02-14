# Supabase Setup (Free Tier)

Este projeto suporta modo local sem autenticacao.
Para habilitar auth + banco em producao gratuita:

## 1. Criar projeto no Supabase

1. Criar conta/projeto em https://supabase.com
2. Copiar:
   - Project URL
   - anon public key

## 2. Configurar variaveis no frontend (`apps/web/.env.local`)

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## 3. Aplicar schema inicial

1. Abrir SQL Editor no Supabase.
2. Executar `infra/supabase/migrations/0001_init.sql`.

## 4. Validar

1. Rodar `pnpm dev:web`.
2. Acessar `/` e confirmar exibicao da landing publica.
3. Acessar `/auth/signup`.
4. Criar usuario.
5. Confirmar acesso a `/dashboard`, `/canvas`, `/account`.
6. Acessar `/survey/consent` e registrar aceite do TCLE.
7. Acessar `/survey` e validar envio da pesquisa.

## 5. Observacoes de custo

- Comece no Free Tier.
- Configure alertas de uso no painel.
- Evite features pesadas (jobs e storage massivo) no inicio.
