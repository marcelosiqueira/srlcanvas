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
              aria-label="Lista"
              onClick={() => changeLayout("lista")}
              aria-pressed={layout === "lista"}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold ${
                layout === "lista" ? "bg-surface-2 text-ink" : "text-ink-2"
              }`}
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                list
              </span>
              Lista
            </button>
            <button
              type="button"
              aria-label="Mural Canvas"
              onClick={() => changeLayout("mural")}
              aria-pressed={layout === "mural"}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold ${
                layout === "mural" ? "bg-surface-2 text-ink" : "text-ink-2"
              }`}
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                grid_view
              </span>
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
          key={editingBlock.id}
          block={editingBlock}
          value={blocks[editingBlock.id]}
          onClose={() => setEditingBlockId(null)}
          onSave={(value) => updateBlock(editingBlock.id, value)}
        />
      )}

      {isResultsOpen && (
        <ResultsModal
          darkMode={darkMode}
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
