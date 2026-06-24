# Redesign "Meu SRL Canvas" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recriar a tela "Meu SRL Canvas" fiel ao handoff (`new_layout/design_handoff_srl_canvas/README.md`), com fundação de design tokens, app shell, variações Lista/Mural e modal de avaliação redesenhado.

**Architecture:** Tokens de design como variáveis CSS (claro em `:root`, escuro em `.dark`) mapeadas para nomes semânticos no `tailwind.config.ts`. Cores de categoria ficam em `GROUPS` como hex (iguais nos dois temas, tints via rgba). A tela é orquestrada por `CanvasPage`, que envolve o conteúdo no `AppShell` e delega cada variação de layout para `CanvasListView`/`CanvasMuralView`. O modal `BlockEditModal` é reescrito.

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind 3 (`darkMode: "class"`) + Zustand + react-router-dom 7; testes com Vitest + @testing-library/react.

## Global Constraints

- Diretório de trabalho do front: `apps/web`. Comandos `npm`/`vitest` rodam de lá (ou via `pnpm --filter @srl/web`).
- Dark mode é aplicado por um **wrapper div** em `apps/web/src/App.tsx:40` (`<div className={darkMode ? "dark" : ""}>`). Tokens dark devem ser definidos sob o seletor `.dark`. Não migrar para `documentElement`.
- Ícones: **Material Symbols** (`<span className="material-symbols-outlined">nome</span>`). Não adicionar `lucide-react`.
- IDs de blocos (`SRL_BLOCKS[].id`) são imutáveis (chave de storage). Exibição usa `number` (P1–P12).
- Manter os tokens Tailwind antigos (`primary #135bec`, `background-light/dark`, `card-light/dark`, `text-light-*`/`text-dark-*`) — telas legadas ainda os usam.
- `npm run lint` e `npm run test` devem passar ao fim de cada task. Pre-commit hook roda eslint+prettier.
- Cores base (claro / escuro) e de categoria: ver tabela do handoff (copiadas verbatim nas tasks abaixo).
- Score 0/`null` = pendente; score 1–9 = avaliado. Máximo total = 108.

---

### Task 1: Fundação de design tokens

**Files:**

- Create: `apps/web/src/utils/color.ts`
- Create: `apps/web/src/utils/color.test.ts`
- Modify: `apps/web/src/index.css`
- Modify: `apps/web/tailwind.config.ts`
- Modify: `apps/web/src/data/srlBlocks.ts` (adicionar `color` hex a cada grupo em `GROUPS` e ao tipo `GroupMeta`)

**Interfaces:**

- Produces:
  - `withAlpha(hex: string, alpha: number): string` — converte `#RRGGBB` + alpha (0–1) em `rgba(r, g, b, a)`.
  - `GroupMeta.color: string` e `GROUPS[].color` com hex por categoria: `fundacao "#1E5BC6"`, `produtoMercado "#2C9B46"`, `escala "#EA8520"`, `governanca "#4A2D7E"`.
  - Classes utilitárias Tailwind: `bg-app`, `bg-surface`, `bg-surface-2`, `bg-inset`, `border-stroke`, `bg-line`, `text-ink`, `text-ink-2`, `text-ink-3`, `text-teal`/`bg-teal`, `text-navy`, `bg-hero`, `bg-brand`/`text-brand`, `text-brand-fg`; `font-display`, `font-mono`; `shadow`/`shadow-sm`/`shadow-lg`; `animate-pop`.

- [ ] **Step 1: Write the failing test** — `apps/web/src/utils/color.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { withAlpha } from "./color";

describe("withAlpha", () => {
  it("converte hex de 6 dígitos em rgba", () => {
    expect(withAlpha("#1E5BC6", 0.12)).toBe("rgba(30, 91, 198, 0.12)");
  });

  it("aceita hex sem # e clampa alpha", () => {
    expect(withAlpha("2C9B46", 2)).toBe("rgba(44, 155, 70, 1)");
    expect(withAlpha("#EA8520", -1)).toBe("rgba(234, 133, 32, 0)");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/utils/color.test.ts`
Expected: FAIL — `Failed to resolve import "./color"` / `withAlpha is not a function`.

- [ ] **Step 3: Implement `apps/web/src/utils/color.ts`**

```ts
export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const clamped = Math.min(1, Math.max(0, alpha));
  return `rgba(${r}, ${g}, ${b}, ${clamped})`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/utils/color.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Add `color` to `GroupMeta` type and `GROUPS`** — `apps/web/src/data/srlBlocks.ts`

No `interface GroupMeta`, adicionar o campo:

```ts
export interface GroupMeta {
  key: GroupKey;
  name: string;
  subtitle: string;
  detailTitle: string;
  conceptualFocus: string;
  includedBlocks: string;
  /** Hex da categoria (igual nos dois temas) — base de tints rgba. */
  color: string;
  dotClass: string;
  badgeClass: string;
  iconTextClass: string;
  iconBgClass: string;
}
```

Em cada objeto de `GROUPS`, adicionar `color` logo após `includedBlocks`:

- `fundacao`: `color: "#1E5BC6",`
- `produtoMercado`: `color: "#2C9B46",`
- `escala`: `color: "#EA8520",`
- `governanca`: `color: "#4A2D7E",`

- [ ] **Step 6: Update `apps/web/src/index.css`**

Substituir o import da fonte Inter por Archivo/IBM Plex (manter o import de Material Symbols) e adicionar tokens + keyframes. Resultado do arquivo:

```css
@import url("https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200");

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  --bg: #edf0f4;
  --surface: #ffffff;
  --surface-2: #f5f7fa;
  --inset: #f0f3f7;
  --border: #e4e8ee;
  --line: #edf0f4;
  --text: #16202e;
  --text-2: #586271;
  --text-3: #8a95a4;
  --teal: #0f7e7c;
  --navy: #16224f;
  --hero: #16224f;
  --primary: #16224f;
  --primary-text: #ffffff;

  --shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 4px 14px rgba(16, 24, 40, 0.05);
  --shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.06);
  --shadow-lg: 0 18px 50px rgba(16, 24, 40, 0.18);
}

.dark {
  --bg: #070b16;
  --surface: #101829;
  --surface-2: #0c1322;
  --inset: #0b1322;
  --border: #22304a;
  --line: #1b2740;
  --text: #e9eef6;
  --text-2: #9daac0;
  --text-3: #67748c;
  --teal: #2dc7b6;
  --navy: #ffffff;
  --hero: #0e1733;
  --primary: #15b8a6;
  --primary-text: #05221e;

  --shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 24px 60px rgba(0, 0, 0, 0.6);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: max(884px, 100dvh);
  font-family: "IBM Plex Sans", system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
}

.material-symbols-outlined {
  font-variation-settings:
    "FILL" 0,
    "wght" 400,
    "GRAD" 0,
    "opsz" 24;
}

@keyframes pop {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@layer utilities {
  .animate-pop {
    animation: pop 0.26s cubic-bezier(0.2, 0.8, 0.3, 1);
  }
}
```

- [ ] **Step 7: Update `apps/web/tailwind.config.ts`**

Estender `theme.extend` mantendo os tokens antigos. Substituir o objeto `config` por:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // tokens antigos (telas legadas) — manter
        primary: "#135bec",
        "background-light": "#f6f6f8",
        "background-dark": "#101622",
        "card-light": "#ffffff",
        "card-dark": "#1a2230",
        "text-light-primary": "#111318",
        "text-dark-primary": "#f0f2f4",
        "text-light-secondary": "#616f89",
        "text-dark-secondary": "#909cb5",
        // novos tokens do redesign (CSS vars)
        app: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        inset: "var(--inset)",
        stroke: "var(--border)",
        line: "var(--line)",
        ink: "var(--text)",
        "ink-2": "var(--text-2)",
        "ink-3": "var(--text-3)",
        teal: "var(--teal)",
        navy: "var(--navy)",
        hero: "var(--hero)",
        brand: "var(--primary)",
        "brand-fg": "var(--primary-text)"
      },
      fontFamily: {
        display: ["Archivo", "system-ui", "sans-serif"],
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"]
      },
      boxShadow: {
        DEFAULT: "var(--shadow)",
        sm: "var(--shadow-sm)",
        lg: "var(--shadow-lg)"
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        card: "14px",
        hero: "20px",
        modal: "18px",
        full: "9999px"
      }
    }
  },
  plugins: []
};

export default config;
```

- [ ] **Step 8: Verify build + lint**

Run: `cd apps/web && npx vitest run src/utils/color.test.ts && npm run lint`
Expected: testes PASS; lint sem erros.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/utils/color.ts apps/web/src/utils/color.test.ts apps/web/src/index.css apps/web/tailwind.config.ts apps/web/src/data/srlBlocks.ts
git commit -m "feat(web): fundação de design tokens (CSS vars, fontes, cores de categoria)"
```

---

### Task 2: Helper de preferência de layout

**Files:**

- Create: `apps/web/src/utils/layoutPreference.ts`
- Create: `apps/web/src/utils/layoutPreference.test.ts`

**Interfaces:**

- Consumes: nada.
- Produces:
  - `type CanvasLayout = "lista" | "mural"`
  - `LAYOUT_STORAGE_KEY = "srl-canvas-layout-v1"`
  - `readLayoutPreference(): CanvasLayout` (default `"lista"`)
  - `writeLayoutPreference(layout: CanvasLayout): void`

- [ ] **Step 1: Write the failing test** — `apps/web/src/utils/layoutPreference.test.ts`

```ts
import { afterEach, describe, expect, it } from "vitest";
import {
  LAYOUT_STORAGE_KEY,
  readLayoutPreference,
  writeLayoutPreference
} from "./layoutPreference";

afterEach(() => {
  window.localStorage.clear();
});

describe("layoutPreference", () => {
  it("retorna 'lista' por padrão", () => {
    expect(readLayoutPreference()).toBe("lista");
  });

  it("persiste e lê 'mural'", () => {
    writeLayoutPreference("mural");
    expect(window.localStorage.getItem(LAYOUT_STORAGE_KEY)).toBe("mural");
    expect(readLayoutPreference()).toBe("mural");
  });

  it("ignora valor inválido e cai no default", () => {
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, "xpto");
    expect(readLayoutPreference()).toBe("lista");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/utils/layoutPreference.test.ts`
Expected: FAIL — import não resolvido.

- [ ] **Step 3: Implement `apps/web/src/utils/layoutPreference.ts`**

```ts
export type CanvasLayout = "lista" | "mural";

export const LAYOUT_STORAGE_KEY = "srl-canvas-layout-v1";

export function readLayoutPreference(): CanvasLayout {
  if (typeof window === "undefined") return "lista";
  return window.localStorage.getItem(LAYOUT_STORAGE_KEY) === "mural" ? "mural" : "lista";
}

export function writeLayoutPreference(layout: CanvasLayout): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/utils/layoutPreference.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/utils/layoutPreference.ts apps/web/src/utils/layoutPreference.test.ts
git commit -m "feat(web): helper de persistência da preferência de layout do canvas"
```

---

### Task 3: `CanvasListView` (variação Lista, agrupada por categoria)

**Files:**

- Create: `apps/web/src/components/CanvasListView.tsx`
- Create: `apps/web/src/components/CanvasListView.test.tsx`

**Interfaces:**

- Consumes: `SRL_BLOCKS`, `GROUPS`, `GROUP_BY_KEY` de `../data/srlBlocks`; `withAlpha` de `../utils/color`; tipos de `../types`.
- Produces:

  ```ts
  interface CanvasListViewProps {
    blockState: Record<number, CanvasBlockState>;
    onSelectBlock: (id: number) => void;
  }
  export function CanvasListView(props: CanvasListViewProps): JSX.Element;
  ```

- [ ] **Step 1: Write the failing test** — `apps/web/src/components/CanvasListView.test.tsx`

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CanvasListView } from "./CanvasListView";
import { GROUPS, SRL_BLOCKS } from "../data/srlBlocks";

const emptyState = SRL_BLOCKS.reduce<
  Record<number, { score: null; notes: string; evidence: string }>
>((acc, block) => {
  acc[block.id] = { score: null, notes: "", evidence: "" };
  return acc;
}, {});

describe("CanvasListView", () => {
  it("renderiza os 4 cabeçalhos de categoria e os 12 blocos", () => {
    render(<CanvasListView blockState={emptyState} onSelectBlock={() => {}} />);
    for (const group of GROUPS) {
      expect(screen.getByText(group.name)).toBeInTheDocument();
    }
    // 12 blocos => 12 botões de bloco
    expect(screen.getAllByRole("button")).toHaveLength(SRL_BLOCKS.length);
  });

  it("mostra 'Pendente' sem score e 'Nível n' com score", () => {
    const withScore = { ...emptyState, 1: { score: 4, notes: "", evidence: "" } };
    render(<CanvasListView blockState={withScore} onSelectBlock={() => {}} />);
    expect(screen.getByText("Nível 4")).toBeInTheDocument();
    expect(screen.getAllByText("Pendente").length).toBe(SRL_BLOCKS.length - 1);
  });

  it("chama onSelectBlock com o id do bloco ao clicar", () => {
    const onSelect = vi.fn();
    render(<CanvasListView blockState={emptyState} onSelectBlock={onSelect} />);
    fireEvent.click(screen.getByText(/Problema \/ Oportunidade/).closest("button")!);
    expect(onSelect).toHaveBeenCalledWith(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/components/CanvasListView.test.tsx`
Expected: FAIL — import não resolvido.

- [ ] **Step 3: Implement `apps/web/src/components/CanvasListView.tsx`**

```tsx
import { GROUP_BY_KEY, GROUPS, SRL_BLOCKS } from "../data/srlBlocks";
import type { CanvasBlockState } from "../types";
import { withAlpha } from "../utils/color";

interface CanvasListViewProps {
  blockState: Record<number, CanvasBlockState>;
  onSelectBlock: (id: number) => void;
}

export function CanvasListView({ blockState, onSelectBlock }: CanvasListViewProps) {
  return (
    <div className="flex flex-col gap-6">
      {GROUPS.map((group) => {
        const blocks = SRL_BLOCKS.filter((block) => block.group === group.key).sort(
          (a, b) => a.number - b.number
        );

        return (
          <section key={group.key}>
            <div className="mb-3 flex items-center gap-3">
              <span
                className="block h-[34px] w-[5px] rounded-full"
                style={{ backgroundColor: group.color }}
              />
              <div>
                <h3 className="font-display text-[13.5px] font-bold" style={{ color: group.color }}>
                  {group.name}
                </h3>
                <p className="text-[11.5px] text-ink-3">{group.subtitle}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {blocks.map((block) => {
                const current = blockState[block.id];
                const hasScore = typeof current?.score === "number";

                return (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => onSelectBlock(block.id)}
                    className="flex w-full items-center gap-4 rounded-card border border-stroke bg-surface px-[17px] py-[15px] text-left shadow-sm transition hover:-translate-y-0.5"
                  >
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: withAlpha(group.color, 0.12) }}
                    >
                      <span
                        className="material-symbols-outlined text-2xl"
                        style={{ color: group.color }}
                      >
                        {block.icon}
                      </span>
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-display text-[14.5px] font-bold text-ink">
                        <span style={{ color: group.color }}>{block.number}.</span> {block.name}
                      </span>
                      <span className="truncate text-[12.5px] text-ink-2">{block.objective}</span>
                    </span>

                    <span
                      className="shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold"
                      style={
                        hasScore
                          ? { backgroundColor: group.color, color: "#ffffff" }
                          : {
                              border: `1px solid ${withAlpha(group.color, 0.4)}`,
                              color: group.color
                            }
                      }
                    >
                      {hasScore ? `Nível ${current.score}` : "Pendente"}
                    </span>
                    <span className="material-symbols-outlined shrink-0 text-ink-3">
                      chevron_right
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// re-export evita import não usado de GROUP_BY_KEY caso ferramentas reclamem
void GROUP_BY_KEY;
```

> Nota: se o lint acusar `GROUP_BY_KEY` não usado, remova-o do import e a linha `void GROUP_BY_KEY;`. O import canônico é `{ GROUPS, SRL_BLOCKS }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/components/CanvasListView.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Lint + commit**

```bash
cd apps/web && npm run lint
git add apps/web/src/components/CanvasListView.tsx apps/web/src/components/CanvasListView.test.tsx
git commit -m "feat(web): variação Lista do canvas agrupada por categoria"
```

---

### Task 4: `CanvasMuralView` (variação Mural)

**Files:**

- Create: `apps/web/src/components/CanvasMuralView.tsx`
- Create: `apps/web/src/components/CanvasMuralView.test.tsx`

**Interfaces:**

- Consumes: `SRL_BLOCKS`, `GROUP_BY_KEY` de `../data/srlBlocks`; tipos de `../types`.
- Produces:

  ```ts
  interface CanvasMuralViewProps {
    blockState: Record<number, CanvasBlockState>;
    onSelectBlock: (id: number) => void;
  }
  export function CanvasMuralView(props: CanvasMuralViewProps): JSX.Element;
  ```

- [ ] **Step 1: Write the failing test** — `apps/web/src/components/CanvasMuralView.test.tsx`

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CanvasMuralView } from "./CanvasMuralView";
import { SRL_BLOCKS } from "../data/srlBlocks";

const emptyState = SRL_BLOCKS.reduce<
  Record<number, { score: null; notes: string; evidence: string }>
>((acc, block) => {
  acc[block.id] = { score: null, notes: "", evidence: "" };
  return acc;
}, {});

describe("CanvasMuralView", () => {
  it("renderiza 12 cards com contador n/9", () => {
    const withScore = { ...emptyState, 1: { score: 1, notes: "", evidence: "" } };
    render(<CanvasMuralView blockState={withScore} onSelectBlock={() => {}} />);
    expect(screen.getAllByRole("button")).toHaveLength(SRL_BLOCKS.length);
    expect(screen.getByText("1/9")).toBeInTheDocument();
    expect(screen.getAllByText("0/9").length).toBe(SRL_BLOCKS.length - 1);
  });

  it("chama onSelectBlock ao clicar num card", () => {
    const onSelect = vi.fn();
    render(<CanvasMuralView blockState={emptyState} onSelectBlock={onSelect} />);
    fireEvent.click(screen.getByText(/Problema \/ Oportunidade/).closest("button")!);
    expect(onSelect).toHaveBeenCalledWith(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/components/CanvasMuralView.test.tsx`
Expected: FAIL — import não resolvido.

- [ ] **Step 3: Implement `apps/web/src/components/CanvasMuralView.tsx`**

```tsx
import { GROUP_BY_KEY, SRL_BLOCKS } from "../data/srlBlocks";
import type { CanvasBlockState } from "../types";

interface CanvasMuralViewProps {
  blockState: Record<number, CanvasBlockState>;
  onSelectBlock: (id: number) => void;
}

export function CanvasMuralView({ blockState, onSelectBlock }: CanvasMuralViewProps) {
  const blocks = [...SRL_BLOCKS].sort((a, b) => a.number - b.number);

  return (
    <div
      className="grid gap-[13px]"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
    >
      {blocks.map((block) => {
        const group = GROUP_BY_KEY[block.group];
        const score = blockState[block.id]?.score ?? 0;

        return (
          <button
            key={block.id}
            type="button"
            onClick={() => onSelectBlock(block.id)}
            className="flex min-h-[148px] flex-col overflow-hidden rounded-card bg-surface p-0 text-left shadow"
          >
            <span
              className="flex items-center justify-between px-[14px] py-[11px]"
              style={{ backgroundColor: group.color, borderRadius: "14px 14px 0 0" }}
            >
              <span className="material-symbols-outlined text-xl text-white">{block.icon}</span>
              <span className="font-display text-[12px] font-bold text-white">P{block.number}</span>
            </span>

            <span className="flex flex-1 flex-col px-[15px] py-[13px]">
              <span className="font-display text-[14px] font-bold text-ink">{block.name}</span>
              <span className="mt-1 line-clamp-2 text-[11.5px] text-ink-3">{block.objective}</span>

              <span className="mt-auto flex items-center gap-2 pt-3">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-inset">
                  <span
                    className="block h-full rounded-full transition-all"
                    style={{ width: `${(score / 9) * 100}%`, backgroundColor: group.color }}
                  />
                </span>
                <span className="font-mono text-[11.5px] text-ink-2">{score}/9</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/components/CanvasMuralView.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Lint + commit**

```bash
cd apps/web && npm run lint
git add apps/web/src/components/CanvasMuralView.tsx apps/web/src/components/CanvasMuralView.test.tsx
git commit -m "feat(web): variação Mural do canvas (cards verticais por categoria)"
```

---

### Task 5: Redesenho do `BlockEditModal`

**Files:**

- Modify: `apps/web/src/components/BlockEditModal.tsx` (reescrita do componente)
- Create: `apps/web/src/components/BlockEditModal.test.tsx`

**Interfaces:**

- Consumes: `useDialogA11y<HTMLButtonElement>(true)` → `{ dialogRef, initialFocusRef }`; `GROUP_BY_KEY` de `../data/srlBlocks`; `withAlpha` de `../utils/color`; tipos `CanvasBlockDefinition`, `CanvasBlockState`.
- Produces (nova assinatura — **remover** `onSaveAndNext`/`showSaveAndNext`):

  ```ts
  interface BlockEditModalProps {
    block: CanvasBlockDefinition;
    value: CanvasBlockState;
    onClose: () => void;
    onSave: (value: CanvasBlockState) => void;
  }
  export function BlockEditModal(props: BlockEditModalProps): JSX.Element;
  ```

- [ ] **Step 1: Write the failing test** — `apps/web/src/components/BlockEditModal.test.tsx`

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BlockEditModal } from "./BlockEditModal";
import { SRL_BLOCKS_BY_ID } from "../data/srlBlocks";

const block = SRL_BLOCKS_BY_ID[1];
const emptyValue = { score: null, notes: "", evidence: "" };

describe("BlockEditModal", () => {
  it("exibe título Pn · nome e o objetivo", () => {
    render(
      <BlockEditModal block={block} value={emptyValue} onClose={() => {}} onSave={() => {}} />
    );
    expect(screen.getByText(`P${block.number} · ${block.name}`)).toBeInTheDocument();
    expect(screen.getByText(block.objective)).toBeInTheDocument();
  });

  it("selecionar um nível aplica imediatamente via onSave", () => {
    const onSave = vi.fn();
    render(<BlockEditModal block={block} value={emptyValue} onClose={() => {}} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Selecionar nível 5" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ score: 5 }));
  });

  it("mostra a descrição do nível selecionado e oculta 'Para avançar' no nível 9", () => {
    render(
      <BlockEditModal
        block={block}
        value={{ ...emptyValue, score: 9 }}
        onClose={() => {}}
        onSave={() => {}}
      />
    );
    expect(screen.getByText(block.levels[8].description)).toBeInTheDocument();
    expect(screen.queryByText(/PARA AVANÇAR/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/components/BlockEditModal.test.tsx`
Expected: FAIL — texto/roles antigos não batem (botões de nível com `aria-label` "Selecionar nível n" ainda não existem).

- [ ] **Step 3: Reescrever `apps/web/src/components/BlockEditModal.tsx`**

```tsx
import { useEffect, useMemo, useState } from "react";
import { GROUP_BY_KEY } from "../data/srlBlocks";
import { useDialogA11y } from "../hooks/useDialogA11y";
import type { CanvasBlockDefinition, CanvasBlockState } from "../types";
import { withAlpha } from "../utils/color";

interface BlockEditModalProps {
  block: CanvasBlockDefinition;
  value: CanvasBlockState;
  onClose: () => void;
  onSave: (value: CanvasBlockState) => void;
}

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function BlockEditModal({ block, value, onClose, onSave }: BlockEditModalProps) {
  const group = GROUP_BY_KEY[block.group];
  const [score, setScore] = useState<number | null>(value.score);
  const [evidence, setEvidence] = useState(value.evidence);
  const { dialogRef, initialFocusRef } = useDialogA11y<HTMLButtonElement>(true);

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const selectedDescription = useMemo(
    () => (score ? block.levels[score - 1]?.description : null),
    [block.levels, score]
  );
  const nextDescription = score && score < 9 ? block.levels[score]?.description : null;

  const applyLevel = (level: number) => {
    setScore(level);
    // aplica imediatamente, preservando notes/evidence atuais
    onSave({ score: level, notes: value.notes, evidence });
  };

  const save = () => {
    onSave({ score, notes: value.notes, evidence: evidence.trim() });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center overflow-y-auto px-4 py-[5vh]"
      style={{ background: "rgba(8,12,22,.5)", backdropFilter: "blur(3px)" }}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Avaliar ${block.name}`}
        className="animate-pop h-fit w-full max-w-[620px] overflow-hidden rounded-modal bg-surface shadow-lg"
      >
        <header
          className="flex items-start justify-between gap-3 px-5 py-4"
          style={{ backgroundColor: group.color, borderRadius: "18px 18px 0 0" }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex size-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: "rgba(255,255,255,.18)" }}
            >
              <span className="material-symbols-outlined text-white">{block.icon}</span>
            </span>
            <div>
              <p className="font-display text-[17px] font-extrabold text-white">
                P{block.number} · {block.name}
              </p>
              <p className="text-[11.5px] text-white/80">{group.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-9 items-center justify-center rounded-lg text-white/90 hover:bg-white/15"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="max-h-[64vh] overflow-y-auto px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Objetivo</p>
          <p className="mt-1 text-[13.5px] text-ink">{block.objective}</p>

          <ul className="mt-4 space-y-2">
            {block.questions.map((question) => (
              <li key={question} className="flex gap-2 text-[13px] text-ink-2">
                <span className="material-symbols-outlined text-base text-ink-3">help</span>
                {question}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-ink">Nível de maturidade</p>
            <span
              className="rounded-full px-3 py-1 text-[12px] font-semibold text-white"
              style={{ backgroundColor: group.color }}
            >
              Nível {score ?? 0}/9
            </span>
          </div>

          <div className="mt-3 grid grid-cols-9 gap-2">
            {LEVELS.map((level) => {
              const isSelected = score === level;
              const isAchieved = score !== null && level <= score;
              const buttonStyle = isSelected
                ? { backgroundColor: group.color, color: "#ffffff" }
                : isAchieved
                  ? { backgroundColor: withAlpha(group.color, 0.12), color: group.color }
                  : undefined;

              return (
                <button
                  key={level}
                  ref={level === 1 ? initialFocusRef : undefined}
                  type="button"
                  aria-label={`Selecionar nível ${level}`}
                  aria-pressed={isSelected}
                  onClick={() => applyLevel(level)}
                  className={`flex h-10 items-center justify-center rounded-lg font-display text-[14px] font-bold ${
                    buttonStyle ? "" : "border border-stroke bg-inset text-ink-2"
                  }`}
                  style={buttonStyle}
                >
                  {level}
                </button>
              );
            })}
          </div>

          {selectedDescription && (
            <div
              className="mt-4 rounded-xl p-3 text-[13px] text-ink"
              style={{
                backgroundColor: withAlpha(group.color, 0.09),
                border: `1px solid ${withAlpha(group.color, 0.18)}`
              }}
            >
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                Descrição do nível {score}
              </p>
              {selectedDescription}
            </div>
          )}

          {nextDescription && (
            <div className="mt-3 rounded-xl border border-dashed border-stroke p-3 text-[13px] text-ink-2">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                Para avançar ao nível {(score ?? 0) + 1}
              </p>
              {nextDescription}
            </div>
          )}

          <label className="mt-5 block">
            <span className="block text-[12px] font-semibold text-ink-2">Evidências</span>
            <textarea
              className="mt-1 min-h-[90px] w-full rounded-lg border border-stroke bg-inset p-3 text-[13px] text-ink"
              value={evidence}
              onChange={(event) => setEvidence(event.target.value)}
              placeholder="Links, documentos, métricas que comprovam o nível."
            />
          </label>
        </div>

        <footer className="flex justify-end gap-2 border-t border-stroke px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stroke px-4 py-2 text-[13px] font-semibold text-ink-2"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            className="flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-brand-fg"
          >
            <span className="material-symbols-outlined text-base">check</span>
            Salvar
          </button>
        </footer>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/components/BlockEditModal.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Lint + commit**

```bash
cd apps/web && npm run lint
git add apps/web/src/components/BlockEditModal.tsx apps/web/src/components/BlockEditModal.test.tsx
git commit -m "feat(web): redesenho do modal de avaliação do bloco (handoff)"
```

---

### Task 6: `AppShell` + `BrandLockup`

**Files:**

- Create: `apps/web/src/components/BrandLockup.tsx`
- Create: `apps/web/src/components/AppShell.tsx`
- Create: `apps/web/src/components/AppShell.test.tsx`

**Interfaces:**

- Consumes: `useCanvasStore` (`darkMode`, `toggleDarkMode`); `useAuth` (`signOut`); `useNavigate`, `NavLink` de react-router-dom; `GROUPS` de `../data/srlBlocks`.
- Produces:
  ```ts
  export function BrandLockup(): JSX.Element;
  interface AppShellProps {
    title: string;
    children: React.ReactNode;
  }
  export function AppShell(props: AppShellProps): JSX.Element;
  ```
- Itens de nav (rotas existentes): `/dashboard` (Dashboard, `grid_view`), `/canvas` (Meu Canvas, `view_week`), `/results` → **usar `/canvas`** pois Resultados é modal (label "Resultados", `radar`, link para `/canvas`), `/account` (Minha Conta, `person`). Botão "Novo SRL Canvas" → `/canvas/new`.

> Observação: a tela "Resultados" ainda é um modal aberto dentro do Canvas (não há rota dedicada). O item de nav "Resultados" aponta para `/canvas` nesta fatia; rota dedicada fica para fatia futura.

- [ ] **Step 1: Write the failing test** — `apps/web/src/components/AppShell.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppShell } from "./AppShell";
import { AuthProvider } from "../auth/AuthProvider";

function renderShell() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AppShell title="Meu SRL Canvas">
          <p>conteúdo</p>
        </AppShell>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("AppShell", () => {
  it("renderiza título, marca, nav e o conteúdo", () => {
    renderShell();
    expect(screen.getByRole("heading", { name: "Meu SRL Canvas" })).toBeInTheDocument();
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Meu Canvas/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Novo SRL Canvas/ })).toBeInTheDocument();
  });

  it("tem botões de tema e sair", () => {
    renderShell();
    expect(screen.getByRole("button", { name: /tema/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
  });
});
```

> Se `AuthProvider` exigir props/env, ajuste o wrapper para o mesmo padrão usado em outros testes de página (ver `src/pages/ResearchSurveyPage.test.tsx`). O objetivo do teste é só montar o shell.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/components/AppShell.test.tsx`
Expected: FAIL — import não resolvido.

- [ ] **Step 3: Implement `apps/web/src/components/BrandLockup.tsx`**

```tsx
import { GROUPS } from "../data/srlBlocks";

export function BrandLockup() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-[34px] grid-cols-2 gap-[3px]">
        {GROUPS.map((group) => (
          <span
            key={group.key}
            className="rounded-[5px]"
            style={{ backgroundColor: group.color }}
          />
        ))}
      </div>
      <div className="leading-none">
        <p className="font-display text-[20px] font-extrabold text-navy">SRL</p>
        <p className="font-display text-[10px] font-semibold tracking-[3.5px] text-teal">CANVAS</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement `apps/web/src/components/AppShell.tsx`**

```tsx
import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useCanvasStore } from "../store/useCanvasStore";
import { BrandLockup } from "./BrandLockup";

interface AppShellProps {
  title: string;
  children: ReactNode;
}

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "grid_view" },
  { to: "/canvas", label: "Meu Canvas", icon: "view_week" },
  { to: "/canvas", label: "Resultados", icon: "radar" },
  { to: "/account", label: "Minha Conta", icon: "person" }
];

export function AppShell({ title, children }: AppShellProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const darkMode = useCanvasStore((state) => state.darkMode);
  const toggleDarkMode = useCanvasStore((state) => state.toggleDarkMode);

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const sidebarLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-semibold transition ${
      isActive ? "bg-surface-2 text-ink dark:bg-inset" : "text-ink-2 hover:bg-surface-2"
    }`;

  return (
    <div className="min-h-screen bg-app font-sans text-ink">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-stroke bg-surface px-4 py-5 lg:flex">
        <BrandLockup />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.label} to={item.to} className={sidebarLinkClass} end>
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/canvas/new"
            className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-[14px] font-semibold text-brand-fg"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Novo SRL Canvas
          </NavLink>
        </nav>
        <div className="mt-auto flex items-center gap-3 border-t border-stroke pt-4">
          <span className="flex size-9 items-center justify-center rounded-full bg-surface-2 font-display text-[13px] font-bold text-ink">
            MS
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold text-ink">Minha Startup</p>
            <p className="text-[11px] text-ink-3">Plano de avaliação</p>
          </div>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="lg:pl-64">
        <header
          className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-stroke px-4"
          style={{
            backgroundColor: "color-mix(in srgb, var(--surface) 86%, transparent)",
            backdropFilter: "blur(10px)"
          }}
        >
          <h1 className="font-display text-[17px] font-bold text-ink">{title}</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label="Alternar tema"
              className="flex size-[38px] items-center justify-center rounded-[10px] border border-stroke text-ink-2"
            >
              <span className="material-symbols-outlined">
                {darkMode ? "light_mode" : "dark_mode"}
              </span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sair"
              className="flex size-[38px] items-center justify-center rounded-[10px] border border-stroke text-ink-2"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </header>

        <main className="px-4 pb-28 pt-6 lg:pb-10">{children}</main>
      </div>

      {/* Bottom nav mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-stroke lg:hidden"
        style={{
          backgroundColor: "color-mix(in srgb, var(--surface) 80%, transparent)",
          backdropFilter: "blur(12px)"
        }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-3 text-[10.5px] font-medium ${
                isActive ? "text-brand" : "text-ink-3"
              }`
            }
          >
            <span className="material-symbols-outlined text-2xl">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/components/AppShell.test.tsx`
Expected: PASS (2 tests). Se o `AuthProvider` falhar ao montar, ajuste o wrapper do teste conforme nota no Step 1.

- [ ] **Step 6: Lint + commit**

```bash
cd apps/web && npm run lint
git add apps/web/src/components/BrandLockup.tsx apps/web/src/components/AppShell.tsx apps/web/src/components/AppShell.test.tsx
git commit -m "feat(web): app shell (sidebar desktop + bottom nav mobile + header)"
```

---

### Task 7: Reescrita do `CanvasPage` (integra shell + info card + toolbar + Lista/Mural + modal)

**Files:**

- Modify: `apps/web/src/pages/CanvasPage.tsx` (reescrita do componente; remover extras)
- Create: `apps/web/src/pages/CanvasPage.test.tsx`

**Interfaces:**

- Consumes: `AppShell`, `CanvasListView`, `CanvasMuralView`, `BlockEditModal` (nova assinatura), `ResultsModal` (existente), `useCanvasStore`, `calculateScoreMetrics`, `readLayoutPreference`/`writeLayoutPreference`/`CanvasLayout`, `buildCanvasTitle`, `SRL_BLOCKS`, `SRL_BLOCKS_BY_ID`.
- Mantém a rota `/canvas` e o efeito de gravação remota (`saveCanvas`) **sem UI de status**.
- **Remove** desta tela: modo avançado + atalhos, onboarding guiado, indicador de sync, `ResearchOpinionModal`/`GroupDetailsModal` e botões correspondentes, `FooterNav` (substituído pelo bottom nav do `AppShell`).

- [ ] **Step 1: Write the failing test** — `apps/web/src/pages/CanvasPage.test.tsx`

```tsx
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { CanvasPage } from "./CanvasPage";
import { AuthProvider } from "../auth/AuthProvider";
import { useCanvasStore } from "../store/useCanvasStore";

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <CanvasPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

afterEach(() => {
  window.localStorage.clear();
  useCanvasStore.getState().resetCanvas();
});

describe("CanvasPage", () => {
  it("renderiza dentro do shell com Informações Gerais e toolbar", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Meu SRL Canvas" })).toBeInTheDocument();
    expect(screen.getByText("Informações Gerais")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lista" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mural Canvas" })).toBeInTheDocument();
  });

  it("alterna para Mural e persiste a preferência", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Mural Canvas" }));
    expect(window.localStorage.getItem("srl-canvas-layout-v1")).toBe("mural");
  });

  it("abre o modal ao clicar num bloco e fecha ao cancelar", () => {
    renderPage();
    fireEvent.click(screen.getByText(/Problema \/ Oportunidade/).closest("button")!);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/P1 ·/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/pages/CanvasPage.test.tsx`
Expected: FAIL — UI antiga não tem botões "Lista"/"Mural Canvas".

- [ ] **Step 3: Reescrever `apps/web/src/pages/CanvasPage.tsx`**

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "../components/AppShell";
import { BlockEditModal } from "../components/BlockEditModal";
import { CanvasListView } from "../components/CanvasListView";
import { CanvasMuralView } from "../components/CanvasMuralView";
import { ResultsModal } from "../components/ResultsModal";
import { useAuth } from "../auth/AuthProvider";
import { SRL_BLOCKS, SRL_BLOCKS_BY_ID } from "../data/srlBlocks";
import { saveCanvas } from "../services/canvasApi";
import { hasMeaningfulCanvasData, useCanvasStore } from "../store/useCanvasStore";
import { buildCanvasTitle } from "../utils/canvasIdentity";
import {
  type CanvasLayout,
  readLayoutPreference,
  writeLayoutPreference
} from "../utils/layoutPreference";
import { calculateScoreMetrics } from "../utils/score";

const MAX_SCORE = 108;

export function CanvasPage() {
  const { user, isEnabled } = useAuth();
  const {
    meta,
    blocks,
    setMeta,
    updateBlock,
    resetCanvas,
    darkMode,
    remoteCanvasId,
    setRemoteCanvasId
  } = useCanvasStore();
  void darkMode; // tema é controlado pelo AppShell

  const [layout, setLayout] = useState<CanvasLayout>(() => readLayoutPreference());
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [isResultsOpen, setIsResultsOpen] = useState(false);

  const lastSyncedFingerprintRef = useRef<string | null>(null);
  const initialRemoteCreateInFlightRef = useRef(false);

  const scores = useMemo(() => SRL_BLOCKS.map((block) => blocks[block.id]?.score ?? 0), [blocks]);
  const metrics = useMemo(() => calculateScoreMetrics(scores), [scores]);
  const canvasFingerprint = useMemo(() => JSON.stringify({ meta, blocks }), [meta, blocks]);
  const userId = user?.id ?? null;

  const editingBlock = editingBlockId ? SRL_BLOCKS_BY_ID[editingBlockId] : null;
  const completionLabel = `[ ${metrics.total} / ${MAX_SCORE} ]`;

  const changeLayout = (next: CanvasLayout) => {
    setLayout(next);
    writeLayoutPreference(next);
  };

  const handleReset = () => {
    if (!window.confirm("Tem certeza que deseja limpar todo o canvas atual?")) return;
    resetCanvas();
  };

  // gravação remota silenciosa (sem UI de status)
  useEffect(() => {
    if (!isEnabled || !userId) return;
    if (!hasMeaningfulCanvasData({ meta, blocks })) return;
    if (canvasFingerprint === lastSyncedFingerprintRef.current) return;
    if (!remoteCanvasId && initialRemoteCreateInFlightRef.current) return;

    let isActive = true;
    const timer = window.setTimeout(() => {
      const isCreating = !remoteCanvasId;
      if (isCreating) initialRemoteCreateInFlightRef.current = true;
      const requestFingerprint = canvasFingerprint;
      void saveCanvas({ id: remoteCanvasId ?? undefined, userId, meta, blocks })
        .then((saved) => {
          if (!isActive) return;
          if (saved.id !== remoteCanvasId) setRemoteCanvasId(saved.id);
          lastSyncedFingerprintRef.current = requestFingerprint;
        })
        .catch(() => {
          /* silencioso */
        })
        .finally(() => {
          if (isCreating) initialRemoteCreateInFlightRef.current = false;
        });
    }, 800);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [blocks, canvasFingerprint, isEnabled, meta, remoteCanvasId, setRemoteCanvasId, userId]);

  return (
    <AppShell title="Meu SRL Canvas">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-[18px]">
        {/* Informações Gerais */}
        <section className="rounded-hero border border-stroke bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[16px] font-bold text-ink">Informações Gerais</h2>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-stroke px-3 py-1.5 text-[12px] font-semibold text-ink-2"
            >
              Resetar Canvas
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-ink-2">Startup</span>
              <input
                type="text"
                value={meta.startup}
                placeholder="Nome da Startup"
                onChange={(event) => setMeta({ startup: event.target.value })}
                className="rounded-[10px] bg-inset px-3 py-2.5 text-[14px] text-ink"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-ink-2">Avaliador</span>
              <input
                type="text"
                value={meta.evaluator}
                placeholder="Nome do Avaliador"
                onChange={(event) => setMeta({ evaluator: event.target.value })}
                className="rounded-[10px] bg-inset px-3 py-2.5 text-[14px] text-ink"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-ink-2">Data</span>
              <input
                type="date"
                value={meta.date}
                onChange={(event) => setMeta({ date: event.target.value })}
                className="rounded-[10px] bg-inset px-3 py-2.5 text-[14px] text-ink"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-[10px] bg-inset px-4 py-3">
            <span className="text-[12px] font-semibold text-ink-2">Total</span>
            <span className="font-mono text-[12px] text-ink">{completionLabel}</span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <span
                className="block h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, metrics.completion)}%`,
                  background: "linear-gradient(90deg, var(--teal), #4FE0CE)"
                }}
              />
            </span>
          </div>
        </section>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-[10px] border border-stroke bg-surface p-0.5">
            <button
              type="button"
              onClick={() => changeLayout("lista")}
              aria-pressed={layout === "lista"}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold ${
                layout === "lista" ? "bg-surface-2 text-ink" : "text-ink-2"
              }`}
            >
              <span className="material-symbols-outlined text-base">list</span>
              Lista
            </button>
            <button
              type="button"
              onClick={() => changeLayout("mural")}
              aria-pressed={layout === "mural"}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold ${
                layout === "mural" ? "bg-surface-2 text-ink" : "text-ink-2"
              }`}
            >
              <span className="material-symbols-outlined text-base">grid_view</span>
              Mural Canvas
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsResultsOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-[14px] font-semibold text-brand-fg"
          >
            <span className="material-symbols-outlined text-base">insights</span>
            Ver Resultados
          </button>
        </div>

        {/* Blocos */}
        {layout === "lista" ? (
          <CanvasListView blockState={blocks} onSelectBlock={setEditingBlockId} />
        ) : (
          <CanvasMuralView blockState={blocks} onSelectBlock={setEditingBlockId} />
        )}
      </div>

      {editingBlock && (
        <BlockEditModal
          block={editingBlock}
          value={blocks[editingBlock.id]}
          onClose={() => setEditingBlockId(null)}
          onSave={(value) => updateBlock(editingBlock.id, value)}
        />
      )}

      {isResultsOpen && (
        <ResultsModal
          darkMode={useCanvasStore.getState().darkMode}
          metrics={metrics}
          scores={scores}
          projectTitle={buildCanvasTitle(meta)}
          updatedAt={new Date().toISOString()}
          onClose={() => setIsResultsOpen(false)}
        />
      )}
    </AppShell>
  );
}
```

> Nota sobre `onSave`/modal: `BlockEditModal` chama `onSave` tanto ao selecionar um nível (aplicação imediata) quanto ao "Salvar". Aqui `onSave` faz `updateBlock` (persiste no store) e **não** fecha o modal — o fechamento vem do botão "Salvar"/"Cancelar"/X via `onClose`. Isso preserve o comportamento do handoff ("Selecionar um nível aplica imediatamente; Salvar fecha").
>
> `darkMode` lido via `useCanvasStore.getState()` no `ResultsModal` evita warning de variável não usada; se preferir, selecione `darkMode` do hook e passe direto.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/pages/CanvasPage.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Suíte completa + lint + typecheck**

Run: `cd apps/web && npm run test && npm run lint && npx tsc --noEmit`
Expected: tudo verde. Corrigir quaisquer imports órfãos (ex.: arquivos que ainda referenciem `FooterNav`/`GroupDetailsModal` a partir do CanvasPage — devem ter sido removidos). Os componentes `FooterNav`, `GroupDetailsModal`, `ResearchOpinionModal` continuam existindo no repo (usados por outras telas ou não); apenas o `CanvasPage` deixa de importá-los.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/CanvasPage.tsx apps/web/src/pages/CanvasPage.test.tsx
git commit -m "feat(web): recria tela Meu SRL Canvas no novo design (shell + lista/mural + modal)"
```

---

### Task 8: Verificação visual manual + ajuste final

**Files:** nenhum arquivo novo obrigatório (ajustes pontuais conforme observação visual).

- [ ] **Step 1: Rodar o app**

Run: `pnpm dev:web` (raiz) — abrir a rota `/canvas` (requer login; usar fluxo de auth existente ou modo guest).

- [ ] **Step 2: Conferir contra os screenshots de referência**

Comparar com `new_layout/screenshots/mural.png` (escuro) e `new_layout/screenshots/01-mural4.png` (claro):

- Sidebar com marca 2×2, nav, "Novo SRL Canvas", avatar no rodapé.
- Header 64px com toggle de tema e sair.
- Informações Gerais com Startup/Avaliador/Data + faixa Total (mono + barra teal).
- Segmented control Lista/Mural alterna e persiste após reload.
- Lista agrupada por categoria com pills de status; Mural com cabeçalho colorido + contador `n/9`.
- Modal: cabeçalho na cor, grid de 9 níveis, descrição do nível, "Para avançar", evidências.
- Alternar tema claro/escuro reflete em todos os tokens.
- Responsivo: <900px (`lg` breakpoint) troca sidebar por bottom nav.

- [ ] **Step 3: Ajustes pontuais**

Se algo divergir do handoff (espaçamento/raio/cor), ajustar as classes/estilos correspondentes nos componentes das Tasks 3–7. Rodar `npm run lint` após ajustes.

- [ ] **Step 4: Commit (se houve ajustes)**

```bash
git add -A apps/web/src
git commit -m "fix(web): ajustes de fidelidade visual da tela Meu SRL Canvas"
```

---

## Self-review (preenchido pelo autor do plano)

**Cobertura do spec:**

- Fundação de tokens (fontes, CSS vars, tailwind, cores de categoria, `withAlpha`) → Task 1. ✅
- Persistência de layout → Task 2. ✅
- AppShell (sidebar/bottom nav/header, marca, toggle de tema, logout) → Task 6. ✅
- Informações Gerais (Startup/Avaliador/Data + Total) → Task 7. ✅
- Toolbar + segmented control persistido + Ver Resultados → Task 7. ✅
- Lista agrupada → Task 3. ✅
- Mural → Task 4. ✅
- Modal redesenhado → Task 5. ✅
- Remoção dos extras + sync silencioso → Task 7. ✅
- Testes → Tasks 1–7 (unitários) + Task 8 (visual). ✅
- Desvios (Data mantida, shell só no Canvas, Material Symbols) → refletidos nas Tasks 6/7. ✅

**Consistência de tipos:** `CanvasLayout`, `CanvasBlockState`, `withAlpha`, `GroupMeta.color`, props de `CanvasListView`/`CanvasMuralView`/`BlockEditModal`/`AppShell` definidas uma vez e consumidas com os mesmos nomes/assinaturas. `BlockEditModal` perde `onSaveAndNext`/`showSaveAndNext` (Task 5) e o `CanvasPage` (Task 7) já usa a assinatura nova. ✅

**Placeholders:** nenhum TBD/TODO; código completo em cada step. ✅
