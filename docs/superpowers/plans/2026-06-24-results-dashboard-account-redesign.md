# Redesign Resultados (rota) + Dashboard + Minha Conta — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Estender o novo design às telas autenticadas restantes — transformar Resultados numa **tela própria** (rota `/results`, sem modal) e redesenhar Dashboard e Minha Conta dentro do `AppShell`, corrigindo a navegação do menu.

**Architecture:** Extrair o conteúdo de Resultados (radar chart.js + análises + export) em componentes reaproveitáveis (`MaturityRadar`, `ResultsAnalysis`), usados por uma nova `ResultsPage` (dentro do `AppShell`). Remover o `ResultsModal`. "Ver Resultados" passa a navegar para `/results`. Dashboard e Account passam a usar `AppShell` (saem `AppHeader`/`FooterNav`), preservando toda a funcionalidade re-estilizada.

**Tech Stack:** React 18 + TS + Vite + Tailwind 3 (`darkMode: "class"`) + Zustand + react-router-dom 7 + chart.js/react-chartjs-2; testes Vitest + @testing-library/react.

## Global Constraints

- Front-end em `apps/web`; comandos a partir de lá.
- Dark mode via wrapper `.dark` em `App.tsx`; tokens dark sob `.dark`. Ícones Material Symbols (sem lucide-react).
- Tokens novos disponíveis: `bg-app`, `surface`, `surface-2`, `inset`, `stroke`, `line`, `ink`, `ink-2`, `ink-3`, `teal`, `navy`, `hero`, `brand`, `brand-fg`; `font-display` (Archivo), `font-sans` (IBM Plex), `font-mono`; `rounded-card/hero/modal`; `shadow/sm/lg`. Cores de categoria em `GROUPS[].color` (hex) + `withAlpha`. Tokens antigos (`primary #135bec` etc.) permanecem para nada quebrar.
- IDs de bloco imutáveis; exibição usa `number` (P1–P12).
- **Resultados é uma TELA (rota `/results`), nunca um modal.** O `ResultsModal` é removido ao final.
- Preservar TODA a funcionalidade existente, apenas re-estilizada: na Resultados (padrões do radar, interdependência, resumo interpretativo por bloco, export PNG/PDF); na Dashboard (histórico/comparativo temporal, status de sync, painel de opinião); na Conta (perfil, tema, sobre, métricas de produto, opinião).
- `AppShell` envolve Dashboard, Resultados e Conta (saem `AppHeader` e `FooterNav` dessas telas).
- O projeto NÃO auto-registra cleanup do Testing Library: testes que renderizam mais de uma vez devem incluir `import { cleanup } from "@testing-library/react"` + `afterEach(() => cleanup())`.
- Gate por task: teste novo + `npm run lint`. No final do plano: `npm run test` + `npm run lint` + `npx tsc --noEmit` + `npm run build` verdes.
- Reuso de lógica existente (NÃO reescrever): `calculateScoreMetrics`, `maturityStageFromTotal` (`utils/score`), `detectInterdependencyAlerts` (`utils/interdependency`), `detectRadarPatterns` (`utils/radarPatterns`), `buildScoresFromBlocks`/`buildCanvasHistoryEntries`/`compareCanvasHistoryEntries` (`utils/canvasHistory`), `buildCanvasTitle` (`utils/canvasIdentity`), `SRL_BLOCKS`/`GROUP_BY_KEY` (`data/srlBlocks`), `withAlpha` (`utils/color`).

---

### Task 1: `MaturityRadar` (radar chart.js reutilizável, recolorido)

**Files:**

- Create: `apps/web/src/components/MaturityRadar.tsx`
- Create: `apps/web/src/components/MaturityRadar.test.tsx`

**Interfaces:**

- Produces:
  ```ts
  interface MaturityRadarProps {
    scores: number[]; // 12 notas (0..9), ordem de SRL_BLOCKS
    darkMode: boolean;
    className?: string; // wrapper de altura, ex.: "h-[340px]"
  }
  export function MaturityRadar(props: MaturityRadarProps): JSX.Element;
  ```
- Registra os elementos do chart.js (RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend) no módulo (como no `ResultsModal`). Polígono na cor teal do design (`#0F7E7C` linha/ponto, `rgba(15,126,124,.20)` preenchimento no claro). Labels = `${block.number}. ${block.shortLabel}`. Escala r: min 0, max 9, stepSize 1. Cores de grid/ticks/labels dependem de `darkMode` (claro `#586271`/`rgba(88,98,113,.3)`; escuro `#9DAAC0`/`rgba(157,170,192,.3)`).

- [ ] **Step 1: Write the failing test** — `MaturityRadar.test.tsx`

```tsx
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MaturityRadar } from "./MaturityRadar";

vi.mock("react-chartjs-2", () => ({
  Radar: (props: { data: { datasets: { data: number[] }[] } }) => (
    <div data-testid="radar" data-points={props.data.datasets[0].data.join(",")} />
  )
}));

afterEach(() => cleanup());

describe("MaturityRadar", () => {
  it("repassa as 12 notas ao dataset do radar", () => {
    const scores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3];
    const { getByTestId } = render(<MaturityRadar scores={scores} darkMode={false} />);
    expect(getByTestId("radar").getAttribute("data-points")).toBe(scores.join(","));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/components/MaturityRadar.test.tsx`
Expected: FAIL — import não resolvido.

- [ ] **Step 3: Implement `MaturityRadar.tsx`**

```tsx
import { useMemo } from "react";
import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip
} from "chart.js";
import { Radar } from "react-chartjs-2";
import { SRL_BLOCKS } from "../data/srlBlocks";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface MaturityRadarProps {
  scores: number[];
  darkMode: boolean;
  className?: string;
}

export function MaturityRadar({
  scores,
  darkMode,
  className = "h-[340px] w-full"
}: MaturityRadarProps) {
  const data = useMemo(
    () => ({
      labels: SRL_BLOCKS.map((block) => `${block.number}. ${block.shortLabel}`),
      datasets: [
        {
          label: "Nível SRL",
          data: scores,
          borderWidth: 2.5,
          borderColor: darkMode ? "#2DC7B6" : "#0F7E7C",
          pointBackgroundColor: darkMode ? "#2DC7B6" : "#0F7E7C",
          pointBorderColor: darkMode ? "#101829" : "#ffffff",
          backgroundColor: darkMode ? "rgba(45,199,182,0.22)" : "rgba(15,126,124,0.18)",
          fill: true
        }
      ]
    }),
    [scores, darkMode]
  );

  const options = useMemo(
    () => ({
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0,
          max: 9,
          ticks: {
            stepSize: 1,
            backdropColor: "transparent",
            color: darkMode ? "#9DAAC0" : "#586271"
          },
          grid: { color: darkMode ? "rgba(157,170,192,0.3)" : "rgba(88,98,113,0.3)" },
          angleLines: { color: darkMode ? "rgba(157,170,192,0.3)" : "rgba(88,98,113,0.3)" },
          pointLabels: { color: darkMode ? "#E9EEF6" : "#16202E", font: { size: 11 } }
        }
      }
    }),
    [darkMode]
  );

  return (
    <div className={className}>
      <Radar data={data} options={options} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/components/MaturityRadar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Lint + commit**

```bash
cd apps/web && npm run lint
git add apps/web/src/components/MaturityRadar.tsx apps/web/src/components/MaturityRadar.test.tsx
git commit -m "feat(web): componente MaturityRadar reutilizável (radar teal do novo design)"
```

---

### Task 2: `ResultsAnalysis` (análises + métricas + export reutilizáveis)

**Files:**

- Create: `apps/web/src/components/ResultsAnalysis.tsx`
- Create: `apps/web/src/components/ResultsAnalysis.test.tsx`

**Interfaces:**

- Consumes: `SRL_BLOCKS` (`../data/srlBlocks`); `maturityStageFromTotal` (`../utils/score`); `detectInterdependencyAlerts` (`../utils/interdependency`); `detectRadarPatterns` (`../utils/radarPatterns`); tipo `ScoreMetrics` (`../types`).
- Produces:
  ```ts
  interface ResultsAnalysisProps {
    scores: number[];
    metrics: ScoreMetrics;
    darkMode: boolean;
    /** Elemento a capturar no export (radar+conteúdo). Se ausente, captura a própria seção. */
    captureRef?: React.RefObject<HTMLElement>;
  }
  export function ResultsAnalysis(props: ResultsAnalysisProps): JSX.Element;
  ```
- Conteúdo (portado do `ResultsModal`, re-estilizado com tokens novos): cards de métrica (Total, Média, Desvio-padrão, Coef. Variação, Scorecard de Risco) + fórmula; "Padrões Comuns de Leitura do Radar" (`detectRadarPatterns`); "Protocolo de Interdependência" (`detectInterdependencyAlerts`); "Resumo Interpretativo por Bloco" (bands + selectedLevel, igual ao modal); botões **Exportar PNG** / **Exportar PDF** (mesma lógica `html2canvas`/`jspdf` do `ResultsModal`, capturando `captureRef?.current ?? sectionRef.current`, backgroundColor `darkMode ? "#101829" : "#ffffff"`).
- Re-estilização: cartões `bg-inset`/`bg-surface-2` + `border-stroke`, textos `text-ink/ink-2/ink-3`, Scorecard em `text-teal`, alertas em âmbar (manter classes amber atuais).

- [ ] **Step 1: Write the failing test** — `ResultsAnalysis.test.tsx`

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ResultsAnalysis } from "./ResultsAnalysis";
import { calculateScoreMetrics } from "../utils/score";

afterEach(() => cleanup());

describe("ResultsAnalysis", () => {
  it("mostra total e scorecard e os botões de export", () => {
    const scores = [9, 8, 7, 6, 5, 4, 3, 2, 1, 5, 5, 5];
    const metrics = calculateScoreMetrics(scores);
    render(<ResultsAnalysis scores={scores} metrics={metrics} darkMode={false} />);
    expect(screen.getByText(`${metrics.total} / 108`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exportar PNG/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exportar PDF/i })).toBeInTheDocument();
    expect(screen.getByText(/Resumo Interpretativo/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd apps/web && npx vitest run src/components/ResultsAnalysis.test.tsx`
Expected: FAIL — import não resolvido.

- [ ] **Step 3: Implement `ResultsAnalysis.tsx`**

Portar de `apps/web/src/components/ResultsModal.tsx` as seções: blocos de métrica (linhas 286–329), padrões (259–284), interdependência (331–349), resumo interpretativo (351–403) e as funções `exportPng`/`exportPdf` (149–205) e helper `format` (30–34) e o `interpretiveResults` memo (113–144). Re-estilizar para tokens novos. Estrutura:

```tsx
import { useMemo, useRef, useState } from "react";
import { SRL_BLOCKS } from "../data/srlBlocks";
import type { ScoreMetrics } from "../types";
import { detectInterdependencyAlerts } from "../utils/interdependency";
import { detectRadarPatterns } from "../utils/radarPatterns";

interface ResultsAnalysisProps {
  scores: number[];
  metrics: ScoreMetrics;
  darkMode: boolean;
  captureRef?: React.RefObject<HTMLElement>;
}

const format = (value: number, digits = 2): string =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);

export function ResultsAnalysis({ scores, metrics, darkMode, captureRef }: ResultsAnalysisProps) {
  const [isExporting, setIsExporting] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const interpretiveResults = useMemo(/* ...igual ao ResultsModal (linhas 113-144)... */, [scores]);
  const interdependencyAlerts = useMemo(() => detectInterdependencyAlerts(scores), [scores]);
  const radarPatterns = useMemo(() => detectRadarPatterns(scores), [scores]);

  const exportPng = async () => {
    const node = captureRef?.current ?? sectionRef.current;
    if (!node) return;
    setIsExporting(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: darkMode ? "#101829" : "#ffffff" });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "srl-canvas-resultados.png";
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  const exportPdf = async () => {
    const node = captureRef?.current ?? sectionRef.current;
    if (!node) return;
    setIsExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf")
      ]);
      const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: darkMode ? "#101829" : "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const renderWidth = pageWidth - margin * 2;
      const renderHeight = (canvas.height * renderWidth) / canvas.width;
      const finalHeight = renderHeight <= pageHeight - margin * 2 ? renderHeight : pageHeight - margin * 2;
      pdf.addImage(imgData, "PNG", margin, margin, renderWidth, finalHeight);
      pdf.save("srl-canvas-resultados.pdf");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div ref={sectionRef} className="space-y-5">
      {/* cards de métrica: Total `{metrics.total} / 108`, Média format(metrics.mean), Desvio format(metrics.stdDev),
          Coef. Variação format(metrics.cv), Scorecard format(metrics.riskScore) em text-teal.
          Grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-5, cards rounded-card border border-stroke bg-inset p-3. */}
      {/* Padrões: radarPatterns.map -> card; aplica => âmbar, senão bg-inset/border-stroke. */}
      {/* Interdependência: se interdependencyAlerts.length>0, lista de avisos âmbar. */}
      {/* Resumo interpretativo: interpretiveResults.map -> article rounded-card border-stroke bg-inset,
          título "{number}. {name}", pill "Nota: n/9|Pendente" (bg withAlpha/teal), bands + selectedLevel. */}
      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" onClick={exportPng} disabled={isExporting}
          className="rounded-[10px] border border-stroke px-4 py-2 text-sm font-semibold text-ink-2 disabled:opacity-70">
          Exportar PNG
        </button>
        <button type="button" onClick={exportPdf} disabled={isExporting}
          className="rounded-[10px] border border-stroke px-4 py-2 text-sm font-semibold text-ink-2 disabled:opacity-70">
          Exportar PDF
        </button>
      </div>
    </div>
  );
}
```

Implementar as seções marcadas reaproveitando o JSX do `ResultsModal` (mesmo texto/estrutura), apenas trocando as classes de cor antigas pelas novas. O `interpretiveResults` memo é idêntico ao do `ResultsModal` (copiar linhas 113–144 verbatim).

- [ ] **Step 4: Run to verify it passes**

Run: `cd apps/web && npx vitest run src/components/ResultsAnalysis.test.tsx`
Expected: PASS.

- [ ] **Step 5: Lint + commit**

```bash
cd apps/web && npm run lint
git add apps/web/src/components/ResultsAnalysis.tsx apps/web/src/components/ResultsAnalysis.test.tsx
git commit -m "feat(web): ResultsAnalysis (métricas, padrões, interdependência, resumo, export)"
```

---

### Task 3: `ResultsPage` (tela `/results` no AppShell)

**Files:**

- Create: `apps/web/src/pages/ResultsPage.tsx`
- Create: `apps/web/src/pages/ResultsPage.test.tsx`

**Interfaces:**

- Consumes: `AppShell`; `MaturityRadar`; `ResultsAnalysis`; `BlockEditModal`; `useCanvasStore` (`blocks`, `meta`, `darkMode`, `updateBlock`); `useLocation` (router state opcional com snapshot); `calculateScoreMetrics`, `maturityStageFromTotal`; `buildCanvasTitle`; `SRL_BLOCKS`, `SRL_BLOCKS_BY_ID`, `GROUP_BY_KEY`; `withAlpha`.
- Router state opcional: `{ scores: number[]; projectTitle: string; updatedAt: string | null }` (vindo do histórico da Dashboard). Sem state → usa o canvas atual da store.
- Layout (handoff #5): container `max-w-[1160px]`; grid 2 colunas desktop (`lg:grid-cols-[1.05fr_1fr]`), 1 coluna mobile.
  - Esquerda: card "PERFIL DE MATURIDADE" + contador `{total}/108`, `MaturityRadar`, legenda das 4 categorias (cor + nome).
  - Direita: 2 mini-cards (Estágio = `maturityStageFromTotal(total)`; Coef. Variação = `metrics.cv`), e card "Notas por dimensão" — lista das 12 dimensões em ordem de `number`: tag "P{number}" (mono, fundo `GROUP_BY_KEY[block.group].color`), `shortLabel`, barra (nota/9 na cor), valor "{nota}/9". Clicar abre `BlockEditModal` (apenas no modo ao vivo — sem snapshot).
  - Abaixo (ambas colunas): `ResultsAnalysis` com `captureRef` apontando para a região radar+notas+análise.
- Editar: `onSave` do modal chama `updateBlock` (só no modo ao vivo). Em modo snapshot, a lista não é clicável.

- [ ] **Step 1: Write the failing test** — `ResultsPage.test.tsx`

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { ResultsPage } from "./ResultsPage";
import { AuthProvider } from "../auth/AuthProvider";
import { useCanvasStore } from "../store/useCanvasStore";

afterEach(() => {
  cleanup();
  useCanvasStore.getState().resetCanvas();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ResultsPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("ResultsPage", () => {
  it("renderiza no shell com radar e Notas por dimensão", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Resultados" })).toBeInTheDocument();
    expect(screen.getByText(/Notas por dimensão/i)).toBeInTheDocument();
    // 12 tags P1..P12
    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getByText("P12")).toBeInTheDocument();
  });
});
```

> A `MaturityRadar` usa chart.js (react-chartjs-2). Se o ambiente de teste reclamar do canvas, msocke `react-chartjs-2` no topo do teste como no `MaturityRadar.test.tsx` (`vi.mock("react-chartjs-2", () => ({ Radar: () => <div /> }))`).

- [ ] **Step 2: Run to verify it fails**

Run: `cd apps/web && npx vitest run src/pages/ResultsPage.test.tsx`
Expected: FAIL — import não resolvido.

- [ ] **Step 3: Implement `ResultsPage.tsx`**

Estrutura (preencher conforme o layout descrito nas Interfaces; reutilizar o padrão de "Notas por dimensão" do handoff):

```tsx
import { useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { BlockEditModal } from "../components/BlockEditModal";
import { MaturityRadar } from "../components/MaturityRadar";
import { ResultsAnalysis } from "../components/ResultsAnalysis";
import { GROUP_BY_KEY, GROUPS, SRL_BLOCKS, SRL_BLOCKS_BY_ID } from "../data/srlBlocks";
import { useCanvasStore } from "../store/useCanvasStore";
import { buildCanvasTitle } from "../utils/canvasIdentity";
import { calculateScoreMetrics, maturityStageFromTotal } from "../utils/score";

interface ResultsSnapshotState {
  scores?: number[];
  projectTitle?: string;
  updatedAt?: string | null;
}

export function ResultsPage() {
  const location = useLocation();
  const snapshot = (location.state as ResultsSnapshotState | null) ?? null;
  const { blocks, meta, darkMode, updateBlock } = useCanvasStore();
  const captureRef = useRef<HTMLDivElement>(null);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);

  const isLive = !snapshot?.scores;
  const scores = useMemo(
    () => snapshot?.scores ?? SRL_BLOCKS.map((block) => blocks[block.id]?.score ?? 0),
    [snapshot, blocks]
  );
  const metrics = useMemo(() => calculateScoreMetrics(scores), [scores]);
  const projectTitle = snapshot?.projectTitle ?? buildCanvasTitle(meta);
  const editingBlock = editingBlockId ? SRL_BLOCKS_BY_ID[editingBlockId] : null;

  return (
    <AppShell title="Resultados">
      <div ref={captureRef} className="mx-auto flex max-w-[1160px] flex-col gap-[18px]">
        <p className="font-display text-[16px] font-bold text-ink">{projectTitle}</p>

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.05fr_1fr]">
          {/* Card radar */}
          <section className="rounded-card border border-stroke bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                Perfil de Maturidade
              </h2>
              <span className="font-mono text-[12px] text-ink-2">{metrics.total}/108</span>
            </div>
            <MaturityRadar scores={scores} darkMode={darkMode} className="mt-3 h-[360px] w-full" />
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {GROUPS.map((group) => (
                <span key={group.key} className="flex items-center gap-1.5 text-[12px] text-ink-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.name}
                </span>
              ))}
            </div>
          </section>

          {/* Coluna direita */}
          <div className="flex flex-col gap-[18px]">
            <div className="grid grid-cols-2 gap-[18px]">
              <MiniCard label="Estágio" value={maturityStageFromTotal(metrics.total)} />
              <MiniCard label="Coef. Variação" value={metrics.cv.toFixed(2)} />
            </div>

            <section className="rounded-card border border-stroke bg-surface p-5 shadow-sm">
              <h2 className="font-display text-[14.5px] font-bold text-ink">Notas por dimensão</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {[...SRL_BLOCKS]
                  .sort((a, b) => a.number - b.number)
                  .map((block) => {
                    const group = GROUP_BY_KEY[block.group];
                    const score = scores[SRL_BLOCKS.indexOf(block)] ?? 0;
                    const Row = isLive ? "button" : "div";
                    return (
                      <li key={block.id}>
                        <Row
                          {...(isLive
                            ? { type: "button", onClick: () => setEditingBlockId(block.id) }
                            : {})}
                          className="flex w-full items-center gap-3 rounded-lg p-1 text-left"
                        >
                          <span
                            className="rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white"
                            style={{ backgroundColor: group.color }}
                          >
                            P{block.number}
                          </span>
                          <span className="w-24 shrink-0 truncate text-[13px] text-ink">
                            {block.shortLabel}
                          </span>
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-inset">
                            <span
                              className="block h-full rounded-full"
                              style={{
                                width: `${(score / 9) * 100}%`,
                                backgroundColor: group.color
                              }}
                            />
                          </span>
                          <span className="w-10 shrink-0 text-right font-mono text-[12px] text-ink-2">
                            {score}/9
                          </span>
                        </Row>
                      </li>
                    );
                  })}
              </ul>
            </section>
          </div>
        </div>

        <ResultsAnalysis
          scores={scores}
          metrics={metrics}
          darkMode={darkMode}
          captureRef={captureRef}
        />
      </div>

      {isLive && editingBlock && (
        <BlockEditModal
          key={editingBlock.id}
          block={editingBlock}
          value={blocks[editingBlock.id]}
          onClose={() => setEditingBlockId(null)}
          onSave={(value) => updateBlock(editingBlock.id, value)}
        />
      )}
    </AppShell>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-stroke bg-surface p-4 shadow-sm">
      <p className="text-[12px] text-ink-3">{label}</p>
      <p className="mt-1 font-display text-[18px] font-bold text-ink">{value}</p>
    </div>
  );
}
```

> Nota: `score` por bloco usa `scores[SRL_BLOCKS.indexOf(block)]` porque `scores` segue a ordem de `SRL_BLOCKS` (não a ordem `number`). Mantenha essa correspondência.

- [ ] **Step 4: Run to verify it passes**

Run: `cd apps/web && npx vitest run src/pages/ResultsPage.test.tsx`
Expected: PASS. (Se chart.js reclamar, adicione o mock de `react-chartjs-2` ao teste.)

- [ ] **Step 5: Lint + commit**

```bash
cd apps/web && npm run lint
git add apps/web/src/pages/ResultsPage.tsx apps/web/src/pages/ResultsPage.test.tsx
git commit -m "feat(web): tela Resultados (/results) com radar, notas por dimensão e análises"
```

---

### Task 4: Rota `/results`, navegação do shell e remoção do modal no Canvas

**Files:**

- Modify: `apps/web/src/App.tsx` (adicionar rota protegida `/results` → `ResultsPage`, lazy)
- Modify: `apps/web/src/components/AppShell.tsx` (item "Resultados" → `/results`)
- Modify: `apps/web/src/pages/CanvasPage.tsx` (botão "Ver Resultados" passa a `navigate("/results")`; remover `ResultsModal` import/uso e o estado `isResultsOpen`)
- Modify: `apps/web/src/pages/CanvasPage.test.tsx` se necessário (não deve quebrar; o teste atual não aciona "Ver Resultados")

**Interfaces:**

- Consumes: `ResultsPage` (Task 3).
- AppShell `NAV_ITEMS`: trocar o item Resultados `{ to: "/canvas", label: "Resultados", ... }` por `{ to: "/results", label: "Resultados", icon: "radar" }`.

- [ ] **Step 1: Write/adjust failing test** — adicionar a `CanvasPage.test.tsx` (com router):

```tsx
it("o botão Ver Resultados aponta para navegação (não abre modal)", () => {
  renderPage();
  const botao = screen.getByRole("button", { name: /Ver Resultados/i });
  expect(botao).toBeInTheDocument();
  // não deve existir diálogo de resultados aberto na tela inicial
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
```

(Use o `renderPage` já existente no arquivo, que envolve em `MemoryRouter` + `AuthProvider`.)

- [ ] **Step 2: Run to verify current state**

Run: `cd apps/web && npx vitest run src/pages/CanvasPage.test.tsx`
Expected: o novo teste passa se o botão existe; o objetivo é garantir que após a mudança continue sem abrir modal.

- [ ] **Step 3: Add route in `App.tsx`**

Após o bloco `lazy(... CanvasPage ...)` adicionar:

```tsx
const ResultsPage = lazy(() =>
  import("./pages/ResultsPage").then((module) => ({ default: module.ResultsPage }))
);
```

E entre as rotas `/canvas` e `/canvas/new` (ou após `/canvas`) adicionar:

```tsx
<Route
  element={
    <ProtectedRoute>
      <ResultsPage />
    </ProtectedRoute>
  }
  path="/results"
/>
```

- [ ] **Step 4: Point shell nav to `/results`** — em `AppShell.tsx`, no array `NAV_ITEMS`, trocar a linha do item "Resultados" para `{ to: "/results", label: "Resultados", icon: "radar" }`.

- [ ] **Step 5: Rewire Canvas "Ver Resultados"** — em `CanvasPage.tsx`:
  - Importar `useNavigate` de `react-router-dom`; `const navigate = useNavigate();`.
  - Remover `import { ResultsModal }`, o estado `const [isResultsOpen, setIsResultsOpen] = useState(false);` e o bloco `{isResultsOpen && <ResultsModal ... />}`.
  - O `onClick` do botão "Ver Resultados" passa a `() => navigate("/results")`.
  - Remover imports agora órfãos (`ResultsModal`, e `darkMode`/`buildCanvasTitle` se ficarem sem uso — verificar; `scores`/`metrics` ainda usados no Total).

- [ ] **Step 6: Run tests + lint + tsc**

Run: `cd apps/web && npx vitest run src/pages/CanvasPage.test.tsx && npm run lint && npx tsc --noEmit`
Expected: PASS / clean. (ResultsModal ainda existe e é usado pela Dashboard antiga — não removê-lo nesta task.)

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/App.tsx apps/web/src/components/AppShell.tsx apps/web/src/pages/CanvasPage.tsx apps/web/src/pages/CanvasPage.test.tsx
git commit -m "feat(web): rota /results, nav do shell e Ver Resultados sem modal no Canvas"
```

---

### Task 5: Redesign da `DashboardPage` (AppShell + hero + métricas + funções preservadas)

**Files:**

- Modify: `apps/web/src/pages/DashboardPage.tsx` (reescrita do render; remover `AppHeader`/`FooterNav`/`ResultsModal`)
- Create: `apps/web/src/pages/DashboardPage.test.tsx`
- Delete: `apps/web/src/components/ResultsModal.tsx` (após Dashboard parar de usá-lo; confirmar que nada mais importa — só Dashboard usava)

**Interfaces:**

- Consumes: `AppShell`; `useNavigate`; toda a lógica existente da Dashboard (history/comparison via `canvasHistory`, `listCanvasesByUser`, `calculateScoreMetrics`, `maturityStageFromTotal`, `buildCanvasTitle`, `ResearchOpinionPanel`, `AboutSrlCanvasModal`).
- "Ver Resultados" (canvas atual) → `navigate("/results")`. "Ver Resultados" de um item de histórico → `navigate("/results", { state: { scores: entry.scores, projectTitle: entry.title, updatedAt: entry.updatedAt } })`.
- Layout: container `max-w-[1080px]` em coluna (gap 18). Hero card `bg-hero` (raio hero), texto branco: rótulo "CANVAS ATUAL", H1 `{currentCanvasTitle}` (Archivo 800), pill "Estágio: {stage}" (ponto teal + branco 10%), barra de progresso branca 14% com preenchimento `linear-gradient(90deg,var(--teal),#4FE0CE)`, contador mono `[{total} / 108] — {filled}/12 blocos`, botão branco "Ver Resultados" (texto `text-hero`). 3 cards de métrica (Scorecard de Risco — número `text-teal`; Coef. Variação; Progresso = `{filled}/12`), grid auto-fit. Card "Ações" (primário "Abrir Meu SRL Canvas" → /canvas; outline "Novo SRL Canvas" → /canvas/new). Cards "Sobre o Projeto" e "Material de Apoio" (downloads). **Preservar re-estilizado:** `ResearchOpinionPanel`, "Status de Sincronização", "Histórico e Comparativo Temporal" (toda a lógica/JSX, trocando classes antigas por tokens novos).
- Remover `AppHeader`, `FooterNav` e `ResultsModal` da Dashboard. Manter funções `formatDateTime`, `hasMeaningfulComparisonDelta`, `formatSignedNumber`.

- [ ] **Step 1: Write the failing test** — `DashboardPage.test.tsx`

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { DashboardPage } from "./DashboardPage";
import { AuthProvider } from "../auth/AuthProvider";

afterEach(() => cleanup());

describe("DashboardPage", () => {
  it("renderiza no shell com hero, métricas e ações", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("CANVAS ATUAL")).toBeInTheDocument();
    expect(screen.getByText("Scorecard de Risco")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir Meu SRL Canvas/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd apps/web && npx vitest run src/pages/DashboardPage.test.tsx`
Expected: FAIL (UI antiga não tem "CANVAS ATUAL" em caixa alta nem heading "Dashboard" no shell — o AppHeader rende "Dashboard" como h1? Confirme; ajuste a asserção para um texto exclusivo do novo layout, ex.: `screen.getByText("CANVAS ATUAL")`, se necessário).

- [ ] **Step 3: Rewrite `DashboardPage.tsx` render** — manter todo o bloco de lógica/efeitos/`useMemo` atual (linhas 37–112) e as funções auxiliares; trocar o `return (...)` para o novo layout com `AppShell title="Dashboard"`, hero `bg-hero`, métricas, ações, sobre/material, e as seções preservadas (opinião, sync, histórico) re-estilizadas com tokens novos. Trocar os dois pontos onde hoje faz `setResultsPayload({...})` por `navigate("/results", { state: {...} })` (canvas atual sem state; itens de histórico com `state`). Remover `resultsPayload` state, `ResultsModal`, `AppHeader`, `FooterNav` e `darkMode` (se ficar sem uso).

  (O JSX completo segue o padrão dos cards das demais telas; preserve textos e dados exatamente como no arquivo atual, apenas re-estilizando.)

- [ ] **Step 4: Delete `ResultsModal.tsx`** — após remover o uso na Dashboard, confirmar que nenhum arquivo importa mais `ResultsModal`:

Run: `cd apps/web && grep -rn "ResultsModal" src || echo "sem referências"`
Se só aparecer no próprio arquivo, remover: `git rm apps/web/src/components/ResultsModal.tsx`.

- [ ] **Step 5: Run tests + lint + tsc**

Run: `cd apps/web && npx vitest run src/pages/DashboardPage.test.tsx && npm run lint && npx tsc --noEmit`
Expected: PASS / clean.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/DashboardPage.tsx apps/web/src/pages/DashboardPage.test.tsx
git rm apps/web/src/components/ResultsModal.tsx
git commit -m "feat(web): redesign Dashboard no AppShell (hero, métricas, histórico) e remoção do ResultsModal"
```

---

### Task 6: Redesign da `AccountPage` (AppShell + seções preservadas)

**Files:**

- Modify: `apps/web/src/pages/AccountPage.tsx` (reescrita do render; remover `AppHeader`/`FooterNav`)
- Create: `apps/web/src/pages/AccountPage.test.tsx`

**Interfaces:**

- Consumes: `AppShell`; toda a lógica atual (perfil/`updateProfile`, tema, sobre, métricas de produto via `productMetrics`, `ResearchOpinionPanel`, `AboutSrlCanvasModal`). Manter handlers (`logout`, `saveProfile`, efeitos) intactos.
- Layout: `AppShell title="Minha Conta"`, container `max-w-[680px]` em coluna (gap 18). Card Perfil (avatar com iniciais + nome/email; inputs `inset`/`stroke`; botões `brand`/outline; feedback). Card Tema (botão outline alterna). Card Sobre. Card "Métricas de Produto (Local)" (preservar dados/JSON, re-estilizar). `ResearchOpinionPanel`.
- Remover `AppHeader` e `FooterNav`.

- [ ] **Step 1: Write the failing test** — `AccountPage.test.tsx`

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { AccountPage } from "./AccountPage";
import { AuthProvider } from "../auth/AuthProvider";

afterEach(() => cleanup());

describe("AccountPage", () => {
  it("renderiza no shell com Perfil e Tema", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AccountPage />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "Minha Conta" })).toBeInTheDocument();
    expect(screen.getByText("Perfil")).toBeInTheDocument();
    expect(screen.getByText("Tema")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd apps/web && npx vitest run src/pages/AccountPage.test.tsx`
Expected: FAIL (o heading "Minha Conta" hoje vem do AppHeader; após o AppShell deve haver heading "Minha Conta"). Ajustar asserção se necessário para um marcador exclusivo do novo layout.

- [ ] **Step 3: Rewrite `AccountPage.tsx` render** — manter todo o bloco de estado/efeitos/handlers (linhas 15–102); trocar o `return (...)` para `AppShell title="Minha Conta"` envolvendo os cards re-estilizados (Perfil, Tema, Sobre, Métricas de Produto, `ResearchOpinionPanel`). Remover `AppHeader`/`FooterNav`. Preservar textos e dados.

- [ ] **Step 4: Run tests + lint + tsc**

Run: `cd apps/web && npx vitest run src/pages/AccountPage.test.tsx && npm run lint && npx tsc --noEmit`
Expected: PASS / clean.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/AccountPage.tsx apps/web/src/pages/AccountPage.test.tsx
git commit -m "feat(web): redesign Minha Conta no AppShell (perfil, tema, métricas)"
```

---

### Task 7: Verificação final

- [ ] **Step 1:** `cd apps/web && npm run test` → todos verdes.
- [ ] **Step 2:** `npm run lint` → limpo.
- [ ] **Step 3:** `npx tsc --noEmit` → limpo.
- [ ] **Step 4:** `npm run build` → sucesso. Depois restaurar `apps/web/dist` (não commitar build): `git checkout HEAD -- apps/web/dist && git clean -fd apps/web/dist`.
- [ ] **Step 5:** Verificação manual (humano): navegar Dashboard → Ver Resultados → /results; menu "Resultados" abre /results; clicar numa nota abre o bloco; tema claro/escuro; mobile (bottom nav).

## Self-review (autor do plano)

- Resultados vira tela (`/results`), sem modal; `ResultsModal` removido → Tasks 3,4,5. ✅
- "Ver Resultados" navega (Canvas Task 4; Dashboard atual+histórico Task 5). ✅
- Radar/análises/export reaproveitados (MaturityRadar T1, ResultsAnalysis T2). ✅
- Dashboard e Conta no AppShell, funções preservadas re-estilizadas (T5, T6). ✅
- Nav "Resultados" → /results (T4). ✅
- Tipos: `MaturityRadarProps`, `ResultsAnalysisProps`, snapshot router state consistentes entre tasks. ✅
