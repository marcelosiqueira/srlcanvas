# Technical Context - SRL Canvas

Ultima atualizacao: 2026-02-15

## 1. Objetivo do Documento

Concentrar contexto tecnico do projeto para reduzir perda de escopo durante live code,
facilitando continuidade entre sessoes e justificativa tecnica para avaliacao academica.

## 2. Arquitetura Atual

- Monorepo: pnpm workspaces.
- Frontend: `apps/web` (React + Vite + TypeScript + Tailwind + Zustand).
- Backend: `apps/api` (Fastify + TypeScript, endpoint base de health).
- Persistencia:
  - Local: `localStorage` (escopo `guest` e por `user_id`).
  - Remota: Supabase (auth + tabelas de canvases/survey/consent).

## 3. Mapa Funcional

- Avaliacao SRL Canvas:
  - `apps/web/src/pages/CanvasPage.tsx`
  - `apps/web/src/components/BlockEditModal.tsx`
  - `apps/web/src/components/ResultsModal.tsx`
- Dashboard e acesso:
  - `apps/web/src/pages/DashboardPage.tsx`
  - `apps/web/src/pages/LandingPage.tsx`
- Pesquisa academica:
  - `apps/web/src/pages/ResearchConsentPage.tsx`
  - `apps/web/src/pages/ResearchSurveyPage.tsx`
- Estado e persistencia local:
  - `apps/web/src/store/useCanvasStore.ts`
  - `apps/web/src/services/canvasSessionManager.ts`

## 4. Regras de Dominio Criticas

- Score total: soma das 12 notas (max 108).
- Media: total / 12.
- Desvio-padrao: populacional.
- CV: desvio / media; se media = 0, CV = 0.
- Scorecard: `total * (1 - cv)`.
- Regra metodologica: nota > 3 deve ter evidencia minima.

## 5. Estado de Qualidade

- Comandos oficiais:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`
  - `pnpm test:e2e`
- Pipeline CI:
  - `.github/workflows/ci.yml`
  - Jobs: `quality` -> `e2e`

## 6. Lacunas Tecnicas Prioritarias

1. P2.3 concluido com pacote metodologico versionado em `docs/dissertation-evidence-package.md`.
2. Cobertura remota autenticada em E2E depende de credenciais Supabase de teste.
3. Monitorar crescimento dos chunks por rota apos novas features.
4. Formalizar rotina periodica de extracao pseudonimizada para analise da dissertacao.

## 7. Decisoes Tecnicas (ADR leve)

### ADR-001 - Isolamento de dados por escopo local

- Status: aprovado.
- Decisao: usar chave de armazenamento por escopo (`guest` e `user_id`).
- Motivo: evitar vazamento de rascunho entre contas no mesmo navegador.

### ADR-002 - Fallback local para pesquisa academica

- Status: aprovado.
- Decisao: permitir envio em modo local quando Supabase indisponivel.
- Motivo: nao bloquear coleta em ambiente de demonstracao/avaliacao.

### ADR-003 - Scorecard baseado em CV

- Status: aprovado.
- Decisao: manter formula `total * (1 - cv)` como regra central.
- Motivo: penalizar desequilibrio entre blocos mantendo comparabilidade.

### ADR-004 - Onboarding guiado orientado por progresso

- Status: aprovado.
- Decisao: introduzir guia de primeira avaliacao em 3 passos (metadados -> bloco 1 -> resultados),
  com conclusao persistida por escopo de usuario.
- Motivo: reduzir friccao inicial para iniciantes sem impactar o fluxo de usuarios experientes.

### ADR-005 - Padrao unico de acessibilidade para dialogos

- Status: aprovado.
- Decisao: aplicar hook compartilhado de dialogo com focus trap, foco inicial e retorno de foco ao
  elemento gatilho ao fechar modal.
- Motivo: garantir navegacao por teclado consistente entre os modais principais.

### ADR-006 - Padrao de metadados com data canonica

- Status: aprovado.
- Decisao: adotar formato `yyyy-mm-dd` para data de avaliacao no armazenamento e validar metadados
  obrigatorios (`startup`, `avaliador`, `data`) nas telas de criacao/edicao.
- Motivo: eliminar ambiguidade de data e melhorar consistencia dos registros.

### ADR-007 - Survey academica com navegacao por etapas

- Status: aprovado.
- Decisao: dividir o questionario em 7 etapas navegaveis com barra de progresso e validar campos por etapa;
  persistir no rascunho tambem a etapa atual para continuidade.
- Motivo: reduzir sobrecarga cognitiva em formularios longos e diminuir abandono no meio do questionario.

### ADR-008 - Governanca do instrumento etico da survey

- Status: aprovado.
- Decisao: controlar disponibilidade da survey por variavel (`VITE_RESEARCH_SURVEY_ENABLED`) e registrar
  versao ativa por configuracao (`VITE_RESEARCH_SURVEY_ACTIVE_VERSION`), alem de validar fingerprint
  do instrumento em teste automatizado para detectar alteracoes nas perguntas.
- Motivo: garantir aderencia ao questionario aprovado no comite de etica e manter flexibilidade de
  ativacao/desativacao sem alterar o conteudo em producao.

### ADR-009 - Modo avancado opcional para avaliacao recorrente

- Status: aprovado.
- Decisao: introduzir `Modo avancado` no canvas com filtros de revisao (`todos`, `pendentes`, `pontuados`),
  acoes rapidas de score (`-1/+1`), navegacao para proximo pendente e atalhos de teclado no canvas/modal.
- Motivo: reduzir cliques e tempo medio de aplicacao para usuarios experientes sem alterar o fluxo padrao
  de iniciantes.

### ADR-010 - Sincronizacao remota sem etapa manual na dashboard

- Status: aprovado.
- Decisao: remover listagem manual de `Sync de Banco` com acao `Continuar` na dashboard e manter
  sincronizacao remota automatica durante a edicao do canvas para usuarios autenticados.
- Motivo: reduzir ambiguidade de uso e reforcar que salvamento remoto ocorre em background.

### ADR-011 - Comparativo temporal direto na dashboard

- Status: aprovado.
- Decisao: adicionar secao `Historico e Comparativo Temporal` na dashboard para usuarios autenticados,
  com lista de avaliacoes remotas, comparacao da avaliacao mais recente contra uma avaliacao anterior
  selecionada (delta de total, scorecard, CV e blocos preenchidos) e acao `Ver Resultados` por item.
- Motivo: permitir leitura de evolucao entre aplicacoes sem exigir exportacao externa ou navegacao
  adicional, atendendo usuarios experientes e rastreabilidade academica.

### ADR-012 - Instrumentacao local de metricas sem dados sensiveis

- Status: aprovado.
- Decisao: adicionar servico de instrumentacao local (`productMetrics`) com eventos de inicio,
  conclusao e abandono por etapa para os fluxos de canvas e survey, sem capturar PII ou texto livre;
  disponibilizar relatorio agregado em `Minha Conta`.
- Motivo: habilitar iteracao orientada por dados de uso reais, preservando privacidade e aderencia
  ao contexto academico/LGPD.

### ADR-013 - Code splitting por rotas no frontend web

- Status: aprovado.
- Decisao: migrar carregamento das paginas do `App.tsx` para `React.lazy + Suspense`, mantendo
  guardas de autenticacao e fallback unico de carregamento.
- Motivo: reduzir bundle inicial e distribuir custo de carregamento por rota, mitigando warning
  de chunk grande no build e melhorando tempo de primeira renderizacao.

### ADR-014 - Cobertura E2E de fluxos criticos com cenario remoto opcional

- Status: aprovado.
- Decisao: ampliar `canvas-flow.spec.ts` para cobrir onboarding, envio da survey com TCLE, exportacao,
  persistencia apos reload e atalhos/modais; manter teste de persistencia remota autenticada como
  cenario opcional condicionado a variaveis de ambiente de Supabase/conta de teste.
- Motivo: aumentar protecao contra regressao em CI/local sem tornar o pipeline dependente de credenciais
  externas em todos os ambientes.

### ADR-015 - Pacote metodologico versionado para banca

- Status: aprovado.
- Decisao: consolidar em documento unico (`docs/dissertation-evidence-package.md`) as evidencias de
  metricas, versoes do instrumento etico (survey/TCLE/fingerprint), SQL base de extracao e trilha de
  decisao por ADR.
- Motivo: garantir rastreabilidade ponta a ponta entre implementacao tecnica e material de avaliacao
  academica da dissertacao.

## 8. Rastreabilidade de Escopo

Para cada melhoria implementada, registrar:

1. ID do item no checklist (`docs/implementation-checklist.md`).
2. Arquivos alterados.
3. Validacao executada.
4. Risco residual.
5. Impacto esperado em metrica de sucesso.

## 9. Protocolo de Sessao de Live Code

1. Selecionar item (P0/P1/P2).
2. Confirmar escopo e criterio de pronto.
3. Implementar incremento minimo.
4. Executar validacao tecnica.
5. Atualizar docs (`checklist` + este arquivo se houve decisao).
6. Registrar proximo passo.
