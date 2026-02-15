# Pacote de Evidencias Metodologicas - Dissertacao SRL Canvas

Ultima atualizacao: 2026-02-15

## 1. Objetivo

Consolidar, em um unico artefato versionado, as evidencias tecnicas e metodologicas usadas na dissertacao:

1. metricas de uso e de pesquisa;
2. versoes do instrumento aprovado no comite de etica;
3. trilha de decisoes tecnicas (ADR) com rastreabilidade de implementacao.

## 2. Fontes Oficiais de Evidencia

- Escopo e regras de negocio: `docs/PRD.md`
- Fluxos e operacao: `docs/workflows.md`
- Backlog executado e criterios de pronto: `docs/implementation-checklist.md`
- Decisoes tecnicas (ADR): `docs/technical-context.md`
- Dicionario de eventos de metricas: `docs/product-metrics-events.md`
- Consentimento e privacidade: `docs/TCLE.md`, `docs/LGPD.md`

## 3. Versoes Congeladas do Instrumento Etico

### 3.1 Versao do questionario e TCLE

- Survey (instrumento aprovado): `questionario_quantitativo_srl_canvas_revisado_2025-11-28`
  - fonte: `apps/web/src/data/researchSurvey.ts`
- TCLE: `tcle_v1_2025-11-28`
  - fonte: `apps/web/src/data/researchConsent.ts`

### 3.2 Governanca por configuracao

- `VITE_RESEARCH_SURVEY_ENABLED`: liga/desliga o fluxo academico sem alterar perguntas.
- `VITE_RESEARCH_SURVEY_ACTIVE_VERSION`: registra versao ativa no payload enviado.
- fonte: `apps/web/src/config/researchSurveyConfig.ts`, `apps/web/.env.example`

### 3.3 Integridade do instrumento (fingerprint)

- Fingerprint esperado do instrumento aprovado:
  - `ethics-questionario_quantitativo_srl_canvas_revisado_2025-11-28:0caed5bb`
- Geracao: `buildResearchSurveyEthicsFingerprint`
  - fonte: `apps/web/src/utils/researchInstrumentFingerprint.ts`
- Guarda automatizada (regressao): teste snapshot
  - fonte: `apps/web/src/utils/researchInstrumentFingerprint.test.ts`

## 4. Consolidacao de Metricas

### 4.1 Metricas operacionais de produto (sem PII)

- Origem: eventos locais em `localStorage` (`srl-product-metrics-v1`).
- Fonte tecnica: `apps/web/src/services/productMetrics.ts`
- Relatorio agregado em UI: `apps/web/src/pages/AccountPage.tsx`
- Eventos cobertos:
  - `canvas_started`, `canvas_completed`, `canvas_abandoned`
  - `survey_started`, `survey_step_viewed`, `survey_completed`, `survey_step_abandoned`

### 4.2 Metricas do estudo (dataset da pesquisa)

- Tabelas:
  - `public.research_consents`
  - `public.research_survey_responses`
- Fonte tecnica: `infra/supabase/migrations/0001_init.sql`
- Campos-chave para analise:
  - `consent_version`, `survey_version`
  - `is_eligible`
  - `sus_answers`, `adoption_feedback`, `metadata`

### 4.3 Mapeamento de metricas da dissertacao

1. Taxa de conclusao da survey apos TCLE:
   - `(usuarios com submit em research_survey_responses) / (usuarios com consentimento ativo)`
2. Taxa de abandono por etapa da survey:
   - distribuicao de `survey_step_abandoned.stepKey` (metricas operacionais locais)
3. Tempo de preenchimento da survey:
   - `metadata.completion_seconds` / `metadata.completion_minutes`
4. NPS do SRL Canvas:
   - `adoption_feedback.nps_score`
5. SUS:
   - respostas em `sus_answers` (pontuacao agregada calculada na analise estatistica)

## 5. SQL Base para Extracao Reprodutivel

### 5.1 Conversao TCLE -> submit da survey

```sql
with consented as (
  select distinct user_id
  from public.research_consents
  where accepted = true
    and revoked_at is null
),
submitted as (
  select distinct user_id
  from public.research_survey_responses
)
select
  (select count(*) from consented) as users_consented,
  (select count(*) from submitted) as users_submitted,
  round(
    100.0 * (select count(*) from submitted)
    / nullif((select count(*) from consented), 0),
    2
  ) as conversion_percent;
```

### 5.2 Distribuicao de NPS

```sql
select
  (adoption_feedback ->> 'nps_score')::int as nps_score,
  count(*) as responses
from public.research_survey_responses
where adoption_feedback ? 'nps_score'
  and (adoption_feedback ->> 'nps_score') ~ '^[0-9]+$'
group by 1
order by 1;
```

### 5.3 Tempo de conclusao da survey

```sql
select
  percentile_cont(0.5) within group (
    order by (metadata ->> 'completion_seconds')::numeric
  ) as median_completion_seconds,
  avg((metadata ->> 'completion_seconds')::numeric) as avg_completion_seconds
from public.research_survey_responses
where metadata ? 'completion_seconds'
  and (metadata ->> 'completion_seconds') ~ '^[0-9]+$';
```

## 6. Trilha de Decisao (ADR) para Banca

Resumo das decisoes que sustentam validade metodologica e operacional:

1. ADR-008: governanca do instrumento etico (versao ativa e fingerprint).
2. ADR-010: sincronizacao remota automatica (sem passo manual na dashboard).
3. ADR-012: metricas de produto sem dados sensiveis.
4. ADR-014: cobertura E2E de fluxos criticos com cenario remoto opcional.
5. ADR-015: consolidacao do pacote de evidencias metodologicas (este documento).

Fonte completa: `docs/technical-context.md`.

## 7. Matriz de Rastreabilidade (Checklist -> Evidencia)

1. P1.1 Survey em etapas:
   - codigo: `apps/web/src/pages/ResearchSurveyPage.tsx`
   - evidencia: governanca por versao + teste de fingerprint
2. P1.4 Metricas:
   - codigo: `apps/web/src/services/productMetrics.ts`
   - evidencia: dicionario de eventos e relatorio agregado
3. P2.2 E2E:
   - codigo: `apps/web/e2e/canvas-flow.spec.ts`
   - evidencia: cenarios criticos (onboarding, survey, exportacao, persistencia)
4. P2.3 Pacote metodologico:
   - evidencia principal: `docs/dissertation-evidence-package.md`

## 8. Procedimento Operacional para Fechamento de Coleta

1. Confirmar versoes:
   - `RESEARCH_SURVEY_VERSION`, `RESEARCH_TCLE_VERSION`, fingerprint.
2. Executar qualidade tecnica:
   - `pnpm check`
3. Extrair agregados do Supabase com SQL da Secao 5.
4. Exportar resultados em formato pseudonimizado para analise estatistica.
5. Registrar snapshot da analise (data, commit e consultas usadas) em apendice da dissertacao.
