# Alinhamento ao Guia SRL Canvas v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alinhar a aplicação web ao Guia SRL Canvas v2 — nova numeração P1–P12 (3×4), bloco "Adoção e Crescimento" no lugar do PLG, e 4 features novas (Velocidade de Maturidade, Protocolo de Interdependência, Força de Evidências, Padrões de Leitura do Radar) — sem migrar dados persistidos.

**Architecture:** Ids dos blocos permanecem imutáveis (chave de armazenamento em localStorage/Supabase); novo campo `number` carrega a numeração de exibição do guia. Conteúdo dos blocos vive em `apps/web/src/data/srlBlocks.ts`; novas regras de análise viram utils puros testados (`interdependency.ts`, `radarPatterns.ts`, extensão de `canvasHistory.ts`); UI consome via `ResultsModal`, `BlockEditModal` e `DashboardPage`.

**Tech Stack:** React 18 + TypeScript + Vite, Zustand, Chart.js, Vitest. Monorepo pnpm; app web em `apps/web` (package `@srl/web`).

**Spec:** `docs/superpowers/specs/2026-06-11-guia-v2-alignment-design.md`

**Comandos (sempre a partir de `/Users/marcelosiqueira/Projetos/SRL-Canvas/app`):**

- Testes: `pnpm --filter @srl/web test`
- Teste único: `pnpm --filter @srl/web exec vitest run src/utils/score.test.ts`
- Check completo: `pnpm --filter @srl/web run check` (lint + test + build)

### Mapeamento id (armazenamento, NUNCA muda) → number (exibição, guia v2)

| id  | key                         | Bloco                   | number |
| --- | --------------------------- | ----------------------- | ------ |
| 1   | problema                    | Problema / Oportunidade | 1      |
| 2   | proposta-de-valor           | Proposta de Valor       | 2      |
| 3   | produto-tecnologia          | Produto / Tecnologia    | 3      |
| 4   | clientes-tracao             | Clientes / Tração       | 4      |
| 7   | equipe                      | Equipe                  | 5      |
| 8   | operacoes                   | Operações / Execução    | 6      |
| 5   | adocao-crescimento (ex-plg) | Adoção e Crescimento    | 7      |
| 9   | marketing-canais            | Marketing / Canais      | 8      |
| 6   | modelo-de-negocio           | Modelo de Negócio       | 9      |
| 10  | sustentacao-financeira      | Sustentação Financeira  | 10     |
| 11  | estrategia-visao            | Estratégia / Visão      | 11     |
| 12  | governanca-compliance       | Governança e Compliance | 12     |

---

### Task 1: Tipos + dados dos blocos (numeração v2 e bloco Adoção e Crescimento)

**Files:**

- Modify: `apps/web/src/types.ts:23-36`
- Modify: `apps/web/src/data/srlBlocks.ts`
- Test: `apps/web/src/data/srlBlocks.test.ts` (novo)

- [ ] **Step 1: Escrever o teste que falha**

Criar `apps/web/src/data/srlBlocks.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { SRL_BLOCKS, SRL_BLOCKS_BY_ID } from "./srlBlocks";

describe("SRL_BLOCKS (guia v2)", () => {
  it("mantém os ids de armazenamento estáveis por key", () => {
    const idByKey = Object.fromEntries(SRL_BLOCKS.map((block) => [block.key, block.id]));
    expect(idByKey).toEqual({
      problema: 1,
      "proposta-de-valor": 2,
      "produto-tecnologia": 3,
      "clientes-tracao": 4,
      "adocao-crescimento": 5,
      "modelo-de-negocio": 6,
      equipe: 7,
      operacoes: 8,
      "marketing-canais": 9,
      "sustentacao-financeira": 10,
      "estrategia-visao": 11,
      "governanca-compliance": 12
    });
  });

  it("ordena o array pela numeração P1-P12 do guia (matriz 3x4)", () => {
    expect(SRL_BLOCKS.map((block) => block.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
    ]);
    expect(SRL_BLOCKS.map((block) => block.id)).toEqual([1, 2, 3, 4, 7, 8, 5, 9, 6, 10, 11, 12]);
  });

  it("define o bloco Adoção e Crescimento conforme a seção 6.8 do guia", () => {
    const block = SRL_BLOCKS_BY_ID[5];
    expect(block.name).toBe("Adoção e Crescimento");
    expect(block.number).toBe(7);
    expect(block.group).toBe("produtoMercado");
    expect(block.note).toContain("Product-Led Growth");
    expect(block.levels).toHaveLength(9);
    expect(block.levels[0].description).toBe("Crescimento dependente de esforço manual.");
    expect(block.levels[3].description).toBe("Processo de ativação estruturado.");
    expect(block.levels[8].description).toBe("Crescimento replicável e otimizado.");
    expect(block.levels[8].evidence).toBe("Playbook de crescimento.");
  });

  it("usa a numeração nova nos agrupamentos", () => {
    const fundacao = SRL_BLOCKS.filter((block) => block.group === "fundacao");
    expect(fundacao.map((block) => block.number)).toEqual([1, 2, 5]);
    const produtoMercado = SRL_BLOCKS.filter((block) => block.group === "produtoMercado");
    expect(produtoMercado.map((block) => block.number)).toEqual([3, 4, 7, 8]);
    const escala = SRL_BLOCKS.filter((block) => block.group === "escala");
    expect(escala.map((block) => block.number)).toEqual([6, 9, 10]);
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar a falha**

Run: `pnpm --filter @srl/web exec vitest run src/data/srlBlocks.test.ts`
Expected: FAIL (campo `number` não existe; key `adocao-crescimento` não existe).

- [ ] **Step 3: Atualizar `types.ts`**

Em `apps/web/src/types.ts`, substituir a interface `CanvasBlockDefinition` por:

```ts
export interface CanvasBlockDefinition {
  /** Chave estável de armazenamento (localStorage/Supabase). NUNCA renumerar. */
  id: number;
  key: string;
  /** Numeração de exibição P1-P12 do guia oficial (matriz 3x4). */
  number: number;
  name: string;
  shortLabel: string;
  group: GroupKey;
  icon: string;
  color: "blue" | "green" | "orange" | "purple";
  objective: string;
  /** Nota metodológica do bloco (ex.: lente PLG no bloco Adoção e Crescimento). */
  note?: string;
  questions: string[];
  exampleTips?: string[];
  levels: MaturityLevel[];
  interpretiveSummary?: BlockInterpretiveSummary;
}
```

- [ ] **Step 4: Atualizar `srlBlocks.ts`**

4a. Em `INTERPRETIVE_SUMMARY_BY_BLOCK_KEY` (linha ~99), renomear a entrada `plg:` para `"adocao-crescimento":` com o conteúdo novo:

```ts
  "adocao-crescimento": makeInterpretiveSummary(
    "Adoção Inicial: Desenhar e testar primeiros mecanismos de adoção ou recomendação.",
    "Validação da Adoção: Validar ativação, recorrência e retenção inicial.",
    "Crescimento Replicável: Otimizar crescimento replicável, expansão e adoção contínua."
  ),
```

4b. Reescrever o bloco de `id: 5` (linhas ~396-453) com o conteúdo da seção 6.8 do guia:

```ts
  {
    id: 5,
    key: "adocao-crescimento",
    number: 7,
    interpretiveSummary: INTERPRETIVE_SUMMARY_BY_BLOCK_KEY["adocao-crescimento"],
    name: "Adoção e Crescimento",
    shortLabel: "Adoção",
    group: "produtoMercado",
    icon: "cached",
    color: "green",
    objective:
      "Avaliar a capacidade da solução gerar adoção, retenção, recomendação, expansão ou crescimento replicável.",
    note: "Em startups SaaS ou digitais, este bloco pode ser analisado pela ótica de Product-Led Growth. Em outros modelos, deve ser interpretado como capacidade de adoção, ativação, recorrência, recomendação, expansão ou replicabilidade da solução.",
    questions: [
      "A solução possui mecanismos claros de adoção, retenção ou recomendação?",
      "O processo de entrada, ativação ou uso inicial é simples, eficiente e replicável?"
    ],
    exampleTips: [
      "Jornada: Estruture a jornada inicial de adoção do usuário/cliente.",
      "Ativação: Facilite a ativação e o uso recorrente da solução.",
      "Métricas: Acompanhe métricas de retenção, recomendação e expansão."
    ],
    levels: toLevels([
      {
        description: "Crescimento dependente de esforço manual.",
        evidence: "N/A"
      },
      {
        description: "Ideias iniciais de adoção ou crescimento.",
        evidence: "Brainstorming."
      },
      {
        description: "Primeiros testes de adoção ou indicação.",
        evidence: "Testes piloto."
      },
      {
        description: "Processo de ativação estruturado.",
        evidence: "Jornada do usuário/cliente."
      },
      {
        description: "Mecanismos de recorrência ou recomendação implementados.",
        evidence: "Taxa de recorrência."
      },
      {
        description: "Adoção ou retenção inicial validada.",
        evidence: "Taxa de ativação ou retenção."
      },
      {
        description: "Ciclo de feedback e melhoria em uso.",
        evidence: "NPS ou CSAT."
      },
      {
        description: "Crescimento orgânico ou expansão relevante.",
        evidence: "% de clientes por indicação."
      },
      {
        description: "Crescimento replicável e otimizado.",
        evidence: "Playbook de crescimento."
      }
    ])
  },
```

4c. Adicionar `number` aos demais 11 blocos (conforme tabela de mapeamento do topo) e **reordenar o array `SRL_BLOCKS`** para a ordem: id 1, 2, 3, 4, 7, 8, 5, 9, 6, 10, 11, 12 (ou seja, mover o objeto do bloco Equipe/id 7 para a 5ª posição, Operações/id 8 para a 6ª, Adoção/id 5 para a 7ª, Marketing/id 9 para a 8ª, Modelo/id 6 para a 9ª). Não alterar `id`, `key` nem conteúdo dos outros blocos neste passo, exceto:

- Bloco id 4 (`clientes-tracao`): `objective` vira `"Medir o engajamento real no mercado, com foco em retenção."` (remove a referência cruzada "complementando o Bloco 9", obsoleta com a renumeração).

4d. Atualizar `GROUPS` (linhas 24-77) — apenas os campos de texto:

```ts
// fundacao:
    includedBlocks: "P1. Problema/Oportunidade, P2. Proposta de Valor, P5. Equipe",
// (conceptualFocus de fundacao não muda)

// produtoMercado:
    conceptualFocus:
      "Product/Market Fit: Analisa a interação da solução com o mercado, focando na entrega de valor, tração, adoção, crescimento e canais de aquisição.",
    includedBlocks:
      "P3. Produto/Tecnologia, P4. Clientes/Tração, P7. Adoção e Crescimento, P8. Marketing/Canais",

// escala:
    conceptualFocus:
      "Scalability Fit: Foca na eficiência operacional, no modelo de receita e na capacidade financeira de manter e acelerar o crescimento.",
    includedBlocks: "P6. Operações/Execução, P9. Modelo de Negócio, P10. Sustentação Financeira",

// governanca:
    conceptualFocus:
      "Direcionamento e Proteção: Garante que o negócio tem uma visão estratégica clara e está legalmente protegido para escalar com segurança.",
    includedBlocks: "P11. Estratégia/Visão, P12. Governança e Compliance",
```

- [ ] **Step 5: Rodar os testes**

Run: `pnpm --filter @srl/web exec vitest run src/data/srlBlocks.test.ts`
Expected: PASS (4 testes).

Run: `pnpm --filter @srl/web test`
Expected: PASS — os testes existentes (`score`, `canvasHistory`, `canvasMeta`, `researchInstrumentFingerprint`, `ResearchSurveyPage`) não dependem da ordem do array nem do conteúdo do bloco 5. Se `canvasHistory.test.ts` falhar por ordem de scores, é bug do passo 4c (ids trocados em vez de reordenados) — revisar.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/types.ts apps/web/src/data/srlBlocks.ts apps/web/src/data/srlBlocks.test.ts
git commit -m "feat: numeração P1-P12 do guia v2 e bloco Adoção e Crescimento (ids estáveis)"
```

---

### Task 2: UI exibe `block.number` e a nota metodológica

**Files:**

- Modify: `apps/web/src/pages/CanvasPage.tsx:635,648-661`
- Modify: `apps/web/src/components/BlockEditModal.tsx:105,142-155`
- Modify: `apps/web/src/components/ResultsModal.tsx:57,111-140,303-315`

Sem teste unitário novo (mudanças de exibição); a verificação é o build + conferência visual na Task 9.

- [ ] **Step 1: CanvasPage**

Linha 635: `{block.id}.` → `{block.number}.`
Linhas 651 e 661 (aria-labels): `Diminuir nota do bloco ${block.id}` / `Aumentar nota do bloco ${block.id}` → usar `${block.number}`.
A ordem dos cards e a navegação "próximo bloco" (linhas 270-272) já seguem a ordem do array `SRL_BLOCKS` — nada a fazer.

- [ ] **Step 2: BlockEditModal**

Linha 105: `{block.id}. {block.name}` → `{block.number}. {block.name}`.

Na seção "Objetivo" (após o `<p>` do objetivo, linha ~149), exibir a nota metodológica quando existir:

```tsx
{
  block.note && (
    <p className="mt-2 rounded-lg border border-zinc-200/80 bg-zinc-50 p-3 text-xs italic text-text-light-secondary dark:border-zinc-800/80 dark:bg-zinc-800/60 dark:text-text-dark-secondary">
      {block.note}
    </p>
  );
}
```

- [ ] **Step 3: ResultsModal**

Linha 57: ``labels: SRL_BLOCKS.map((block) => `${block.id}. ${block.shortLabel}`)`` → usar `block.number`.
No `interpretiveResults` (linhas 113-138), adicionar `blockNumber: block.number` aos dois objetos de retorno; na renderização (linha 310), `{item.blockId}. {item.blockName}` → `{item.blockNumber}. {item.blockName}` (manter `key={item.blockId}`).

- [ ] **Step 4: Build + testes**

Run: `pnpm --filter @srl/web test && pnpm --filter @srl/web run build`
Expected: PASS / build sem erros de tipo.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/CanvasPage.tsx apps/web/src/components/BlockEditModal.tsx apps/web/src/components/ResultsModal.tsx
git commit -m "feat: UI exibe numeração P1-P12 do guia v2 e nota metodológica do bloco"
```

---

### Task 3: Velocidade de Maturidade

**Files:**

- Modify: `apps/web/src/utils/canvasHistory.ts:27-33,100-111`
- Modify: `apps/web/src/pages/DashboardPage.tsx:340-367,459-468`
- Test: `apps/web/src/utils/canvasHistory.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Em `canvasHistory.test.ts`, atualizar o teste existente "compares two entries and returns metric deltas" adicionando `timelineTimestamp` aos dois objetos (a assinatura vai exigir):

```ts
it("compares two entries and returns metric deltas", () => {
  const comparison = compareCanvasHistoryEntries(
    {
      metrics: makeMetrics({ total: 60, riskScore: 52.45, cv: 0.12, completion: 100 }),
      filledBlocks: 12,
      timelineTimestamp: Date.UTC(2026, 5, 1)
    },
    {
      metrics: makeMetrics({ total: 36, riskScore: 29.25, cv: 0.22, completion: 75 }),
      filledBlocks: 9,
      timelineTimestamp: Date.UTC(2026, 2, 1)
    }
  );

  expect(comparison.totalDelta).toBe(24);
  expect(comparison.riskScoreDelta).toBeCloseTo(23.2, 4);
  expect(comparison.cvDelta).toBeCloseTo(-0.1, 4);
  expect(comparison.completionDelta).toBe(25);
  expect(comparison.filledBlocksDelta).toBe(3);
});
```

E adicionar dois testes novos no mesmo `describe`:

```ts
it("calcula a velocidade de maturidade em pontos por mês", () => {
  const comparison = compareCanvasHistoryEntries(
    {
      metrics: makeMetrics({ total: 60 }),
      filledBlocks: 12,
      timelineTimestamp: Date.UTC(2026, 5, 1) // 2026-06-01
    },
    {
      metrics: makeMetrics({ total: 36 }),
      filledBlocks: 12,
      timelineTimestamp: Date.UTC(2026, 2, 1) // 2026-03-01, 92 dias antes
    }
  );

  // 24 pontos em 92 dias = 24 / (92 / 30,44) ≈ 7,94 pts/mês
  expect(comparison.maturityVelocity).toBeCloseTo(24 / (92 / 30.44), 4);
});

it("retorna velocidade nula quando o intervalo é menor que um dia", () => {
  const comparison = compareCanvasHistoryEntries(
    {
      metrics: makeMetrics({ total: 60 }),
      filledBlocks: 12,
      timelineTimestamp: Date.UTC(2026, 5, 1, 12)
    },
    {
      metrics: makeMetrics({ total: 36 }),
      filledBlocks: 12,
      timelineTimestamp: Date.UTC(2026, 5, 1, 0)
    }
  );

  expect(comparison.maturityVelocity).toBeNull();
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `pnpm --filter @srl/web exec vitest run src/utils/canvasHistory.test.ts`
Expected: FAIL (TypeScript: `timelineTimestamp` não está no `Pick`; `maturityVelocity` não existe).

- [ ] **Step 3: Implementar em `canvasHistory.ts`**

Atualizar a interface e a função (linhas 27-33 e 100-111):

```ts
export interface CanvasTemporalComparison {
  totalDelta: number;
  riskScoreDelta: number;
  cvDelta: number;
  completionDelta: number;
  filledBlocksDelta: number;
  /** Pontos de maturidade por mês (guia, seção 5.3); null se o intervalo for menor que 1 dia. */
  maturityVelocity: number | null;
}
```

```ts
const MS_PER_DAY = 86_400_000;
const DAYS_PER_MONTH = 30.44;

export function compareCanvasHistoryEntries(
  current: Pick<CanvasHistoryEntry, "metrics" | "filledBlocks" | "timelineTimestamp">,
  previous: Pick<CanvasHistoryEntry, "metrics" | "filledBlocks" | "timelineTimestamp">
): CanvasTemporalComparison {
  const totalDelta = current.metrics.total - previous.metrics.total;
  const elapsedDays = (current.timelineTimestamp - previous.timelineTimestamp) / MS_PER_DAY;
  const maturityVelocity = elapsedDays >= 1 ? totalDelta / (elapsedDays / DAYS_PER_MONTH) : null;

  return {
    totalDelta,
    riskScoreDelta: current.metrics.riskScore - previous.metrics.riskScore,
    cvDelta: current.metrics.cv - previous.metrics.cv,
    completionDelta: current.metrics.completion - previous.metrics.completion,
    filledBlocksDelta: current.filledBlocks - previous.filledBlocks,
    maturityVelocity
  };
}
```

- [ ] **Step 4: Rodar os testes**

Run: `pnpm --filter @srl/web exec vitest run src/utils/canvasHistory.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Exibir no DashboardPage**

No grid de deltas (após o `<p>` de "Delta Blocos Preenchidos", linha ~365), adicionar:

```tsx
{
  temporalComparison.maturityVelocity !== null && (
    <p className="text-text-light-secondary dark:text-text-dark-secondary sm:col-span-2">
      Velocidade de Maturidade:{" "}
      <strong className="text-text-light-primary dark:text-text-dark-primary">
        {formatSignedNumber(temporalComparison.maturityVelocity, 2)} pts/mês
      </strong>{" "}
      <span className="text-[11px]">(reaplicação recomendada a cada 3-6 meses)</span>
    </p>
  );
}
```

`DashboardPage` já passa entradas completas (`CanvasHistoryEntry`) para `compareCanvasHistoryEntries` — a assinatura ampliada compila sem outras mudanças. `hasMeaningfulComparisonDelta` (linha 459) não muda.

- [ ] **Step 6: Build + testes + commit**

Run: `pnpm --filter @srl/web test && pnpm --filter @srl/web run build`
Expected: PASS.

```bash
git add apps/web/src/utils/canvasHistory.ts apps/web/src/utils/canvasHistory.test.ts apps/web/src/pages/DashboardPage.tsx
git commit -m "feat: velocidade de maturidade (pts/mês) no comparativo temporal"
```

---

### Task 4: Protocolo de Interdependência

**Files:**

- Create: `apps/web/src/utils/interdependency.ts`
- Test: `apps/web/src/utils/interdependency.test.ts` (novo)
- Modify: `apps/web/src/components/ResultsModal.tsx`

Contrato: `detectInterdependencyAlerts(scores)` recebe o array de notas alinhado à ordem de `SRL_BLOCKS` (0 = sem nota; é o mesmo array que `CanvasPage` constrói e o `ResultsModal` recebe). Regra do guia (seção 7): a nota de um bloco não deve exceder em mais de 2 níveis a média dos blocos pontuados do seu agrupamento + Fundação (excluindo o próprio bloco).

- [ ] **Step 1: Escrever os testes que falham**

Criar `apps/web/src/utils/interdependency.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { SRL_BLOCKS } from "../data/srlBlocks";
import { detectInterdependencyAlerts } from "./interdependency";

// Constrói o array de scores (alinhado a SRL_BLOCKS) a partir de um mapa por key.
const makeScores = (byKey: Record<string, number>): number[] =>
  SRL_BLOCKS.map((block) => byKey[block.key] ?? 0);

describe("detectInterdependencyAlerts", () => {
  it("não gera alertas para canvas equilibrado", () => {
    const scores = SRL_BLOCKS.map(() => 5);
    expect(detectInterdependencyAlerts(scores)).toEqual([]);
  });

  it("não gera alertas para canvas vazio", () => {
    const scores = SRL_BLOCKS.map(() => 0);
    expect(detectInterdependencyAlerts(scores)).toEqual([]);
  });

  it("alerta quando um bloco excede a média de referência em mais de 2 níveis", () => {
    // Fundação fraca (problema 3, proposta 3, equipe 3) e produto 7:
    // referência do produto = produtoMercado pontuados (exceto ele) + fundação = {3, 3, 3} → média 3
    // 7 > 3 + 2 → alerta
    const scores = makeScores({
      problema: 3,
      "proposta-de-valor": 3,
      equipe: 3,
      "produto-tecnologia": 7
    });

    const alerts = detectInterdependencyAlerts(scores);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      blockId: 3,
      blockNumber: 3,
      score: 7,
      referenceMean: 3
    });
    expect(alerts[0].message).toContain("P3. Produto / Tecnologia");
    expect(alerts[0].message).toContain("nota 7");
  });

  it("ignora blocos sem nota no cálculo da média de referência", () => {
    // Só problema (2) e produto (7) pontuados: referência do produto = {2} → média 2 → alerta
    const scores = makeScores({ problema: 2, "produto-tecnologia": 7 });

    const alerts = detectInterdependencyAlerts(scores);

    expect(alerts).toHaveLength(1);
    expect(alerts[0].referenceMean).toBe(2);
  });

  it("não alerta quando não há blocos de referência pontuados", () => {
    // Apenas um bloco pontuado: sem referência externa → sem alerta
    const scores = makeScores({ "produto-tecnologia": 9 });
    expect(detectInterdependencyAlerts(scores)).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `pnpm --filter @srl/web exec vitest run src/utils/interdependency.test.ts`
Expected: FAIL ("Cannot find module './interdependency'").

- [ ] **Step 3: Implementar `interdependency.ts`**

```ts
import { SRL_BLOCKS } from "../data/srlBlocks";

export interface InterdependencyAlert {
  blockId: number;
  blockNumber: number;
  blockName: string;
  score: number;
  referenceMean: number;
  message: string;
}

const MAX_LEVELS_ABOVE_REFERENCE = 2;

/**
 * Protocolo de Interdependência (guia, seção 7): a nota de um bloco não deve
 * exceder em mais de 2 níveis a média dos blocos pontuados do seu agrupamento
 * e do agrupamento Fundação (I). `scores` é alinhado à ordem de SRL_BLOCKS;
 * 0 = bloco sem nota (ignorado como referência e nunca alertado).
 */
export function detectInterdependencyAlerts(scores: number[]): InterdependencyAlert[] {
  const alerts: InterdependencyAlert[] = [];

  SRL_BLOCKS.forEach((block, index) => {
    const score = scores[index] ?? 0;
    if (score < 1) return;

    const referenceScores = SRL_BLOCKS.flatMap((candidate, candidateIndex) => {
      if (candidateIndex === index) return [];
      const candidateScore = scores[candidateIndex] ?? 0;
      if (candidateScore < 1) return [];
      const isSameGroup = candidate.group === block.group;
      const isFoundation = candidate.group === "fundacao";
      return isSameGroup || isFoundation ? [candidateScore] : [];
    });

    if (referenceScores.length === 0) return;

    const referenceMean =
      referenceScores.reduce((sum, value) => sum + value, 0) / referenceScores.length;

    if (score <= referenceMean + MAX_LEVELS_ABOVE_REFERENCE) return;

    const formattedMean = referenceMean.toFixed(1).replace(".", ",");
    alerts.push({
      blockId: block.id,
      blockNumber: block.number,
      blockName: block.name,
      score,
      referenceMean,
      message: `P${block.number}. ${block.name} (nota ${score}) excede em mais de 2 níveis a média do seu agrupamento e da Fundação (${formattedMean}). Revise se a base está suficientemente validada.`
    });
  });

  return alerts;
}
```

- [ ] **Step 4: Rodar os testes**

Run: `pnpm --filter @srl/web exec vitest run src/utils/interdependency.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Exibir no ResultsModal**

Em `ResultsModal.tsx`:

Import (junto aos demais): `import { detectInterdependencyAlerts } from "../utils/interdependency";`

Após o `interpretiveResults` (linha ~140), adicionar:

```tsx
const interdependencyAlerts = useMemo(() => detectInterdependencyAlerts(scores), [scores]);
```

Na renderização, logo antes da seção "Resumo Interpretativo por Bloco" (linha ~297), adicionar:

```tsx
{
  interdependencyAlerts.length > 0 && (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
        Protocolo de Interdependência
      </h3>
      <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
        Análise não-linear (guia, seção 7): pontuações altas em blocos avançados devem ser
        questionadas quando os blocos de base estão imaturos. Aviso consultivo.
      </p>
      {interdependencyAlerts.map((alert) => (
        <p
          key={alert.blockId}
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300"
        >
          {alert.message}
        </p>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Build + testes + commit**

Run: `pnpm --filter @srl/web test && pnpm --filter @srl/web run build`
Expected: PASS.

```bash
git add apps/web/src/utils/interdependency.ts apps/web/src/utils/interdependency.test.ts apps/web/src/components/ResultsModal.tsx
git commit -m "feat: protocolo de interdependência no diagnóstico (guia v2, seção 7)"
```

---

### Task 5: Padrões de Leitura do Radar

**Files:**

- Create: `apps/web/src/utils/radarPatterns.ts`
- Test: `apps/web/src/utils/radarPatterns.test.ts` (novo)
- Modify: `apps/web/src/components/ResultsModal.tsx`

Heurística (documentada no código): bloco fraco = nota ≤ 3; forte = nota ≥ 6; assimetria extrema = diferença ≥ 4 entre blocos pontuados do mesmo agrupamento. Médias só sobre blocos pontuados; um agrupamento só entra na análise com ≥ 2 blocos pontuados (≥ 1 para Futuro & Governança, que tem 2 blocos).

- [ ] **Step 1: Escrever os testes que falham**

Criar `apps/web/src/utils/radarPatterns.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { SRL_BLOCKS } from "../data/srlBlocks";
import { detectRadarPatterns } from "./radarPatterns";

const makeScores = (byKey: Record<string, number>): number[] =>
  SRL_BLOCKS.map((block) => byKey[block.key] ?? 0);

const appliedKeys = (scores: number[]): string[] =>
  detectRadarPatterns(scores)
    .filter((pattern) => pattern.applies)
    .map((pattern) => pattern.key);

describe("detectRadarPatterns", () => {
  it("sempre retorna os 4 padrões do guia", () => {
    const patterns = detectRadarPatterns(SRL_BLOCKS.map(() => 0));
    expect(patterns).toHaveLength(4);
    expect(patterns.map((pattern) => pattern.key)).toEqual([
      "buraco-fundacao",
      "sustentacao-fraca",
      "governanca-fraca",
      "assimetria-agrupamento"
    ]);
    expect(patterns.every((pattern) => !pattern.applies)).toBe(true);
  });

  it("detecta buraco na fundação (P1, P2 e P5 muito baixos)", () => {
    const scores = makeScores({
      problema: 2,
      "proposta-de-valor": 3,
      equipe: 2,
      "produto-tecnologia": 6,
      "clientes-tracao": 6
    });
    expect(appliedKeys(scores)).toContain("buraco-fundacao");
  });

  it("detecta produto e mercado bons com sustentabilidade fraca", () => {
    const scores = makeScores({
      "produto-tecnologia": 7,
      "clientes-tracao": 6,
      "marketing-canais": 7,
      operacoes: 2,
      "modelo-de-negocio": 3,
      "sustentacao-financeira": 2
    });
    expect(appliedKeys(scores)).toContain("sustentacao-fraca");
  });

  it("detecta radar forte com futuro e governança fracos", () => {
    const scores = makeScores({
      problema: 7,
      "proposta-de-valor": 7,
      "produto-tecnologia": 6,
      "clientes-tracao": 7,
      equipe: 6,
      operacoes: 6,
      "adocao-crescimento": 7,
      "marketing-canais": 6,
      "modelo-de-negocio": 7,
      "sustentacao-financeira": 6,
      "estrategia-visao": 2,
      "governanca-compliance": 3
    });
    expect(appliedKeys(scores)).toContain("governanca-fraca");
  });

  it("detecta assimetria extrema dentro de um agrupamento", () => {
    const scores = makeScores({
      problema: 8,
      "proposta-de-valor": 3,
      equipe: 5
    });
    expect(appliedKeys(scores)).toContain("assimetria-agrupamento");
  });

  it("canvas equilibrado não aplica nenhum padrão", () => {
    const scores = SRL_BLOCKS.map(() => 5);
    expect(appliedKeys(scores)).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `pnpm --filter @srl/web exec vitest run src/utils/radarPatterns.test.ts`
Expected: FAIL ("Cannot find module './radarPatterns'").

- [ ] **Step 3: Implementar `radarPatterns.ts`**

```ts
import { SRL_BLOCKS } from "../data/srlBlocks";
import type { GroupKey } from "../types";

export interface RadarPattern {
  key: "buraco-fundacao" | "sustentacao-fraca" | "governanca-fraca" | "assimetria-agrupamento";
  title: string;
  description: string;
  applies: boolean;
}

// Heurística do app (spec 2026-06-11): fraco = média <= 3; forte = média >= 6;
// assimetria extrema = diferença >= 4 entre blocos pontuados do mesmo agrupamento.
const WEAK_MEAN = 3;
const STRONG_MEAN = 6;
const EXTREME_GAP = 4;

const scoredByGroup = (scores: number[], group: GroupKey): number[] =>
  SRL_BLOCKS.flatMap((block, index) => {
    const score = scores[index] ?? 0;
    return block.group === group && score >= 1 ? [score] : [];
  });

const mean = (values: number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

export function detectRadarPatterns(scores: number[]): RadarPattern[] {
  const fundacao = scoredByGroup(scores, "fundacao");
  const produtoMercado = scoredByGroup(scores, "produtoMercado");
  const escala = scoredByGroup(scores, "escala");
  const governanca = scoredByGroup(scores, "governanca");

  const buracoFundacao = fundacao.length >= 2 && mean(fundacao) <= WEAK_MEAN;

  const sustentacaoFraca =
    produtoMercado.length >= 2 &&
    mean(produtoMercado) >= STRONG_MEAN &&
    escala.length >= 2 &&
    mean(escala) <= WEAK_MEAN;

  const nonGovernanca = [...fundacao, ...produtoMercado, ...escala];
  const governancaFraca =
    nonGovernanca.length >= 6 &&
    mean(nonGovernanca) >= STRONG_MEAN &&
    governanca.length >= 1 &&
    mean(governanca) <= WEAK_MEAN;

  const assimetria = (["fundacao", "produtoMercado", "escala", "governanca"] as GroupKey[]).some(
    (group) => {
      const groupScores = scoredByGroup(scores, group);
      return (
        groupScores.length >= 2 &&
        Math.max(...groupScores) - Math.min(...groupScores) >= EXTREME_GAP
      );
    }
  );

  return [
    {
      key: "buraco-fundacao",
      title: "Buraco na Fundação (P1, P2 e P5 muito baixos)",
      description:
        "Risco de escalar um problema mal definido, com proposta de valor pouco clara e time desalinhado.",
      applies: buracoFundacao
    },
    {
      key: "sustentacao-fraca",
      title: "Bom Produto e Mercado, mas baixa Sustentabilidade e Escala (P6, P9 e P10 baixos)",
      description:
        "A startup vende e gera tração, mas não captura valor de forma saudável ou não tem operação estruturada para crescer.",
      applies: sustentacaoFraca
    },
    {
      key: "governanca-fraca",
      title: "Radar forte em quase tudo, mas fraco em Futuro e Governança (P11 e P12 baixos)",
      description:
        "Risco de travamento em contratos maiores, captação ou parcerias por falta de visão e base jurídica.",
      applies: governancaFraca
    },
    {
      key: "assimetria-agrupamento",
      title: "Assimetria extrema entre blocos do mesmo agrupamento",
      description:
        "Indica gargalos críticos, como muito marketing com problema mal definido, gerando desperdício.",
      applies: assimetria
    }
  ];
}
```

- [ ] **Step 4: Rodar os testes**

Run: `pnpm --filter @srl/web exec vitest run src/utils/radarPatterns.test.ts`
Expected: PASS (6 testes).

- [ ] **Step 5: Exibir no ResultsModal**

Import: `import { detectRadarPatterns } from "../utils/radarPatterns";`

Memo junto aos demais: `const radarPatterns = useMemo(() => detectRadarPatterns(scores), [scores]);`

Renderizar logo após o `<div className="h-[340px] w-full">` do radar (linha ~250):

```tsx
<div className="space-y-2">
  <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
    Padrões Comuns de Leitura do Radar
  </h3>
  <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
    {radarPatterns.map((pattern) => (
      <div
        key={pattern.key}
        className={`rounded-lg border p-3 text-xs ${
          pattern.applies
            ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-200"
            : "border-zinc-200/80 bg-zinc-50 text-text-light-secondary dark:border-zinc-800/80 dark:bg-zinc-800/60 dark:text-text-dark-secondary"
        }`}
      >
        <p className="font-semibold">
          {pattern.applies ? "⚠ " : ""}
          {pattern.title}
        </p>
        <p className="mt-1">{pattern.description}</p>
      </div>
    ))}
  </div>
  <p className="text-[11px] text-text-light-secondary dark:text-text-dark-secondary">
    Use esses padrões como guia, combinando sempre com evidências e contexto real.
  </p>
</div>
```

- [ ] **Step 6: Build + testes + commit**

Run: `pnpm --filter @srl/web test && pnpm --filter @srl/web run build`
Expected: PASS.

```bash
git add apps/web/src/utils/radarPatterns.ts apps/web/src/utils/radarPatterns.test.ts apps/web/src/components/ResultsModal.tsx
git commit -m "feat: padrões de leitura do radar no diagnóstico (guia v2, seção 5.1.1)"
```

---

### Task 6: Força de Evidências no modal de edição

**Files:**

- Create: `apps/web/src/data/evidenceStrength.ts`
- Modify: `apps/web/src/components/BlockEditModal.tsx:228-239`

Conteúdo estático (tabela da seção 3 do guia); sem teste unitário — verificação por build e conferência visual.

- [ ] **Step 1: Criar `evidenceStrength.ts`**

```ts
export interface EvidenceStrengthLevel {
  level: number;
  name: string;
  type: string;
  example: string;
}

// Guia SRL Canvas v2, seção 3 (Protocolo de Evidências).
export const EVIDENCE_STRENGTH_LEVELS: EvidenceStrengthLevel[] = [
  {
    level: 1,
    name: "Fraca",
    type: "Relatos informais e percepções sem registro estruturado",
    example: "Conversas não documentadas, impressões soltas da equipe"
  },
  {
    level: 2,
    name: "Média",
    type: "Registros estruturados de natureza qualitativa",
    example: "Entrevistas transcritas, personas, job stories, atas de validação"
  },
  {
    level: 3,
    name: "Forte",
    type: "Métricas quantitativas e dados consolidados",
    example: "Dashboards, relatórios de uso, pesquisas com amostragem, indicadores de conversão"
  },
  {
    level: 4,
    name: "Muito forte",
    type: "Evidências formais de natureza jurídica, financeira ou contratual",
    example: "Contratos assinados, notas fiscais, DRE, registros de propriedade intelectual"
  }
];
```

- [ ] **Step 2: Exibir no BlockEditModal**

Import: `import { EVIDENCE_STRENGTH_LEVELS } from "../data/evidenceStrength";`

Dentro do `<label>` de "Evidências" (após o `<textarea>`, linha ~238), adicionar:

```tsx
<details className="mt-2 rounded-lg border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-800/60">
  <summary className="cursor-pointer text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary">
    Qual a força da sua evidência?
  </summary>
  <ul className="mt-2 space-y-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
    {EVIDENCE_STRENGTH_LEVELS.map((item) => (
      <li key={item.level}>
        <strong>
          {item.level}. {item.name}:
        </strong>{" "}
        {item.type}. <em>Ex.: {item.example}.</em>
      </li>
    ))}
  </ul>
</details>
```

Nota: `<details>` dentro de `<label>` pode disparar foco indevido no textarea ao clicar no summary; se ocorrer, mover o `<details>` para imediatamente após o fechamento do `</label>` de Evidências.

- [ ] **Step 3: Build + commit**

Run: `pnpm --filter @srl/web run build`
Expected: build sem erros.

```bash
git add apps/web/src/data/evidenceStrength.ts apps/web/src/components/BlockEditModal.tsx
git commit -m "feat: tabela de força de evidências no modal de edição (guia v2, seção 3)"
```

---

### Task 7: Texto "Sobre o SRL Canvas" (seção 1 do guia v2)

**Files:**

- Modify: `apps/web/src/data/aboutSrlCanvas.ts`
- Modify: `apps/web/src/components/AboutSrlCanvasModal.tsx:56-58`

- [ ] **Step 1: Reescrever `aboutSrlCanvas.ts`**

Substituir o arquivo inteiro por:

```ts
export const ABOUT_SRL_CANVAS = {
  title: "POR QUE O SRL CANVAS?",
  contextAndGap:
    "Startups operam em contextos de alta incerteza. Por isso, um de seus maiores desafios não é apenas formular boas hipóteses, mas compreender o que já foi validado, o que ainda é suposição e onde estão os principais gargalos de maturidade do negócio. Frameworks como o Business Model Canvas (BMC) são úteis para estruturar hipóteses sobre proposta de valor, clientes, canais, receitas e operações, mas não foram desenhados para medir o nível de validação dessas hipóteses. De modo semelhante, o Technology Readiness Level (TRL) foca na prontidão tecnológica, mas não aborda o maior risco de muitas startups: desenvolver algo que o mercado não deseja ou não valoriza.",
  purpose:
    "Nesse contexto, o SRL Canvas foi desenvolvido como uma ferramenta visual e prática que complementa o BMC. Enquanto o BMC organiza hipóteses sobre o modelo de negócio, o SRL Canvas permite diagnosticar, em 12 dimensões essenciais, o estágio de maturidade e validação dessas hipóteses.",
  whoShouldUseTitle: "1. Quem Deve Usar Este Guia",
  whoShouldUseIntro:
    "O SRL Canvas atende diferentes atores do ecossistema de inovação, sempre com foco em diagnóstico, aprendizado e tomada de decisão:",
  whoShouldUse: [
    "Fundadores de startups: Apoiar a autoavaliação, identificar gargalos e orientar a priorização de testes e validações.",
    "Aceleradoras e incubadoras: Diagnosticar e acompanhar startups de portfólio com maior consistência comparativa.",
    "Investidores anjo e fundos: Apoiar análises de risco e due diligence, especialmente quando as pontuações são acompanhadas de evidências.",
    "Pesquisadores e acadêmicos: Utilizar o framework como instrumento analítico em estudos sobre maturidade, validação e evolução de startups."
  ],
  propositionTitle: "2. O que o SRL Canvas se Propõe a Ser",
  propositionItems: [
    "Ferramenta diagnóstica: Avalia a maturidade da startup em níveis de 1 a 9, com base em critérios objetivos e evidências.",
    "Bússola de aprendizado: Indica onde a startup precisa validar mais, aprender mais ou corrigir rotas.",
    "Estrutura market-first: Parte do princípio de que a maturidade de mercado e cliente é um dos principais determinantes da evolução sustentável do negócio."
  ],
  propositionSummary:
    "Em síntese, o SRL Canvas é uma ferramenta diagnóstica baseada em evidências. Por isso, recomenda-se que as pontuações atribuídas a cada bloco sejam sempre sustentadas por registros verificáveis, conforme o protocolo de evidências do guia oficial.",
  notTitle: "O que o SRL Canvas Não É",
  notDescription:
    "O SRL Canvas não substitui ferramentas de formulação estratégica, planejamento financeiro detalhado, modelagem societária ou estruturação jurídica. Ele funciona como um painel diagnóstico de maturidade e deve ser utilizado em conjunto com outras ferramentas de gestão, validação e execução."
};
```

(O campo `terminologyNote` deixa de existir — a Nota Terminológica saiu do guia v2.)

- [ ] **Step 2: Ajustar `AboutSrlCanvasModal.tsx`**

Remover o parágrafo das linhas 56-58 (`{ABOUT_SRL_CANVAS.terminologyNote}`). Os demais campos mantêm os mesmos nomes.

- [ ] **Step 3: Build + commit**

Run: `pnpm --filter @srl/web run build`
Expected: build sem erros (se o build falhar com "terminologyNote does not exist", o passo 2 ficou incompleto).

```bash
git add apps/web/src/data/aboutSrlCanvas.ts apps/web/src/components/AboutSrlCanvasModal.tsx
git commit -m "docs: texto institucional 'Sobre o SRL Canvas' atualizado para o guia v2"
```

---

### Task 8: Questionário de pesquisa (label, ordem e versão)

**Files:**

- Modify: `apps/web/src/data/researchSurvey.ts:1,14-27`
- Modify: `apps/web/src/utils/researchInstrumentFingerprint.test.ts:6-8`

**Atenção (ética em pesquisa):** o snapshot do fingerprint protege o instrumento aprovado pelo comitê de ética. Esta mudança altera o instrumento deliberadamente (decisão do pesquisador, dono da pesquisa, alinhando ao guia v2); a versão recebe bump para que respostas pré e pós-mudança sejam distinguíveis. As keys persistidas (`plg` etc.) NÃO mudam.

- [ ] **Step 1: Atualizar `researchSurvey.ts`**

Linha 1:

```ts
export const RESEARCH_SURVEY_VERSION = "questionario_quantitativo_srl_canvas_guia_v2_2026-06-11";
```

`SURVEY_DIMENSIONS` (manter keys; atualizar label do `plg` e reordenar para P1-P12; labels sem acento seguem a convenção do arquivo):

```ts
export const SURVEY_DIMENSIONS = [
  { key: "problema_oportunidade", label: "Problema/Oportunidade" },
  { key: "proposta_valor", label: "Proposta de Valor" },
  { key: "produto_tecnologia", label: "Produto/Tecnologia" },
  { key: "clientes_tracao", label: "Clientes/Tracao" },
  { key: "equipe", label: "Equipe" },
  { key: "operacoes_execucao", label: "Operacoes/Execucao" },
  { key: "plg", label: "Adocao e Crescimento" },
  { key: "marketing_canais", label: "Marketing/Canais" },
  { key: "modelo_negocio", label: "Modelo de Negocio" },
  { key: "sustentacao_financeira", label: "Sustentacao Financeira" },
  { key: "estrategia_visao", label: "Estrategia/Visao" },
  { key: "governanca_compliance", label: "Governanca & Compliance" }
] as const;
```

- [ ] **Step 2: Rodar o teste do fingerprint e ver a falha**

Run: `pnpm --filter @srl/web exec vitest run src/utils/researchInstrumentFingerprint.test.ts`
Expected: FAIL — o snapshot inline não bate (a mudança de versão/dimensões altera o hash). Isso confirma que o guard funciona.

- [ ] **Step 3: Atualizar o snapshot deliberadamente**

Run: `pnpm --filter @srl/web exec vitest run -u src/utils/researchInstrumentFingerprint.test.ts`
Expected: PASS, snapshot regravado com `ethics-questionario_quantitativo_srl_canvas_guia_v2_2026-06-11:<hash>`.

- [ ] **Step 4: Rodar a suíte toda**

Run: `pnpm --filter @srl/web test`
Expected: PASS (incluindo `ResearchSurveyPage.test.tsx`; se falhar por label/ordem, ajustar as expectativas do teste para os labels novos).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/data/researchSurvey.ts apps/web/src/utils/researchInstrumentFingerprint.test.ts
git commit -m "feat: questionário de pesquisa alinhado ao guia v2 (keys estáveis, versão nova)"
```

---

### Task 9: Guia de referência no repositório + verificação final

**Files:**

- Modify: `guia_srl.txt` (substituição do conteúdo)
- Verify: `apps/web/public/downloads/`

- [ ] **Step 1: Substituir o guia de referência**

```bash
cp /Users/marcelosiqueira/Downloads/guia-srl-canvas.md guia_srl.txt
```

- [ ] **Step 2: Verificar os PDFs de download**

Run: `ls -la apps/web/public/downloads/`
Conferir se existe um PDF do guia atualizado (commits recentes adicionaram PDFs). Reportar ao usuário o que foi encontrado — se o PDF for da versão antiga do guia, ele precisa fornecer o PDF novo (não gerar PDF automaticamente).

- [ ] **Step 3: Check completo do workspace**

Run: `pnpm --filter @srl/web run check`
Expected: lint PASS, testes PASS, build PASS.

- [ ] **Step 4: Verificação visual (manual)**

Run: `pnpm --filter @srl/web dev` e conferir em http://localhost:5173:

1. Canvas: cards na ordem P1-P12 (Equipe é o 5º, Adoção e Crescimento o 7º, Modelo de Negócio o 9º).
2. Bloco P7 abre como "Adoção e Crescimento" com a nota sobre PLG e os 9 níveis novos.
3. Campo Evidências mostra o expansível "Qual a força da sua evidência?".
4. Resultados: radar com labels novos, padrões de leitura abaixo do radar, alertas de interdependência quando aplicável (testar com Fundação=3 e Produto=7).
5. Modal "Sobre": texto novo sem a Nota Terminológica.

- [ ] **Step 5: Commit final**

```bash
git add guia_srl.txt
git commit -m "docs: guia oficial v2 como referência no repositório"
```

---

## Self-Review (executado na escrita do plano)

- **Cobertura da spec:** §Contexto/mapeamento → Task 1; §1 dados → Task 1; §2 UI → Task 2; §3.1 velocidade → Task 3; §3.2 interdependência → Task 4; §3.4 padrões radar → Task 5; §3.3 força de evidências → Task 6; §4 textos → Tasks 7 e 9; §5 questionário → Task 8; §7 testes → distribuídos + Task 9.
- **Placeholders:** nenhum — todo passo tem código ou comando completo.
- **Consistência de tipos:** `number`/`note` definidos na Task 1 e usados nas Tasks 2/4; `maturityVelocity: number | null` consistente entre util, teste e UI; `detectInterdependencyAlerts(scores: number[])` e `detectRadarPatterns(scores: number[])` recebem o mesmo array que `ResultsModal` já recebe via props.
