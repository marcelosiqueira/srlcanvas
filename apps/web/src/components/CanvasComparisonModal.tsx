import { useEffect, useMemo, useState } from "react";
import { SRL_BLOCKS } from "../data/srlBlocks";
import { useDialogA11y } from "../hooks/useDialogA11y";
import { useCanvasStore } from "../store/useCanvasStore";
import { maturityStageFromTotal } from "../utils/score";
import { compareCanvasHistoryEntries, type CanvasHistoryEntry } from "../utils/canvasHistory";
import { MaturityRadar } from "./MaturityRadar";

interface CanvasComparisonModalProps {
  baseEntry: CanvasHistoryEntry;
  entries: CanvasHistoryEntry[];
  onClose: () => void;
}

const formatDateTime = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("pt-BR");
};

const signed = (value: number, digits: number): string =>
  `${value > 0 ? "+" : ""}${value.toFixed(digits)}`;

const deltaClass = (value: number): string =>
  value > 0
    ? "text-emerald-600 dark:text-emerald-400"
    : value < 0
      ? "text-red-600 dark:text-red-400"
      : "text-ink-3";

export function CanvasComparisonModal({ baseEntry, entries, onClose }: CanvasComparisonModalProps) {
  const { dialogRef, initialFocusRef } = useDialogA11y<HTMLSelectElement>(true);
  const darkMode = useCanvasStore((state) => state.darkMode);

  const others = useMemo(
    () => entries.filter((entry) => entry.id !== baseEntry.id),
    [entries, baseEntry.id]
  );
  const [selectedId, setSelectedId] = useState<string | null>(others[0]?.id ?? null);
  const compareEntry = others.find((entry) => entry.id === selectedId) ?? null;

  const comparison = compareEntry ? compareCanvasHistoryEntries(baseEntry, compareEntry) : null;

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const metricRows =
    compareEntry && comparison
      ? [
          {
            label: "Pontuação total",
            base: `${baseEntry.metrics.total}`,
            compare: `${compareEntry.metrics.total}`,
            delta: signed(comparison.totalDelta, 0)
          },
          {
            label: "Scorecard de Risco",
            base: baseEntry.metrics.riskScore.toFixed(2),
            compare: compareEntry.metrics.riskScore.toFixed(2),
            delta: signed(comparison.riskScoreDelta, 2)
          },
          {
            label: "Coef. de Variação",
            base: baseEntry.metrics.cv.toFixed(2),
            compare: compareEntry.metrics.cv.toFixed(2),
            delta: signed(comparison.cvDelta, 2)
          },
          {
            label: "Blocos preenchidos",
            base: `${baseEntry.filledBlocks}/12`,
            compare: `${compareEntry.filledBlocks}/12`,
            delta: signed(comparison.filledBlocksDelta, 0)
          }
        ]
      : [];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center overflow-y-auto px-4 py-[6vh]"
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
        aria-label="Comparar avaliações"
        className="animate-pop h-fit w-full max-w-[620px] overflow-hidden rounded-modal bg-surface shadow-lg"
      >
        <header className="flex items-center justify-between border-b border-stroke px-5 py-4">
          <h2 className="font-display text-[16px] font-bold text-ink">Comparar avaliações</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-9 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-2"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
          </button>
        </header>

        <div className="max-h-[64vh] overflow-y-auto px-5 py-4">
          <div className="rounded-card border border-stroke bg-inset p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Base</p>
            <p className="mt-1 text-[14px] font-semibold text-ink">{baseEntry.title}</p>
            <p className="text-[12px] text-ink-2">
              Atualizado {formatDateTime(baseEntry.updatedAt)}
            </p>
          </div>

          <label className="mt-4 block">
            <span className="text-[12px] font-semibold text-ink-2">Comparar com</span>
            <select
              ref={initialFocusRef}
              value={selectedId ?? ""}
              onChange={(event) => setSelectedId(event.target.value)}
              disabled={others.length === 0}
              className="mt-1 block w-full rounded-[10px] border border-stroke bg-inset px-3 py-2.5 text-[14px] text-ink outline-none focus:border-brand disabled:opacity-60"
            >
              {others.length === 0 && <option value="">Nenhuma outra avaliação</option>}
              {others.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.title} — {formatDateTime(entry.updatedAt)}
                </option>
              ))}
            </select>
          </label>

          {!compareEntry && (
            <p className="mt-4 text-[13px] text-ink-2">
              Crie outra avaliação para poder comparar a evolução.
            </p>
          )}

          {compareEntry && comparison && (
            <>
              <MaturityRadar
                scores={baseEntry.scores}
                compareScores={compareEntry.scores}
                seriesLabels={[baseEntry.title, compareEntry.title]}
                darkMode={darkMode}
                className="mt-4 h-[300px] w-full"
              />

              <div className="mt-4 grid grid-cols-1 gap-2">
                <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                  <span>Métrica</span>
                  <span className="text-right">Base</span>
                  <span className="text-right">Comparada</span>
                  <span className="text-right">Δ</span>
                </div>
                {metricRows.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] items-center gap-2 rounded-lg bg-inset px-3 py-2 text-[13px]"
                  >
                    <span className="text-ink-2">{row.label}</span>
                    <span className="text-right font-mono text-ink">{row.base}</span>
                    <span className="text-right font-mono text-ink-2">{row.compare}</span>
                    <span
                      className={`text-right font-mono font-semibold ${deltaClass(Number(row.delta))}`}
                    >
                      {row.delta}
                    </span>
                  </div>
                ))}
                <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] items-center gap-2 px-3 py-1 text-[13px]">
                  <span className="text-ink-2">Estágio</span>
                  <span className="text-right text-ink">
                    {maturityStageFromTotal(baseEntry.metrics.total)}
                  </span>
                  <span className="text-right text-ink-2">
                    {maturityStageFromTotal(compareEntry.metrics.total)}
                  </span>
                  <span className="text-right text-ink-3">—</span>
                </div>
              </div>

              {comparison.maturityVelocity !== null && (
                <p className="mt-3 text-[12px] text-ink-2">
                  Velocidade de maturidade:{" "}
                  <strong className={deltaClass(comparison.maturityVelocity)}>
                    {signed(comparison.maturityVelocity, 2)} pts/mês
                  </strong>{" "}
                  <span className="text-ink-3">(reaplicação recomendada a cada 3-6 meses)</span>
                </p>
              )}

              <h3 className="mt-5 font-display text-[14px] font-bold text-ink">
                Diferença por bloco
              </h3>
              <div className="mt-2 grid grid-cols-1 gap-1.5">
                {[...SRL_BLOCKS]
                  .sort((a, b) => a.number - b.number)
                  .map((block) => {
                    const index = SRL_BLOCKS.indexOf(block);
                    const baseScore = baseEntry.scores[index] ?? 0;
                    const compareScore = compareEntry.scores[index] ?? 0;
                    const diff = baseScore - compareScore;
                    return (
                      <div
                        key={block.id}
                        className="grid grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr] items-center gap-2 rounded-lg bg-inset px-3 py-1.5 text-[12.5px]"
                      >
                        <span className="truncate text-ink">
                          P{block.number} · {block.shortLabel}
                        </span>
                        <span className="text-right font-mono text-ink">{baseScore}/9</span>
                        <span className="text-right font-mono text-ink-2">{compareScore}/9</span>
                        <span className={`text-right font-mono font-semibold ${deltaClass(diff)}`}>
                          {signed(diff, 0)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>

        <footer className="flex justify-end border-t border-stroke px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] bg-brand px-4 py-2 text-[13px] font-semibold text-brand-fg transition hover:brightness-110"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}
