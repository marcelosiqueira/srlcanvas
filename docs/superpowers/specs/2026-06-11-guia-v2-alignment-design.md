# Spec: Alinhamento da aplicação ao Guia SRL Canvas v2

**Data:** 2026-06-11
**Fonte:** `/Users/marcelosiqueira/Downloads/guia-srl-canvas.md` (Guia Oficial de Aplicação e Diagnóstico do SRL Canvas, versão nova)
**Escopo aprovado:** alinhamento completo ao guia novo + as 4 novidades (Velocidade de Maturidade, Protocolo de Interdependência, Força de Evidências, Padrões de Leitura do Radar).

## Contexto

O guia novo reorganiza o canvas em matriz 3×4 com numeração P1–P12 (leitura por linha) e transforma o bloco "Product-Led Growth (PLG)" no bloco "Adoção e Crescimento" (PLG passa a ser uma "lente" aplicável a startups SaaS/digitais). Os textos dos níveis 1–9 dos demais 11 blocos já estão alinhados no código atual.

**Decisão de arquitetura (aprovada): número de exibição derivado, ids internos estáveis.**
O `id` de cada bloco permanece imutável por ser a chave de armazenamento (localStorage v1/v2, jsonb `canvases.blocks` no Supabase, histórico usado na pesquisa de mestrado). Um novo campo `number` carrega a numeração do guia novo e é usado exclusivamente para exibição e ordenação. Nenhuma migração de dados é necessária; canvases existentes preservam seu significado.

### Mapeamento id (armazenamento) → number (guia novo)

| id  | Bloco                         | number novo |
| --- | ----------------------------- | ----------- |
| 1   | Problema / Oportunidade       | 1           |
| 2   | Proposta de Valor             | 2           |
| 3   | Produto / Tecnologia          | 3           |
| 4   | Clientes / Tração             | 4           |
| 7   | Equipe                        | 5           |
| 8   | Operações / Execução          | 6           |
| 5   | Adoção e Crescimento (ex-PLG) | 7           |
| 9   | Marketing / Canais            | 8           |
| 6   | Modelo de Negócio             | 9           |
| 10  | Sustentação Financeira        | 10          |
| 11  | Estratégia / Visão            | 11          |
| 12  | Governança e Compliance       | 12          |

## 1. Dados dos blocos

**`apps/web/src/types.ts`**

- `CanvasBlockDefinition` ganha `number: number` (exibição) e `note?: string` (nota metodológica do bloco; usada pelo bloco Adoção e Crescimento para a observação sobre PLG).
- Comentário no campo `id` documentando: "chave estável de armazenamento; nunca renumerar".

**`apps/web/src/data/srlBlocks.ts`**

- `SRL_BLOCKS` reordenado pela nova leitura 3×4 (ordem da tabela acima); cada bloco recebe `number`.
- Bloco id 5 reescrito conforme seção 6.8 do guia:
  - `key`: `adocao-crescimento` (key não é persistida no estado do canvas; única outra ocorrência é no questionário de pesquisa — ver seção 5).
  - `name`: "Adoção e Crescimento"; `shortLabel`: "Adoção"; ícone Material `cached` (equivalente ao 🔄 do guia).
  - `objective`: "Avaliar a capacidade da solução gerar adoção, retenção, recomendação, expansão ou crescimento replicável."
  - `note`: "Em startups SaaS ou digitais, este bloco pode ser analisado pela ótica de Product-Led Growth. Em outros modelos, deve ser interpretado como capacidade de adoção, ativação, recorrência, recomendação, expansão ou replicabilidade da solução."
  - `questions`: "A solução possui mecanismos claros de adoção, retenção ou recomendação?" / "O processo de entrada, ativação ou uso inicial é simples, eficiente e replicável?"
  - `levels` (descrição | evidência): 1 "Crescimento dependente de esforço manual." | "N/A"; 2 "Ideias iniciais de adoção ou crescimento." | "Brainstorming."; 3 "Primeiros testes de adoção ou indicação." | "Testes piloto"; 4 "Processo de ativação estruturado." | "Jornada do usuário/cliente"; 5 "Mecanismos de recorrência ou recomendação implementados." | "Taxa de recorrência"; 6 "Adoção ou retenção inicial validada." | "Taxa de ativação ou retenção"; 7 "Ciclo de feedback e melhoria em uso." | "NPS ou CSAT"; 8 "Crescimento orgânico ou expansão relevante." | "% clientes por indicação"; 9 "Crescimento replicável e otimizado." | "Playbook de crescimento".
  - `exampleTips`: estruturar jornada inicial de adoção; facilitar ativação e uso recorrente; acompanhar métricas de retenção, recomendação e expansão.
  - Resumo interpretativo: BAIXO "Desenhar e testar primeiros mecanismos de adoção ou recomendação."; MÉDIO "Validar ativação, recorrência e retenção inicial."; ALTO "Otimizar crescimento replicável, expansão e adoção contínua.".
- `GROUPS`:
  - `includedBlocks` com a nova numeração: I = "P1. Problema/Oportunidade, P2. Proposta de Valor, P5. Equipe"; II = "P3. Produto/Tecnologia, P4. Clientes/Tração, P7. Adoção e Crescimento, P8. Marketing/Canais"; III = "P6. Operações/Execução, P9. Modelo de Negócio, P10. Sustentação Financeira"; IV = "P11. Estratégia/Visão, P12. Governança e Compliance".
  - `conceptualFocus` atualizado: II = "...focando na entrega de valor, tração, adoção, crescimento e canais de aquisição."; III = "...foca na eficiência operacional, no modelo de receita e na capacidade financeira de manter e acelerar o crescimento."; IV = "Direcionamento e Proteção: garante que o negócio tem uma visão estratégica clara e está legalmente protegido para escalar com segurança.".
- Ajustes textuais menores onde o guia novo diverge: objetivo do bloco Clientes/Tração vira "Medir engajamento real no mercado, com foco em retenção." (remove a referência cruzada à numeração antiga). Demais blocos: conferência item a item contra a seção 6 do guia durante a implementação (textos hoje já conferem).
- Novo export `SRL_BLOCKS_BY_NUMBER` se necessário pela UI (decidir na implementação; `SRL_BLOCKS_BY_ID` permanece).

## 2. UI com a nova numeração

Todos os pontos que exibem `block.id` passam a exibir `block.number`:

- `CanvasPage.tsx`: ordem dos cards (array já reordenado), badge numérico, navegação anterior/próximo segue a ordem do array.
- `BlockEditModal.tsx`: título e navegação.
- `ResultsModal.tsx`: labels do radar (`${block.number}. ${shortLabel}`) e lista do resumo interpretativo (ordem do array).
- `GroupDetailsModal.tsx` e demais exibições de agrupamentos: textos novos via `GROUPS`.
- O `note` do bloco Adoção e Crescimento aparece no `BlockEditModal` (texto auxiliar abaixo do objetivo).

Leitura e gravação de estado continuam por `id` — sem mudança em `useCanvasStore`, `canvasApi`, sanitização ou snapshots.

## 3. Novas features do guia

### 3.1. Velocidade de Maturidade (seção 5.3 do guia)

- `canvasHistory.ts`: `CanvasTemporalComparison` ganha `maturityVelocity: number | null` = `totalDelta ÷ meses` entre os `timelineTimestamp` das duas aplicações (meses = dias ÷ 30,44). Se o intervalo for menor que 1 dia, retorna `null`.
- UI: exibida junto aos deltas existentes da comparação temporal (mesmo local onde `compareCanvasHistoryEntries` é consumido hoje), formatada como "pts/mês", com nota: "Reaplicação recomendada a cada 3–6 meses."

### 3.2. Protocolo de Interdependência (seção 7 do guia)

- Novo util puro `apps/web/src/utils/interdependency.ts`: `detectInterdependencyAlerts(blocks)` recebe o estado dos blocos e retorna alertas. Regra do guia: a nota de um bloco não deve exceder em mais de 2 níveis a média dos blocos pontuados do seu agrupamento + agrupamento Fundação (I). Blocos sem nota são ignorados no cálculo da média; se não houver nenhum bloco de referência pontuado além do próprio, não gera alerta.
- Cada alerta: bloco, nota, média de referência e mensagem orientativa (ex.: "P3. Produto/Tecnologia (nota 7) excede em mais de 2 níveis a média do seu agrupamento e da Fundação (3,5). Revise se a base está suficientemente validada.").
- UI: seção "Protocolo de Interdependência" no `ResultsModal`, exibida apenas quando houver alertas. Consultivo — nunca bloqueia preenchimento ou pontuação.

### 3.3. Força de Evidências (seção 3 do guia)

- Const estática `EVIDENCE_STRENGTH_LEVELS` (em `srlBlocks.ts` ou arquivo de dados próprio): 4 níveis — 1 Fraca (relatos informais...), 2 Média (registros estruturados qualitativos...), 3 Forte (métricas quantitativas...), 4 Muito forte (evidências formais jurídicas/financeiras/contratuais...), com exemplos do guia.
- UI: ajuda expansível (collapsible/details) junto ao campo de evidência no `BlockEditModal` — "Qual a força da sua evidência?".

### 3.4. Padrões de Leitura do Radar (seção 5.1.1 do guia)

- Novo util `detectRadarPatterns(scores)` com os 4 padrões do guia: (a) Buraco na Fundação (P1, P2, P5 muito baixos); (b) Produto e Mercado bons, Sustentabilidade e Escala baixa (P6, P9, P10 baixos); (c) Forte em quase tudo, fraco em Futuro e Governança (P11, P12 baixos); (d) Assimetria extrema entre blocos do mesmo agrupamento.
- Heurística documentada no código: bloco fraco = nota ≤ 3; bloco forte = nota ≥ 6; assimetria extrema = diferença ≥ 4 entre blocos pontuados do mesmo agrupamento. Padrões só são avaliados sobre blocos pontuados.
- UI: no `ResultsModal`, abaixo do radar, lista dos 4 padrões com destaque visual nos que se aplicam ao canvas atual (os demais aparecem como referência educativa).

## 4. Textos institucionais

- `aboutSrlCanvas.ts`: reescrito com os textos da seção 1 do guia novo (1, 1.1, 1.2, 1.3). A "Nota Terminológica" sai (não existe mais no guia). `AboutSrlCanvasModal.tsx` ajustado para os campos novos.
- `guia_srl.txt` (raiz do repo): substituído pelo conteúdo do guia novo (cópia de `guia-srl-canvas.md`, sem as imagens).
- `apps/web/public/downloads/`: verificar se o PDF `guia-aplicacao-srl-canvas.pdf` corresponde à versão nova do guia (commits recentes adicionaram PDFs novos); se não, sinalizar ao usuário para fornecer o PDF atualizado.

## 5. Questionário de pesquisa (`researchSurvey.ts`)

- `SURVEY_DIMENSIONS`: key `plg` **permanece** (chave persistida em `research_survey_responses`; mantém comparabilidade da pesquisa). Label atualizado para "Adoção e Crescimento" e lista reordenada para a ordem nova do guia.
- `RESEARCH_SURVEY_VERSION` recebe bump (ex.: `questionario_quantitativo_srl_canvas_guia_v2_2026-06-11`) para que respostas pré e pós-mudança sejam distinguíveis na análise.

## 6. Itens já conformes (sem mudança)

- Faixas de estágio (12–35 Ideação, 36–59 Validação, 60–83 Tração, 84–101 Escala, 102–108 Maturidade Alta) em `score.ts`.
- Fórmula do Scorecard de Risco `Total × (1 − CV)` e métricas (média, desvio-padrão, CV).
- Regra "nota > 3 exige evidência" no `BlockEditModal`.
- Textos dos níveis 1–9 dos 11 blocos não-PLG (conferência final na implementação).

## 7. Testes e verificação

- Unit (Vitest, padrão existente em `score.test.ts`):
  - Mapeamento id↔number: ids estáveis (id 5 = adocao-crescimento/number 7 etc.), `SRL_BLOCKS` ordenado por `number` 1–12 sem lacunas.
  - `maturityVelocity`: cálculo correto, `null` para intervalo < 1 dia, sinais negativos (regressão de maturidade).
  - `detectInterdependencyAlerts`: caso sem alertas, caso com alerta, blocos sem nota ignorados, canvas vazio.
  - `detectRadarPatterns`: cada um dos 4 padrões + canvas equilibrado sem padrões.
  - `sanitizeBlocks` continua aceitando snapshots v1/v2 existentes (ids antigos preservam significado).
- Utils novos seguem TDD. Ao final: suíte completa + build + verificação visual do canvas (ordem 3×4, numeração, radar).

## 8. Fora de escopo

- Migração de ids no banco ou localStorage (decisão explícita: ids estáveis).
- Ponderação de peso do bloco Governança por estágio (guia menciona como detalhe da dissertação, sem regra operacional definida).
- Questionário Quantitativo e Roteiro de Entrevista como instrumentos completos novos (apenas os ajustes da seção 5).
