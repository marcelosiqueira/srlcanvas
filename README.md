# SRL Canvas Monorepo

Aplicacao web para diagnostico de maturidade de startups com base no framework **Startup Readiness Level (SRL) Canvas**.

O projeto esta estruturado como monorepo e inclui:

- Frontend web (React + Vite + TypeScript)
- API backend (Fastify + TypeScript)
- Base para auth e banco com Supabase (opcional)

## Visao Geral

O SRL Canvas avalia 12 blocos de maturidade (nota 1 a 9), registra evidencias e gera:

- pontuacao total
- grafico de radar
- scorecard de risco

Formula do scorecard:

`Scorecard = Pontuacao Total * (1 - Coeficiente de Variacao)`

## Estrutura do Repositorio

```text
.
├── apps/
│   ├── web/          # SPA React (dashboard, canvas, conta, auth)
│   └── api/          # API Fastify (healthcheck e base backend)
├── packages/
│   └── shared/       # tipos e utilitarios compartilhados
├── docs/             # PRD, workflows, checklist, setup Supabase
├── infra/
│   ├── nginx/        # exemplo de server block para deploy da SPA
│   │   └── srl-canvas.conf
│   └── supabase/
│       └── migrations/
└── .github/workflows/
```

## Stack

### Web (`apps/web`)

- React 18
- Vite
- TypeScript
- Tailwind CSS
- Zustand
- Chart.js / react-chartjs-2
- Vitest + Testing Library
- Playwright (E2E)

### API (`apps/api`)

- Fastify
- TypeScript
- Zod

### Qualidade

- ESLint
- Prettier
- Husky + lint-staged
- GitHub Actions (CI)

## Requisitos

- Node.js 20+
- pnpm 9+ (obrigatorio)

## Setup Local

```bash
corepack enable
pnpm install
```

### Rodar apenas Web

```bash
pnpm dev:web
```

### Rodar apenas API

```bash
pnpm dev:api
```

### Rodar Web + API

```bash
pnpm dev:all
```

## Scripts Principais

```bash
pnpm lint
pnpm test
pnpm build
pnpm check
pnpm test:e2e
pnpm format
pnpm format:check
```

## Supabase (Auth + Banco)

O frontend funciona em modo local mesmo sem Supabase configurado.

Para habilitar auth e persistencia remota:

1. Criar projeto no Supabase.
2. Criar `apps/web/.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

3. Aplicar migracao SQL:

- `infra/supabase/migrations/0001_init.sql`

Guia detalhado: `docs/supabase-setup.md`.

## API

Com a API rodando localmente:

- `GET /health` -> status do servico

## Documentacao do Projeto

- `docs/PRD.md`
- `docs/workflows.md`
- `docs/output-patterns.md`
- `docs/progressive-disclosure-patterns.md`
- `docs/implementation-checklist.md`
- `docs/LGPD.md`
- `docs/TCLE.md`

## Estado Atual

Implementado:

- Meu Canvas funcional
- Dashboard / Novo Canvas / Minha Conta
- Auth UI e guard de rotas
- Base de schema Supabase com RLS
- Survey academico nativo em `/survey` (baseado no questionario quantitativo)
- Fluxo de TCLE em `/survey/consent` com aceite e revogacao
- Pipeline de qualidade (lint, test, build, e2e)

Em andamento:

- Persistencia remota completa de canvases
- Migracao automatica localStorage -> banco
- Evolucao de dashboard multi-canvas

## Open Source

Este projeto esta sendo preparado para abertura como open source.

Diretrizes iniciais para contribuicao:

- rode `pnpm check` antes de enviar PR
- mantenha mudancas alinhadas com `docs/`
- preserve regras de negocio do SRL Canvas

## Licenca

Licenca ainda nao definida.
