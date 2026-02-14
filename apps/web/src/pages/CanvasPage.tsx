import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BlockEditModal } from "../components/BlockEditModal";
import { FooterNav } from "../components/FooterNav";
import { GroupDetailsModal } from "../components/GroupDetailsModal";
import { ResearchOpinionModal } from "../components/ResearchOpinionModal";
import { ResultsModal } from "../components/ResultsModal";
import { GROUPS, GROUP_BY_KEY, SRL_BLOCKS, SRL_BLOCKS_BY_ID } from "../data/srlBlocks";
import { useCanvasStore } from "../store/useCanvasStore";
import type { GroupKey } from "../types";
import { calculateScoreMetrics } from "../utils/score";

const MAX_SCORE = 108;

export function CanvasPage() {
  const navigate = useNavigate();
  const { meta, blocks, setMeta, updateBlock, resetCanvas, darkMode, toggleDarkMode } =
    useCanvasStore();
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [selectedGroupKey, setSelectedGroupKey] = useState<GroupKey | null>(null);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isOpinionModalOpen, setIsOpinionModalOpen] = useState(false);

  const scores = useMemo(() => SRL_BLOCKS.map((block) => blocks[block.id]?.score ?? 0), [blocks]);
  const metrics = useMemo(() => calculateScoreMetrics(scores), [scores]);

  const completionLabel = `[ ${metrics.total} / ${MAX_SCORE} ]`;
  const editingBlock = editingBlockId ? SRL_BLOCKS_BY_ID[editingBlockId] : null;
  const selectedGroup = selectedGroupKey ? GROUP_BY_KEY[selectedGroupKey] : null;

  const handleReset = () => {
    const confirmed = window.confirm("Tem certeza que deseja limpar todo o canvas atual?");
    if (!confirmed) return;
    resetCanvas();
  };

  const openOpinionForm = () => {
    setIsOpinionModalOpen(true);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light font-display dark:bg-background-dark">
      <header className="sticky top-0 z-10 flex h-16 items-center border-b border-zinc-200/80 bg-background-light/85 px-4 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-background-dark/85">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex h-12 w-12 items-center justify-center text-text-light-primary dark:text-text-dark-primary"
          aria-label="Ir para dashboard"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>

        <h1 className="flex-1 text-center text-lg font-bold tracking-tight text-text-light-primary dark:text-text-dark-primary">
          Meu SRL Canvas
        </h1>

        <div className="flex items-center">
          <button
            type="button"
            onClick={openOpinionForm}
            className="flex h-12 w-12 items-center justify-center text-text-light-primary dark:text-text-dark-primary"
            aria-label="Abrir formulario de opiniao"
          >
            <span className="material-symbols-outlined text-2xl">rate_review</span>
          </button>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="flex h-12 w-12 items-center justify-center text-text-light-primary dark:text-text-dark-primary"
            aria-label="Alternar tema"
          >
            <span className="material-symbols-outlined text-2xl">
              {darkMode ? "light_mode" : "dark_mode"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setIsResultsOpen(true)}
            className="flex h-12 w-12 items-center justify-center text-text-light-primary dark:text-text-dark-primary"
            aria-label="Compartilhar ou exportar"
          >
            <span className="material-symbols-outlined text-2xl">ios_share</span>
          </button>
        </div>
      </header>

      <main className="flex-grow px-4 pb-28 pt-6">
        <div className="mb-6 rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              Informacoes Gerais
            </h2>
            <button
              type="button"
              className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
              onClick={handleReset}
            >
              Resetar Canvas
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="col-span-1">
              <span className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                Startup
              </span>
              <input
                className="mt-1 block w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
                type="text"
                placeholder="Nome da Startup"
                value={meta.startup}
                onChange={(event) => setMeta({ startup: event.target.value })}
              />
            </label>

            <label className="col-span-1">
              <span className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                Avaliador
              </span>
              <input
                className="mt-1 block w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
                type="text"
                placeholder="Nome do Avaliador"
                value={meta.evaluator}
                onChange={(event) => setMeta({ evaluator: event.target.value })}
              />
            </label>

            <label className="col-span-1">
              <span className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                Data
              </span>
              <input
                className="mt-1 block w-full rounded-md border-zinc-300 bg-zinc-50 p-2 text-sm text-text-light-primary shadow-sm focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary"
                type="text"
                placeholder="dd/mm/aaaa"
                value={meta.date}
                onChange={(event) => setMeta({ date: event.target.value })}
              />
            </label>

            <div className="col-span-1">
              <span className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                Total
              </span>
              <div className="mt-1 flex h-9 items-center rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 text-sm text-text-light-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-text-dark-primary">
                <span className="whitespace-nowrap font-mono text-xs">{completionLabel}</span>
                <div className="ml-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, metrics.completion)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setIsResultsOpen(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            Ver Resultados
          </button>
        </div>

        <section>
          <div className="flex flex-col gap-4">
            {SRL_BLOCKS.map((block) => {
              const group = GROUP_BY_KEY[block.group];
              const current = blocks[block.id];
              const hasScore = typeof current?.score === "number";

              return (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => setEditingBlockId(block.id)}
                  className="flex cursor-pointer items-center gap-4 rounded-xl bg-card-light p-4 text-left shadow-sm ring-1 ring-zinc-200/80 transition hover:-translate-y-0.5 hover:ring-primary/40 dark:bg-card-dark dark:ring-zinc-800/80"
                >
                  <div
                    className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${group.iconBgClass}`}
                  >
                    <span className={`material-symbols-outlined text-2xl ${group.iconTextClass}`}>
                      {block.icon}
                    </span>
                  </div>

                  <div className="flex flex-col justify-center">
                    <p className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                      <span className={`font-bold ${group.badgeClass}`}>{block.id}.</span>{" "}
                      {block.name}
                    </p>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      {hasScore ? `Nota: ${current.score}/9` : "Pendente"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 px-2 text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
          {GROUPS.map((group) => (
            <button
              key={group.key}
              type="button"
              onClick={() => setSelectedGroupKey(group.key)}
              className="flex items-center gap-2 rounded-full border border-transparent px-2 py-1 transition hover:border-zinc-300 hover:bg-zinc-100/70 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/70"
              aria-label={`Ver detalhes do agrupamento ${group.name}`}
              title={`Ver detalhes de ${group.detailTitle}`}
            >
              <div className={`size-3 rounded-full ${group.dotClass}`} />
              <span>{group.name}</span>
            </button>
          ))}
        </div>
      </main>

      <FooterNav />

      {editingBlock && (
        <BlockEditModal
          block={editingBlock}
          value={blocks[editingBlock.id]}
          onClose={() => setEditingBlockId(null)}
          onSave={(value) => {
            updateBlock(editingBlock.id, value);
            setEditingBlockId(null);
          }}
        />
      )}

      {isResultsOpen && (
        <ResultsModal
          darkMode={darkMode}
          metrics={metrics}
          scores={scores}
          onClose={() => setIsResultsOpen(false)}
        />
      )}

      {selectedGroup && (
        <GroupDetailsModal group={selectedGroup} onClose={() => setSelectedGroupKey(null)} />
      )}

      <ResearchOpinionModal
        isOpen={isOpinionModalOpen}
        nextPath="/canvas"
        onClose={() => setIsOpinionModalOpen(false)}
      />
    </div>
  );
}
