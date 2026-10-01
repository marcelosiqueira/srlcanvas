# Technical Context - SRL Canvas

Ultima atualizacao: 2026-06-11

## 1. Objetivo do Documento

Concentrar contexto tecnico do projeto para reduzir perda de escopo durante live code,
facilitando continuidade entre sessoes e justificativa tecnica para avaliacao academica.

## 2. Arquitetura Atual

- Monorepo: pnpm workspaces.
- Frontend: `apps/web` (React + Vite + TypeScript + Tailwind + Zustand).
- Backend: `apps/api` (Fastify + TypeScript + Prisma/MySQL, auth propria com JWT e argon2id).
- Persistencia (dupla):
  - Local: `localStorage` (escopo `guest` e por `user_id`).
  - Remota: API propria sobre MySQL (tabelas `users`, `canvases`, `research_consents`,
    `research_survey_responses`), habilitada via `VITE_API_URL`.
- Autenticacao: JWT emitido pela API (`/auth/register`, `/auth/login`); senha com hash argon2id.
- Setup: `docs/backend-setup.md`.

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

- Regras centralizadas em `apps/web/src/utils/score.ts` (`summarizeAssessment`, `scoresFromBlocks`,
  `radarDisplayPoints`, rotulos de status); telas, comparativos e exportacoes nao recalculam por conta propria.
- Bloco pendente = `score: null`; nunca convertido para 0 ou 1 em calculo ou persistencia.
- Avaliacao incompleta: apenas `Pontos registrados` (soma das notas atribuidas) e `X/12 blocos`.
- Avaliacao completa (12/12): total (max 108), media = total / 12, desvio-padrao populacional,
  CV = desvio / media, scorecard = `total * (1 - cv)` sem piso em zero (valores negativos preservados).
- Radar: pendentes desenhados no nivel 1 somente na camada visual (`radarDisplayPoints`), com marcador
  proprio, legenda, tooltip e lista acessivel exibindo `Pendente`.
- Estagios por cortes 35/59/83/101: suspensos (fundamentacao pendente).
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
2. Cobertura remota autenticada em E2E depende de API configurada (`VITE_API_URL`) e conta de teste (`E2E_REMOTE_EMAIL`/`E2E_REMOTE_PASSWORD`).
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
- Atualizacao (2026-06): Supabase foi substituido pela API propria (Fastify + MySQL/Prisma);
  a decisao permanece valida com a API no papel de backend remoto.

### ADR-003 - Scorecard baseado em CV

- Status: aprovado.
- Decisao: manter formula `total * (1 - cv)` como regra central.
- Motivo: penalizar desequilibrio entre blocos mantendo comparabilidade.
- Atualizacao (2026-09-28): removido o piso `Math.max(0, ...)` para alinhar a implementacao a secao 8.6.2
  da dissertacao; scorecard rotulado como experimental e calculado apenas com 12 blocos respondidos
  (ver ADR-019).

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
  Ajuste de UX (2026-02-15): titulos exibem apenas startup (sem data no titulo), rotulo de
  atualizacao usa formato `(Atualizado ...)`, e o seletor de comparacao oculta entradas equivalentes
  (sem delta relevante) para evitar comparativos zerados por duplicidade.
  Ajuste de UX (2026-02-15): adicionar texto explicativo no proprio bloco para orientar como ler o
  comparativo e interpretar sinais de delta (incluindo leitura do CV).
  Ajuste de UX (2026-03-11): `DashboardPage` passa a ocultar o botao de voltar no `AppHeader`
  (`showBackButton={false}`) para evitar acao sem utilidade imediata apos login.
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
  Ajuste de UX (2026-03-11): exportacao de resultados no `ResultsModal` (PNG/PDF) passa a incluir
  identificacao do projeto no topo do artefato (titulo do canvas, carimbo `(Atualizado ...)` e
  `Estagio`) para facilitar compartilhamento e leitura de contexto fora da plataforma.
  Atualizacao (2026-09-28): `Estagio` removido das telas e exportacoes (ver ADR-019).
- Motivo: aumentar protecao contra regressao em CI/local sem tornar o pipeline dependente de credenciais
  externas em todos os ambientes.
- Atualizacao (2026-06): Supabase substituido pela API propria; o gating do cenario remoto passou a usar
  `VITE_API_URL` + `E2E_REMOTE_EMAIL`/`E2E_REMOTE_PASSWORD`.

### ADR-015 - Pacote metodologico versionado para banca

- Status: aprovado.
- Decisao: consolidar em documento unico (`docs/dissertation-evidence-package.md`) as evidencias de
  metricas, versoes do instrumento etico (survey/TCLE/fingerprint), SQL base de extracao e trilha de
  decisao por ADR.
- Motivo: garantir rastreabilidade ponta a ponta entre implementacao tecnica e material de avaliacao
  academica da dissertacao.

### ADR-016 - Normalizacao de acentuacao na interface PT-BR

- Status: aprovado.
- Decisao: revisar textos visiveis ao usuario (paginas, modais, labels e mensagens) para corrigir
  acentuacao em portugues, mantendo valores tecnicos de dominio (ex.: `nao`, `ideacao`, `validacao`,
  `tracao`) quando usados como chaves/payload.
- Motivo: elevar clareza linguistica e qualidade percebida da plataforma sem quebrar compatibilidade
  de dados e regras existentes.

### ADR-017 - Cadastro com nome obrigatorio

- Status: aprovado.
- Decisao: incluir campo `Nome` obrigatorio na `SignupPage` e enviar o valor no `signUp` para o
  Supabase Auth em `user_metadata` (`name`).
- Motivo: melhorar identificacao basica da conta e preparar exibicoes futuras sem depender apenas do
  e-mail do usuario.
- Atualizacao (2026-06): substituido pela API propria; o nome agora e coluna `name` da tabela `users`
  (`POST /auth/register`).

### ADR-018 - Edicao de nome em Minha Conta

- Status: aprovado.
- Decisao: adicionar secao `Perfil` em `AccountPage` com campo editavel `Nome`, carregando o valor
  atual pelo metadata do Auth; ao salvar, sincronizar apenas metadata (`name`) do usuario autenticado.
- Motivo: permitir manutencao de identificacao da conta apos cadastro, mantendo consistencia entre
  perfil exibido no app e dados de autenticacao.

### ADR-019 - Avaliacoes parciais sem confundir ausencia de resposta com baixa maturidade

- Status: aprovado.
- Decisao: blocos nao respondidos permanecem `null` e sao exibidos como `Pendente`. Enquanto houver
  pendencias, canvas, dashboard, resultados, comparativos e exportacoes mostram
  `Avaliacao incompleta — X/12 blocos` e `Pontos registrados`, sem total /108, percentual, estagio ou
  scorecard. Com 12/12, exibem total e scorecard experimental (formula da secao 8.6.2, negativos
  preservados e explicados). Comparativos so calculam deltas de total/CV/scorecard/velocidade entre
  avaliacoes completas. Classificacao por cortes 35/59/83/101 suspensa. Modal de bloco passa a editar
  um rascunho, persistido apenas em `Salvar`.
- Motivo: antes, blocos vazios entravam como 0 no total, media e CV, e um canvas vazio era classificado
  como `Ideacao`; selecionar um nivel salvava a nota mesmo quando o usuario cancelava o modal.
- Compatibilidade: nenhuma migracao de dados; notas e evidencias armazenadas sao lidas como estao.
  `ScoreMetrics.completion` e `CanvasTemporalComparison.completionDelta` foram removidos (nao eram
  exibidos).

### ADR-020 - Auto-save remoto global e sem descarte de alteracoes pendentes

- Status: aprovado.
- Decisao: `useRemoteCanvasSync` passa a ser montado uma unica vez no `App`
  (`components/RemoteCanvasSync.tsx`), e nao mais dentro de `CanvasPage`. A gravacao continua com
  debounce de 800 ms e so atualiza registros existentes, mas a alteracao pendente e enviada
  imediatamente ao trocar de canvas/usuario (no id anterior), ao desmontar e em
  `pagehide`/`visibilitychange=hidden` (com `fetch` `keepalive`).
- Motivo: o hook vivia apenas na tela do Canvas e o cleanup cancelava o timer; ao salvar o ultimo
  bloco e ir para Resultados em menos de 800 ms, ou ao editar notas pela tela de Resultados, a
  alteracao nao chegava ao servidor, deixando historico, comparativo e `Editar` desatualizados.
- Validacao: testes unitarios do hook e de `RemoteCanvasSync`; E2E remoto passa a criar o canvas pelo
  `Novo SRL Canvas`, sair logo apos salvar, editar em Resultados e conferir o historico vindo do
  servidor (antes o cenario validava apenas o reload local).

### ADR-021 - Textos dos blocos alinhados ao modelo manual v1.1

- Status: aprovado.
- Decisao: perguntas-chave e descricoes dos 9 niveis de cada bloco em `apps/web/src/data/srlBlocks.ts`
  passam a ser identicas ao modelo manual (`public/downloads/srl-canvas-modelo-manual.pdf`,
  versao 1.1, outubro de 2026). O teste `srlBlocks.modelo.test.ts` guarda o texto oficial e falha em
  qualquer divergencia.
- Motivo: o PDF foi revisado (ex.: P6 e P9 com nova pergunta, P1 nivel 4 "entrevistas registradas",
  P12 nivel 7 sem "stock option") e a plataforma ainda exibia o texto anterior.
- Compatibilidade: notas armazenadas guardam apenas o numero do nivel; nenhuma migracao necessaria.
  `evidence`, `exampleTips` e resumos interpretativos nao constam do PDF e nao foram alterados.

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
