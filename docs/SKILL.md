---
name: srl-canvas-dev
description: Use this skill when evolving the SRL Canvas web app (React + Vite + TypeScript + Tailwind), including UI flows, scoring logic, persistence, and export/report features.
---

# SRL Canvas Dev Skill

## Purpose

Padronizar como agentes de IA colaboram neste projeto, com foco em qualidade, rastreabilidade e entregas incrementais.

## Project Snapshot

- Stack: Monorepo pnpm workspaces com `apps/web` (React, Vite, TypeScript, Tailwind, Zustand, Chart.js) e `apps/api` (Fastify + TypeScript).
- Dominio: avaliacao de maturidade SRL Canvas (12 blocos, niveis 1-9, evidencias).
- Estado local: persistencia em `localStorage`.
- Saidas-chave: dashboard, edicao por bloco, radar, scorecard de risco, exportacao.

## Working Rules

1. Sempre preservar fidelidade metodologica do guia SRL.
2. Nunca quebrar calculos centrais:
   - `total = soma das 12 notas`
   - `media = total / 12`
   - `desvio-padrao populacional`
   - `cv = desvio / media`
   - `scorecard = total * (1 - cv)`
3. Manter compatibilidade com modo claro/escuro.
4. Evitar regressao de UX mobile e desktop.
5. Persistencia nao pode perder dados existentes sem migracao explicita.

## Default Workflow

1. Ler contexto atual (`App`, store, componentes, dados).
2. Definir mudanca minima viavel.
3. Implementar alteracoes pequenas e coesas.
4. Validar com build e, quando aplicavel, teste manual do fluxo.
5. Documentar: o que mudou, por que, como validar.

## File Map

- `apps/web/src/App.tsx`: composicao principal de telas e modais.
- `apps/web/src/store/useCanvasStore.ts`: estado global e persistencia.
- `apps/web/src/data/srlBlocks.ts`: definicoes dos 12 blocos e niveis.
- `apps/web/src/components/BlockEditModal.tsx`: edicao de notas/evidencias.
- `apps/web/src/components/ResultsModal.tsx`: radar, scorecard, exportacao.
- `apps/web/src/utils/score.ts`: formulas de score.
- `apps/api/src/server.ts`: bootstrap da API e endpoint de healthcheck.

## Change Guardrails

- Preferir alteracoes incrementais em vez de refatoracoes grandes.
- Em mudancas de dominio, atualizar tambem `PRD.md` e `workflows.md`.
- Em mudancas de formato de resposta da IA, atualizar `output-patterns.md`.
- Em mudancas de UX informacional, atualizar `progressive-disclosure-patterns.md`.

## Validation Checklist

- `pnpm lint` executa sem erros.
- `pnpm test` executa sem erros.
- `pnpm build` executa sem erros.
- Fluxo de edicao de bloco continua funcional.
- Radar e scorecard refletem as notas atuais.
- Dados persistem apos refresh.
- Exportacao PNG/PDF continua operacional.
