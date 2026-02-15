# Workflows

## 1. Workflow: Avaliar Canvas (Usuario Final)

1. Preencher `Startup`, `Avaliador`, `Data`.
2. Opcional (modo avancado): ativar `Modo avancado` para usar atalhos e acoes rapidas.
3. Abrir bloco desejado (ou usar `Proximo pendente`).
4. Registrar notas do bloco.
5. Definir nivel 1-9 (com slider, botoes ou teclado `1..9` no modal).
6. Registrar evidencias.
7. Salvar (atalho `Ctrl/Cmd + Enter`) e, no modo avancado, opcionalmente seguir para `Proximo bloco`.
8. Repetir ate os 12 blocos.
9. Abrir `Ver Resultados`.
10. Exportar PNG/PDF (opcional).
11. Quando autenticado com Supabase ativo, sincronizacao remota acontece automaticamente em background.

## 1.1 Workflow: Entrada no App (Publico -> Auth)

1. Acessar `/` (landing page publica).
2. Clicar em `Entrar` ou `Criar conta` quando auth estiver habilitado.
3. Concluir autenticacao.
4. Seguir para `/dashboard` e iniciar fluxo de avaliacao.

## 1.2 Workflow: Pesquisa Academica (TCLE -> Survey)

1. Acessar `Pesquisa Academica` pela tela atual.
2. Ler TCLE em `/survey/consent`.
3. Registrar aceite do TCLE.
4. Preencher questionario em `/survey` por etapas:
   - Etapa 1: triagem.
   - Etapa 2: perfil.
   - Etapas 3-5: dimensoes SRL (blocos 1-4, 5-8 e 9-12).
   - Etapa 6: escala 1-9 + SUS.
   - Etapa 7: adocao e follow-up.
5. Avancar/voltar entre etapas com indicador de progresso.
6. Salvar rascunho automaticamente (incluindo etapa atual).
7. Enviar resposta e receber protocolo.
8. Opcional: revogar consentimento.
9. Se `VITE_RESEARCH_SURVEY_ENABLED=false`, ocultar CTAs e redirecionar tentativas de acesso para o fluxo principal do app.

## 1.3 Workflow: Historico e Comparativo Temporal

1. Acessar `Dashboard`.
2. Confirmar usuario autenticado com Supabase ativo.
3. Visualizar secao `Historico e Comparativo Temporal`.
4. Revisar avaliacao mais recente (total, scorecard, CV, blocos preenchidos).
5. Selecionar avaliacao anterior no campo `Comparar com`.
6. Analisar deltas de evolucao (Total, Scorecard, CV, Blocos preenchidos).
7. Opcional: abrir `Ver Resultados` de qualquer item do historico para detalhamento.

## 1.4 Workflow: Medicao de Produto (P1.4)

1. Usuario inicia fluxo no `CanvasPage` ou na `ResearchSurveyPage`.
2. Sistema registra evento de inicio de sessao.
3. Sistema registra eventos de progresso por etapa (survey) e conclusao.
4. Se houver saida sem envio final na survey, sistema registra abandono da etapa atual.
5. Abrir `Minha Conta` para consultar relatorio agregado local (inicio, conclusao, abandono e taxa).
6. Usar relatorio para iterar UX e reduzir abandono, sem coletar dados sensiveis.

## 2. Workflow: Live Code de Melhorias (Time)

1. Selecionar item do checklist oficial (`docs/implementation-checklist.md`).
2. Confirmar escopo e criterio de pronto do item.
3. Atualizar `PRD.md` se houver alteracao de requisito/regra.
4. Implementar menor incremento funcional possivel.
5. Validar com `pnpm check`.
6. Validar fluxo manual afetado (mobile + desktop).
7. Registrar resultado no checklist e nos docs tecnicos.

## 3. Workflow: Mudanca de Produto (Documentacao + Codigo)

1. Atualizar `PRD.md` com requisito/ajuste.
2. Atualizar `workflows.md` se fluxo mudou.
3. Atualizar `technical-context.md` se arquitetura/decisao mudou.
4. Implementar codigo em menor incremento possivel.
5. Rodar `pnpm check`.
6. Atualizar status no `implementation-checklist.md`.

## 4. Workflow: Correcao de Formula de Score

1. Confirmar regra no `PRD.md`.
2. Alterar `apps/web/src/utils/score.ts`.
3. Verificar consumo em `apps/web/src/App.tsx` e `apps/web/src/components/ResultsModal.tsx`.
4. Validar com cenarios de teste rapido (notas baixas, mistas, altas).
5. Rodar `pnpm check`.

## 5. Workflow: Evolucao de UX (Modais e Jornadas)

1. Definir problema de UX e criterio de sucesso.
2. Ajustar componente alvo (`BlockEditModal`, `ResultsModal` ou paginas de entrada).
3. Testar mobile e desktop.
4. Confirmar acessibilidade minima (Escape, foco, labels).
5. Rodar `pnpm check`.

## 6. Regras Condicionais

- Se mudar modelo de dados persistido:
  - criar estrategia de migracao no store.
  - validar compatibilidade de estado antigo.
  - validar isolamento por conta autenticada no mesmo navegador.
- Se mudar bloco/niveis SRL:
  - atualizar `apps/web/src/data/srlBlocks.ts`.
  - validar impacto no radar e score.
- Se adicionar nova tela:
  - registrar fluxo correspondente neste arquivo.
- Se alterar roteamento publico/auth:
  - validar redirecionamentos de `/`, `/auth/*` e fallback `*`.
  - manter carregamento lazy das paginas no `App.tsx` para preservar code splitting por rota.
- Se alterar coleta de dados de pesquisa:
  - revisar conformidade com `docs/LGPD.md` e `docs/TCLE.md`.
  - manter versao ativa do instrumento alinhada ao parecer do comite de etica.

## 7. Workflow: Qualidade e CI

1. Rodar `pnpm lint`.
2. Rodar `pnpm test`.
3. Rodar `pnpm build`.
4. Em mudancas de fluxo critico, rodar `pnpm test:e2e`.
   - para cenario remoto autenticado no E2E, configurar `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `E2E_REMOTE_EMAIL` e `E2E_REMOTE_PASSWORD`.
   - sem estas variaveis, o teste remoto fica `skip` e a suite local permanece estavel.
5. Garantir pipeline de CI (`.github/workflows/ci.yml`) verde.

## 8. Workflow: Fechamento de Sprint de Live Code

1. Consolidar itens concluidos e itens pendentes do checklist.
2. Registrar riscos e decisoes tecnicas tomadas.
3. Atualizar metricas e evidencias para avaliacao academica.
4. Definir proximo lote incremental (maximo 3 itens principais).

## 9. Workflow: Pacote de Evidencias da Dissertacao (P2.3)

1. Confirmar versoes congeladas do instrumento (`RESEARCH_SURVEY_VERSION`, `RESEARCH_TCLE_VERSION`).
2. Confirmar integridade do instrumento via fingerprint (`researchInstrumentFingerprint`).
3. Consolidar metricas de produto (local, sem PII) e metricas da pesquisa (Supabase).
4. Atualizar `docs/dissertation-evidence-package.md` com consultas SQL, trilha ADR e matriz de rastreabilidade.
5. Atualizar `docs/implementation-checklist.md` e `docs/technical-context.md` com o estado corrente.
