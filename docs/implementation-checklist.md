# Implementation Checklist - Live Code Backlog

Ultima atualizacao: 2026-02-15

## 1. Objetivo

Executar melhorias de experiencia do SRL Canvas sem perder contexto metodologico,
com rastreabilidade entre requisito, implementacao, validacao e evidencia academica.

## 2. Baseline Atual

- Fluxo principal de avaliacao esta funcional (12 blocos, radar, score, exportacao).
- TCLE e survey academico estao implementados.
- CI configurada com lint, test, build e e2e.
- Validacao recente executada:
  - `pnpm check` (ok)
  - `pnpm test:e2e` (ok)

## 3. Regras de Execucao

- Sempre trabalhar em incrementos pequenos e verificaveis.
- Ao mudar comportamento do produto, atualizar docs no mesmo PR.
- Priorizar itens com maior impacto para iniciantes, especialistas e banca academica.
- Fechar cada item com criterio de pronto e evidencia de validacao.

## 4. Backlog Priorizado (P0 -> P2)

### P0 - Critico (confiabilidade e jornada principal)

- [x] P0.1 Persistencia remota completa no fluxo de uso
  - Escopo: salvar/atualizar canvas remoto durante uso normal; abrir canvas remoto para continuidade.
  - Evidencias: `canvasApi` usado fora da migracao inicial; fluxo completo testado.
  - Criterio de pronto: usuario autenticado nao perde progresso ao trocar dispositivo/sessao.

- [x] P0.2 Onboarding guiado para primeiro uso
  - Escopo: jornada curta orientada para iniciantes (metadados -> bloco 1 -> resultados).
  - Evidencias: componentes de guia e estado de progresso inicial.
  - Criterio de pronto: novo usuario consegue concluir primeira avaliacao sem instrucao externa.

- [x] P0.3 Melhoria de acessibilidade dos modais
  - Escopo: focus trap, foco inicial, retorno de foco ao gatilho e navegacao por teclado.
  - Evidencias: testes manuais e automatizados de teclado.
  - Criterio de pronto: modais operaveis sem mouse.

- [x] P0.4 Consistencia de entrada de dados (metadados)
  - Escopo: padronizar campo de data e validacoes de metadados.
  - Evidencias: formularios atualizados em `NewCanvasPage` e `CanvasPage`.
  - Criterio de pronto: formato de data consistente e sem ambiguidade.

### P1 - Alto impacto (adocao e medicao)

- [x] P1.1 Survey academico em etapas com progresso
  - Escopo: dividir questionario em secoes navegaveis com indicador de progresso.
  - Evidencias: `ResearchSurveyPage` em 7 etapas, progresso visual, rascunho com etapa atual, governanca por variavel (`enabled`/`activeVersion`) e testes (`vitest` + `playwright`).
  - Criterio de pronto: fluxo mais curto por etapa e rascunho consistente.

- [x] P1.2 Modo avancado para usuarios experientes
  - Escopo: reduzir cliques para edicao rapida e revisao de blocos.
  - Evidencias: toggle de modo avancado, filtros (`Todos/Pendentes/Pontuados`), acao `Proximo pendente`, ajuste rapido de score (`-1/+1`), atalhos de teclado (`N`, `R`, `F`, `1..9`, `Ctrl/Cmd+Enter`) e teste E2E dedicado.
  - Criterio de pronto: avaliacao recorrente com menor tempo medio.

- [x] P1.3 Historico de canvases com comparativo temporal
  - Escopo: listar avaliacoes anteriores e comparar evolucao de score.
  - Evidencias: secao `Historico e Comparativo Temporal` na `DashboardPage`, carregamento remoto por `listCanvasesByUser`, comparativo da avaliacao mais recente vs historico selecionado (delta de Total/Scorecard/CV/Blocos), lista temporal com `Ver Resultados`, utilitario dedicado `canvasHistory` e testes unitarios.
  - Criterio de pronto: usuario consegue analisar evolucao entre aplicacoes.

- [x] P1.4 Instrumentacao de metricas de produto
  - Escopo: eventos essenciais (inicio, conclusao, abandono por etapa), sem dados sensiveis.
  - Evidencias: servico `productMetrics` com dicionario tipado de eventos, coleta em `CanvasPage` e `ResearchSurveyPage`, relatorio agregado em `AccountPage`, documento `docs/product-metrics-events.md` e testes unitarios.
  - Criterio de pronto: relatorio minimo de uso disponivel para iteracao.

### P2 - Evolucao estrutural (robustez e escala)

- [x] P2.1 Code splitting por rotas
  - Escopo: lazy loading de paginas e chunks menores.
  - Evidencias: `App.tsx` migrado para `React.lazy + Suspense` em todas as rotas principais; build passou a gerar chunks por rota (ex.: `DashboardPage`, `CanvasPage`, `ResearchSurveyPage`), com reducao do chunk principal (de ~698 kB para ~397 kB no build local).
  - Criterio de pronto: warning de chunk grande reduzido/mitigado.

- [x] P2.2 Expansao de testes E2E
  - Escopo: cobrir onboarding, TCLE/survey completo, persistencia remota e exportacao.
  - Evidencias: `apps/web/e2e/canvas-flow.spec.ts` expandido para 9 cenarios (onboarding guiado, avaliacao e resultados, persistencia apos reload, exportacao PNG/PDF, acessibilidade de foco no modal, survey com TCLE e envio, navegacao por etapas, modo avancado e cenario remoto opcional autenticado com Supabase via variaveis de ambiente); `playwright.config.ts` ajustado para permitir ativacao remota sem quebrar execucao local/CI.
  - Criterio de pronto: fluxos criticos protegidos contra regressao.

- [x] P2.3 Pacote de evidencias para dissertacao
  - Escopo: consolidar metricas, versoes do instrumento e trilha de decisao.
  - Evidencias: `docs/dissertation-evidence-package.md` com versoes congeladas do instrumento (survey/TCLE + fingerprint), consolidacao de metricas (produto + pesquisa), SQL base de extracao e trilha ADR para banca.
  - Criterio de pronto: material pronto para banca com rastreabilidade tecnica.

## 5. Critério de Pronto por Item

1. Escopo implementado conforme PRD/workflow.
2. Validacao automatica executada (`pnpm check`).
3. Validacao manual do fluxo impactado.
4. Documentacao atualizada (quando aplicavel).
5. Riscos/pendencias registrados.

## 6. Cadencia Sugerida de Live Code

- Bloco semanal: 1 item P0 ou 1-2 itens P1 pequenos.
- Encerramento da sessao:
  - atualizar status deste checklist.
  - registrar decisoes no `docs/technical-context.md`.
  - confirmar proximo item com criterio de pronto.

## 7. Dependencias e Riscos

- Dependencia de configuracao Supabase para cenarios remotos.
- Risco de crescimento de escopo em survey e onboarding.
- Risco de regressao UX em mobile se mudancas nao forem incrementalmente validadas.
