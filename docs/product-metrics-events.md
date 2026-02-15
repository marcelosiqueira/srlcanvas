# Product Metrics Events - SRL Canvas

Ultima atualizacao: 2026-02-15

## 1. Objetivo

Definir o dicionario de eventos e os pontos de coleta da instrumentacao de produto (P1.4),
sem capturar dados sensiveis ou texto livre de participantes.

## 2. Regras de Privacidade

- Nao coletar e-mail, nome, startup, contato ou respostas textuais.
- Nao coletar payload bruto de survey/canvas.
- Coletar apenas dados operacionais de fluxo (inicio, conclusao, abandono e etapa).
- Persistencia local em `localStorage` com chave `srl-product-metrics-v1`.

## 3. Dicionario de Eventos

1. `canvas_started`
   - Quando: ao iniciar sessao no `CanvasPage`.
   - Payload: `sessionId`, `scopeType`, `supabaseEnabled`, `advancedMode`.

2. `canvas_completed`
   - Quando: ao atingir 12 blocos pontuados no `CanvasPage`.
   - Payload: `sessionId`, `filledBlocks`, `completionPercent`, `advancedMode`.

3. `canvas_abandoned`
   - Quando: saida do `CanvasPage` sem completar os 12 blocos.
   - Payload: `sessionId`, `filledBlocks`, `stage` (`metadata`, `early_blocks`, `mid_blocks`, `late_blocks`).

4. `survey_started`
   - Quando: inicio de sessao na `ResearchSurveyPage` com consentimento valido.
   - Payload: `sessionId`, `startedWithDraft`.

5. `survey_step_viewed`
   - Quando: mudanca/entrada de etapa na `ResearchSurveyPage`.
   - Payload: `sessionId`, `stepKey`, `stepIndex`, `stepCount`.

6. `survey_completed`
   - Quando: envio concluido da survey.
   - Payload: `sessionId`, `eligible`, `stepCount`, `completionSeconds`, `storage`.

7. `survey_step_abandoned`
   - Quando: saida da survey sem envio final.
   - Payload: `sessionId`, `stepKey`, `reason` (`responder_depois`, `route_exit`, `page_unload`).

## 4. Pontos de Coleta no Codigo

- `apps/web/src/pages/CanvasPage.tsx`
  - inicio de sessao (`canvas_started`)
  - conclusao (`canvas_completed`)
  - abandono na saida (`canvas_abandoned`)

- `apps/web/src/pages/ResearchSurveyPage.tsx`
  - inicio (`survey_started`)
  - visualizacao de etapa (`survey_step_viewed`)
  - conclusao (`survey_completed`)
  - abandono por etapa (`survey_step_abandoned`)

- `apps/web/src/pages/AccountPage.tsx`
  - leitura de relatorio agregado local para iteracao.

## 5. Relatorio Minimo Disponivel

Relatorio agregado em `Minha Conta`:

- total de inicios/conclusoes/abandonos de `canvas`;
- total de inicios/conclusoes/abandonos da `survey`;
- taxa de conclusao de cada fluxo;
- abandono por etapa da survey.

Fonte tecnica: `apps/web/src/services/productMetrics.ts`.
