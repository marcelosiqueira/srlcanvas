# Design — Redesign "Meu SRL Canvas" + fundação de design tokens

**Data:** 2026-06-24
**Escopo desta fatia:** fundação de design (tokens + fontes), app shell, tela "Meu SRL Canvas" (Lista + Mural) e modal de avaliação do bloco.
**Referência visual:** `new_layout/design_handoff_srl_canvas/README.md` + `new_layout/SRL Canvas App.dc.html` (protótipo, **não** copiar HTML) + `new_layout/screenshots/`.

## Contexto

O app já tem a camada de dados correta (`SRL_BLOCKS` P1–P12, `GROUPS`, scores 0–9, níveis, objetivos, perguntas) e a store Zustand (`useCanvasStore`). O redesign troca a linguagem visual e o layout da tela. Stack: React 18 + TS + Vite + Tailwind 3 (`darkMode: "class"`) + Zustand + react-router-dom.

Fatos de implementação confirmados:

- Dark mode é aplicado por um **wrapper div** em `App.tsx:40` (`<div className={darkMode ? "dark" : ""}>`), não em `documentElement`. Logo, variáveis CSS em `:root` (claro) com override em `.dark` cascateiam corretamente, e Tailwind `darkMode: "class"` casa com o wrapper.
- Ícones de blocos são nomes de Material Symbols em `SRL_BLOCKS[].icon` (ex.: `report_problem`).
- Métricas derivadas via `calculateScoreMetrics` (`utils/score.ts`).

## Decisões (confirmadas com o usuário)

1. **Fundação global** — tokens CSS (claro/escuro), fontes Archivo + IBM Plex Sans/Mono globais, **mantendo Material Symbols** (o handoff permite o pacote do projeto).
2. **Construir o shell agora** — sidebar (desktop ≥900px) + bottom nav (mobile) + header 64px.
3. **Seguir o design à risca** — remover da tela os extras não previstos no handoff (modo avançado + atalhos, onboarding guiado, indicador visual de sync, modal de opinião de pesquisa). A **gravação remota silenciosa permanece** (integridade de dados), apenas sem UI de status.
4. **Incluir o modal de avaliação agora**, fiel ao handoff (cabeçalho na cor da categoria, grid de 9 níveis, caixa "Descrição do nível", caixa "Para avançar ao nível N+1", evidências).

## Abordagem escolhida

**Tokens como variáveis CSS + Tailwind mapeado para as vars.** Definir todos os tokens em `index.css` (claro em `:root`, override em `.dark`) e mapear nomes semânticos no `tailwind.config.ts` para `var(--token)`. Cores de categoria ficam em JS (`GROUPS`) como hex, pois são iguais nos dois temas e precisam de tints rgba dinâmicos.

Alternativas descartadas: classes `@layer components` bespoke (diverge do estilo Tailwind-first); valores arbitrários inline em tudo (verboso/repetitivo).

## Componentes / unidades

### 1. Fundação de tokens

- **`index.css`:** trocar import de fonte para `Archivo:wght@500;600;700;800;900`, `IBM+Plex+Sans:wght@400;500;600;700`, `IBM+Plex+Mono:wght@400;500;600` (manter o import de Material Symbols). Definir variáveis CSS:
  - Base (claro em `:root`, escuro em `.dark`): `--bg`, `--surface`, `--surface-2`, `--inset`, `--border`, `--line`, `--text`, `--text-2`, `--text-3`, `--teal`, `--navy`, `--hero`, `--primary`, `--primary-text` com os hexes da tabela do handoff.
  - Sombras: `--shadow`, `--shadow-sm`, `--shadow-lg` (valores claro/escuro do handoff).
  - `body` → `font-family` IBM Plex Sans, `background: var(--bg)`, `color: var(--text)`.
- **`tailwind.config.ts`:** manter `darkMode: "class"`. Em `theme.extend`:
  - `colors`: `bg`, `surface`, `surface-2`, `inset`, `border`, `line`, `text`, `text-2`, `text-3`, `teal`, `navy`, `hero`, `primary`, `primary-text` → `var(--token)`. **Manter** os tokens antigos (`primary #135bec`, `background-light` etc.) durante a transição para não quebrar telas ainda não redesenhadas.
  - `fontFamily`: `display: ["Archivo", ...]`, `sans/DEFAULT: ["IBM Plex Sans", ...]`, `mono: ["IBM Plex Mono", ...]`.
  - `boxShadow`: `DEFAULT/sm/lg → var(--shadow*)`.
  - `borderRadius`: acrescentar tamanhos do handoff (card 14–16, hero 20, modal 18) sem remover os atuais.
- **`GROUPS` (`data/srlBlocks.ts`):** acrescentar a cada grupo `color` (hex: fundacao `#1E5BC6`, produtoMercado `#2C9B46`, escala `#EA8520`, governanca `#4A2D7E`). Manter as classes Tailwind antigas (`dotClass` etc.) para telas legadas.
- **Util `withAlpha(hex, alpha)`** (`utils/color.ts`) para tints rgba (`0.12/0.20` chips, `0.09/0.16` caixas).

### 2. App shell — `components/AppShell.tsx`

Layout reutilizável que envolve o conteúdo da tela. Props: `title: string`, `children`.

- **Sidebar (desktop ≥900px):** largura 256px, `bg-surface`, borda direita `--border`. Conteúdo: `BrandLockup` (grade 2×2 nas 4 cores de categoria 34×34 gap 3 + "SRL" Archivo 800 20 em `--navy` + "CANVAS" Archivo 600 10 letter-spacing 3.5 em `--teal`); nav vertical (Dashboard, Meu Canvas, Resultados, Minha Conta) com estado ativo (`--surface-2` claro / `--inset` escuro, ícone `--primary`); botão primário "Novo SRL Canvas"; rodapé avatar "MS / Minha Startup".
- **Bottom nav (mobile <900px):** fixa, 4 itens (ícone + label 10.5px), `backdrop-filter: blur(12px)`, borda superior.
- **Header (64px, sticky):** `backdrop-filter: blur(10px)`, fundo `color-mix(...)`, borda inferior. Esquerda: `title` (Archivo 700 17). Direita: toggle de tema (sol/lua → `toggleDarkMode`) e sair (logout) — botões 38×38 raio 10 borda `--border`.
- Nav usa `react-router` `NavLink` para rotas existentes. Ícones via Material Symbols (`grid_view`, `view_week`, `radar`, `person`).
- **Aplicação:** envolver **apenas** `CanvasPage` nesta fatia. Dashboard/Resultados/Conta mantêm o chrome atual até seus próprios redesigns.

### 3. Tela "Meu SRL Canvas" — `pages/CanvasPage.tsx` (reescrita do render)

Container `max-width: 1120px`, coluna com gaps do handoff.

- **Card "Informações Gerais":** título + "Resetar Canvas" (outline, mantém `window.confirm` + `resetCanvas`). Inputs **Startup**, **Avaliador** e **Data** (a Data é metadado central — usado em PDF/identidade — e **não** é um dos "extras" removidos; mantida como terceiro input responsivo). Faixa "Total": contador mono `[ {total} / 108 ]` + barra teal (`linear-gradient(90deg, var(--teal), #4FE0CE)`).
- **Toolbar:** segmented control **Lista / Mural Canvas** à esquerda (persiste em `localStorage` `srl-canvas-layout-v1`, default `lista`); botão primário "Ver Resultados" à direita (abre `ResultsModal` existente).
- **Variação Lista:** blocos agrupados pelas 4 categorias (na ordem de `GROUPS`, blocos em ordem de `number`). Cabeçalho do grupo: barra vertical 5×34 na cor + nome Archivo 700 13.5 na cor + subtítulo 11.5 `--text-3`. Cada bloco = linha-card (raio 14, borda `--border`): chip de ícone 44×44 (raio 12, fundo `withAlpha(cor,.12/.20)`, ícone na cor), "{number}. {name}" (número na cor) + objetivo 12.5 `--text-2`, pill de status (preenchida na cor = "Nível n" / outline = "Pendente") + chevron. Clique abre o modal.
- **Variação Mural:** grid `repeat(auto-fill, minmax(240px,1fr))` gap 13. Card vertical (raio 14, `overflow:hidden`, `shadow`, sem borda, `min-height:148px`). **Elemento clicável com `padding:0`** (nota do handoff). Cabeçalho full-bleed na cor (raio `14 14 0 0`, ícone branco + "P{number}"). Corpo: title Archivo 700 14, objetivo 11.5 `--text-3`, rodapé com mini barra (nível/9 na cor) + contador mono "{nível}/9".

### 4. Modal de avaliação — `components/BlockEditModal.tsx` (reescrita)

Mantém assinatura usada por `CanvasPage` (`block`, `value`, `onClose`, `onSave`) e o hook `useDialogA11y`. Remove props de modo avançado (`showSaveAndNext`/`onSaveAndNext`).

- Overlay `rgba(8,12,22,.5)` + `backdrop-filter: blur(3px)`, conteúdo alinhado ao topo (padding 5vh). Card `max-width:620px`, raio 18, `shadow-lg`, animação `pop` (keyframes em `index.css`).
- **Cabeçalho** na cor da categoria (raio `18 18 0 0`): chip de ícone branco translúcido + "P{number} · {name}" (Archivo 800 17 branco) + nome da categoria (11.5 branco 80%) + botão fechar (X).
- **Corpo** (scroll, `max-height:64vh`): "OBJETIVO" + `block.objective`; lista das `block.questions`; "Nível de maturidade" + badge "Nível {n}/9" na cor; **grid de 9 botões** (1–9): selecionado = preenchido na cor/branco; ≤ selecionado = tint + texto na cor; demais = `--inset` + borda. Caixa "Descrição do nível {n}" (`block.levels[n-1].description`, fundo/borda tint da categoria). Caixa tracejada "PARA AVANÇAR AO NÍVEL {n+1}" (`block.levels[n].description`; oculta no nível 9). Campo "Evidências" (textarea `--inset`, ligado a `evidence`).
- **Rodapé:** "Cancelar" (outline, `onClose`) + "Salvar" (primário com ícone). Selecionar um nível aplica imediatamente (`onSave`/`updateBlock` do score na hora, refletindo em total/progresso/estágio/cv/radar); "Salvar" persiste evidências e fecha.
- `notes` permanece no estado (`CanvasBlockState`) mas **não é renderizado** (evita perda de dados; o handoff só prevê Evidências).

### 5. Estado / persistência

- Reusar `useCanvasStore` (`meta`, `blocks`, `darkMode`, `updateBlock`, `setMeta`, `resetCanvas`, `toggleDarkMode`).
- `layout`: helper de `localStorage` (`srl-canvas-layout-v1`, valores `lista|mural`), no padrão do `readAdvancedModeEnabled` atual.
- Efeito de gravação remota (`saveCanvas`) **permanece**, sem renderizar o status.

## Fluxo de dados

`useCanvasStore` → `CanvasPage` calcula `scores`/`metrics` → render Lista/Mural → clique seta `editingBlockId` → `BlockEditModal` → seleção de nível chama `updateBlock` → store persiste (local + remoto silencioso) → métricas/Total recomputam.

## Tratamento de erros / borda

- Sem score → pill "Pendente" / mural "0/9".
- Nível 9 → ocultar caixa "Para avançar".
- Metadados incompletos → manter validação existente (`validateCanvasMeta`) de forma discreta.
- SSR/`window` ausente → helpers de `localStorage` retornam default (padrão atual).

## Testes (Vitest + Testing Library)

- Toggle de layout alterna Lista↔Mural e persiste em `localStorage`.
- Lista renderiza os 12 blocos agrupados sob as 4 categorias na ordem correta.
- Mural renderiza 12 cards com contador "{n}/9" correto.
- Modal: clicar no nível 5 atualiza score do bloco e o Total.
- Toggle de tema adiciona/remove `.dark`.
- Testes existentes (`score`, `useCanvasStore`, `srlBlocks`) seguem verdes.

## Desvios intencionais do handoff

- **Data** mantida no card Informações Gerais (metadado central).
- Shell aplicado **apenas** ao Canvas nesta fatia.
- **Material Symbols** em vez de Lucide (permitido pelo handoff).
- Tokens Tailwind antigos preservados durante a transição (telas legadas).

## Fora de escopo (fatias futuras)

Dashboard, Resultados (tela cheia), Minha Conta; migração das demais telas para o `AppShell`; eventual troca para Lucide.
