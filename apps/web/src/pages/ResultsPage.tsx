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
