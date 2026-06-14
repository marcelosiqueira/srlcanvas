# SRL Canvas Monorepo

Aplicacao web para diagnostico de maturidade de startups com base no framework **Startup Readiness Level (SRL) Canvas**.

O projeto esta estruturado como monorepo e inclui:

- Frontend web (React + Vite + TypeScript)
- API backend (Fastify + TypeScript + Prisma/MySQL + JWT)
- Auth e persistencia remota via API propria (opcional — o app funciona em modo local sem conta)

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
│   └── api/          # API Fastify (auth JWT, canvases, pesquisa) + Prisma/MySQL
├── packages/
│   └── shared/       # tipos e utilitarios compartilhados
├── docs/             # PRD, workflows, checklist, setup do backend
├── infra/
│   └── nginx/        # exemplo de server block para deploy da SPA + proxy /api
│       └── srlcanvas.conf
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
- Prisma + MySQL 8
- JWT (`@fastify/jwt`) + argon2id para senhas
- Zod

### Qualidade

- ESLint
- Prettier
- Husky + lint-staged
- GitHub Actions (CI)

## Requisitos

- Node.js 22+
- pnpm 9+ (obrigatorio)
- MySQL 8 (apenas para auth/persistencia remota — ver `docs/backend-setup.md`)

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

### E2E remoto (opcional)

Para habilitar o cenario E2E de persistencia remota autenticada (API propria), defina:

```env
VITE_API_URL=/api
E2E_REMOTE_EMAIL=usuario_teste@example.com
E2E_REMOTE_PASSWORD=senha_do_usuario_teste
```

Sem essas variaveis, o cenario remoto fica `skip` e os demais testes E2E locais continuam executando.

## Backend (Auth + Banco)

O frontend funciona em modo local mesmo sem backend configurado.

Para habilitar auth e persistencia remota:

1. Subir a API + MySQL conforme `docs/backend-setup.md`.
2. Criar `apps/web/.env.local`:

```env
VITE_API_URL=/api
VITE_RESEARCH_SURVEY_ENABLED=true
VITE_RESEARCH_SURVEY_ACTIVE_VERSION=questionario_quantitativo_srl_canvas_revisado_2025-11-28
VITE_PRODUCT_METRICS_ENABLED=true
```

Variaveis da pesquisa academica:

- `VITE_RESEARCH_SURVEY_ENABLED`:
  - `true`: exibe TCLE + questionario.
  - `false`: desativa o fluxo de survey no app (rotas e CTAs).
- `VITE_RESEARCH_SURVEY_ACTIVE_VERSION`:
  - registra a versao ativa do instrumento nos payloads de consentimento e survey.
  - recomendacao: manter alinhada ao instrumento aprovado no comite de etica.
- `VITE_PRODUCT_METRICS_ENABLED`:
  - `true`: habilita instrumentacao local de eventos de produto (inicio/conclusao/abandono).
  - `false`: desabilita coleta local de metricas.

3. Aplicar migracoes do Prisma:

```bash
pnpm --filter @srl/api exec prisma migrate dev
```

Guia detalhado: `docs/backend-setup.md`.

## API

Com a API rodando localmente:

- `GET /health` -> status do servico
- `POST /auth/register`, `POST /auth/login` -> autenticacao (JWT)
- `GET /me`, `PATCH /me` -> perfil do usuario autenticado
- `GET /canvases`, `PUT /canvases` -> persistencia remota de canvases
- `GET/POST /research/consent`, `POST /research/consent/revoke`, `POST /research/survey-responses` -> pesquisa academica

## Documentacao do Projeto

- `docs/PRD.md`
- `docs/backend-setup.md`
- `docs/workflows.md`
- `docs/output-patterns.md`
- `docs/progressive-disclosure-patterns.md`
- `docs/implementation-checklist.md`
- `docs/technical-context.md`
- `docs/product-metrics-events.md`
- `docs/dissertation-evidence-package.md`
- `docs/LGPD.md`
- `docs/TCLE.md`

## Estado Atual

Implementado:

- Meu Canvas funcional
- Dashboard / Novo Canvas / Minha Conta
- Auth UI e guard de rotas
- API propria (Fastify + MySQL/Prisma + JWT) com persistencia remota de canvases
- Migracao automatica localStorage -> banco no primeiro login
- Survey academico nativo em `/survey` (baseado no questionario quantitativo)
- Fluxo de TCLE em `/survey/consent` com aceite e revogacao
- Pipeline de qualidade (lint, test, build, e2e)

Em andamento:

- Evolucao de dashboard multi-canvas

## Open Source

Este projeto esta sendo preparado para abertura como open source.

Diretrizes iniciais para contribuicao:

- rode `pnpm check` antes de enviar PR
- mantenha mudancas alinhadas com `docs/`
- preserve regras de negocio do SRL Canvas

## Licenca

Licenca ainda nao definida.
