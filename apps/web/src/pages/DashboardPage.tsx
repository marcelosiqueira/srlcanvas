import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AppShell } from "../components/AppShell";
import { AboutSrlCanvasModal } from "../components/AboutSrlCanvasModal";
import { CanvasComparisonModal } from "../components/CanvasComparisonModal";
import { EditCanvasWarningModal } from "../components/EditCanvasWarningModal";
import { ResearchOpinionPanel } from "../components/ResearchOpinionPanel";
import { deleteCanvas, listCanvasesByUser, type RemoteCanvas } from "../services/canvasApi";
import { useCanvasStore } from "../store/useCanvasStore";
import { buildCanvasTitle } from "../utils/canvasIdentity";
import { calculateScoreMetrics, maturityStageFromTotal } from "../utils/score";
import {
  buildCanvasHistoryEntries,
  buildScoresFromBlocks,
  compareCanvasHistoryEntries,
  type CanvasHistoryEntry
} from "../utils/canvasHistory";
import { SRL_BLOCKS } from "../data/srlBlocks";

const SRL_DOWNLOADS = [
  {
    label: "Baixar Guia de Aplicação",
    href: "/downloads/guia-aplicacao-srl-canvas.pdf"
  },
  {
    label: "Baixar SRL Canvas",
    href: "/downloads/srl-canvas-modelo-manual.pdf"
  },
  {
    label: "Baixar Gráfico Radar",
    href: "/downloads/grafico-radar-srl-canvas.pdf"
  }
] as const;

export function DashboardPage() {
  const { meta, blocks, replaceCanvas } = useCanvasStore();
  const { isEnabled, user } = useAuth();
  const navigate = useNavigate();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<CanvasHistoryEntry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [rawCanvases, setRawCanvases] = useState<RemoteCanvas[]>([]);
  const [editCanvasId, setEditCanvasId] = useState<string | null>(null);
  const [compareBaseId, setCompareBaseId] = useState<string | null>(null);

  useEffect(() => {
    if (!isEnabled || !user) return;

    let isActive = true;

    void listCanvasesByUser(user.id)
      .then((canvases) => {
        if (!isActive) return;
        setHistoryError(null);
        setRawCanvases(canvases);
        const entries = buildCanvasHistoryEntries(canvases);
        setHistoryEntries(entries);
      })
      .catch((error) => {
        if (!isActive) return;
        setHistoryError(error instanceof Error ? error.message : "Falha ao carregar histórico.");
        setHistoryEntries([]);
        setRawCanvases([]);
      });

    return () => {
      isActive = false;
    };
  }, [isEnabled, user]);

  const currentScores = buildScoresFromBlocks(blocks);
  const metrics = calculateScoreMetrics(currentScores);
  const filledBlocks = SRL_BLOCKS.filter(
    (block) => typeof blocks[block.id]?.score === "number"
  ).length;
  const currentCanvasTitle = buildCanvasTitle(meta);
  const latestHistoryEntry = historyEntries[0] ?? null;

  const editCanvas = rawCanvases.find((canvas) => canvas.id === editCanvasId) ?? null;
  const compareBaseEntry = historyEntries.find((entry) => entry.id === compareBaseId) ?? null;

  const confirmEditCanvas = () => {
    if (!editCanvas) return;
    replaceCanvas({
      meta: editCanvas.meta,
      blocks: editCanvas.blocks,
      remoteCanvasId: editCanvas.id
    });
    setEditCanvasId(null);
    navigate("/canvas");
  };

  const handleDeleteCanvas = async (id: string) => {
    if (!window.confirm("Excluir esta avaliação? Esta ação não pode ser desfeita.")) return;
    try {
      await deleteCanvas(id);
      setRawCanvases((prev) => prev.filter((canvas) => canvas.id !== id));
      setHistoryEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "Falha ao excluir avaliação.");
    }
  };

  return (
    <AppShell title="Dashboard">
      <div className="space-y-[18px]">
        {/* Hero Card */}
        <section className="rounded-hero bg-hero p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
            CANVAS ATUAL
          </p>
          <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight text-white">
            {currentCanvasTitle}
          </h1>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              <span className="size-2 rounded-full bg-teal" />
              Estágio: {maturityStageFromTotal(metrics.total)}
            </span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/14">
            <div
              className="h-full rounded-full"
              style={{
                width: `${metrics.completion}%`,
                background: "linear-gradient(90deg,var(--teal),#4FE0CE)"
              }}
            />
          </div>
          <p className="mt-2 font-mono text-xs text-white/70">
            [{metrics.total} / 108] — {filledBlocks}/12 blocos
          </p>
          <button
            type="button"
            onClick={() => navigate("/results")}
            className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-hero hover:brightness-105"
          >
            Ver Resultados
          </button>
        </section>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-3">
          <div className="rounded-card bg-surface p-4 shadow-sm">
            <p className="text-xs font-semibold text-ink-2">Scorecard de Risco</p>
            <p className="mt-1 text-3xl font-bold text-teal">{metrics.riskScore.toFixed(2)}</p>
          </div>
          <div className="rounded-card bg-surface p-4 shadow-sm">
            <p className="text-xs font-semibold text-ink-2">Coeficiente de Variação</p>
            <p className="mt-1 text-3xl font-bold text-ink">{metrics.cv.toFixed(2)}</p>
          </div>
          <div className="rounded-card bg-surface p-4 shadow-sm">
            <p className="text-xs font-semibold text-ink-2">Progresso</p>
            <p className="mt-1 text-3xl font-bold text-ink">{filledBlocks}/12</p>
          </div>
        </div>

        {/* Ações */}
        <section className="rounded-card bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-ink">Ações</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              to="/canvas"
              className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg hover:brightness-105"
            >
              Abrir Meu SRL Canvas
            </Link>
            <Link
              to="/canvas/new"
              className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-semibold text-ink-2 hover:bg-surface-2"
            >
              Novo SRL Canvas
            </Link>
          </div>
        </section>

        {/* Sobre o Projeto */}
        <section className="rounded-card bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-ink">Sobre o Projeto</h2>
          <p className="mt-2 text-sm text-ink-2">
            O nome oficial da ferramenta é{" "}
            <strong>SRL Canvas (Startup Readiness Level Canvas)</strong>. Aqui você encontra o
            contexto, propósito e público-alvo do framework.
          </p>
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="mt-3 rounded-lg border border-stroke px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2"
          >
            Ler: Por que o SRL Canvas?
          </button>
        </section>

        {/* Material de Apoio */}
        <section className="rounded-card bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-ink">Material de Apoio (Uso Offline)</h2>
          <p className="mt-2 text-sm text-ink-2">
            Não é obrigatório usar esta plataforma para aplicar o SRL Canvas. O método foi desenhado
            para ser simples e ágil: você pode baixar o guia de aplicação, o modelo do SRL Canvas e
            o gráfico radar para preenchimento manual.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SRL_DOWNLOADS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                download
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2"
              >
                {item.label}
              </a>
            ))}
          </div>
        </section>

        {/* Research Opinion Panel */}
        <ResearchOpinionPanel nextPath="/dashboard" />

        {/* Status de Sincronização */}
        <section className="rounded-card bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-ink">Status de Sincronização</h2>
          {!isEnabled && (
            <p className="mt-2 text-sm text-ink-2">
              Modo local: dados salvos apenas neste dispositivo.
            </p>
          )}
          {isEnabled && !user && (
            <p className="mt-2 text-sm text-ink-2">
              Faça login para habilitar sincronização automática do canvas.
            </p>
          )}
          {isEnabled && user && (
            <p className="mt-2 text-sm text-ink-2">
              Sincronização automática ativa durante a edição do canvas.
            </p>
          )}
        </section>

        {/* Histórico e Comparativo Temporal */}
        <section className="rounded-card bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-ink">Histórico de avaliações</h2>
          <p className="mt-1 text-xs text-ink-2">
            Use <strong className="text-ink">Comparar</strong> em qualquer avaliação para confrontar
            com outra e ver a evolução das métricas.
          </p>

          {!isEnabled && (
            <p className="mt-2 text-sm text-ink-2">
              Modo local: histórico disponível apenas com conta.
            </p>
          )}

          {isEnabled && !user && (
            <p className="mt-2 text-sm text-ink-2">
              Faça login para visualizar avaliações anteriores e comparativos de evolução.
            </p>
          )}

          {isEnabled && user && (
            <div className="mt-3 space-y-3">
              {historyError && (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Não foi possível carregar o histórico: {historyError}
                </p>
              )}

              {!historyError && historyEntries.length === 0 && (
                <p className="text-sm text-ink-2">Nenhuma avaliação remota encontrada ainda.</p>
              )}

              {!historyError && historyEntries.length > 0 && (
                <>
                  <div className="rounded-lg border border-stroke bg-inset p-3">
                    <p className="text-xs font-semibold text-ink-2">Avaliação mais recente</p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {latestHistoryEntry?.title} (Atualizado{" "}
                      {formatDateTime(latestHistoryEntry?.updatedAt ?? "")})
                    </p>
                    <p className="mt-1 font-mono text-xs text-ink-2">
                      [{latestHistoryEntry?.metrics.total ?? 0} / 108] -{" "}
                      {latestHistoryEntry?.filledBlocks ?? 0}/12 blocos preenchidos
                    </p>
                  </div>

                  <div className="space-y-2">
                    {historyEntries.map((entry, index) => {
                      const previousEntry = historyEntries[index + 1];
                      const scoreDelta = previousEntry
                        ? compareCanvasHistoryEntries(entry, previousEntry).riskScoreDelta
                        : null;
                      return (
                        <article
                          key={entry.id}
                          className="rounded-lg border border-stroke bg-inset p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-ink">
                                {entry.title} (Atualizado {formatDateTime(entry.updatedAt)})
                              </p>
                              <p className="text-xs text-ink-2">
                                Estágio: {maturityStageFromTotal(entry.metrics.total)}
                              </p>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <button
                                type="button"
                                onClick={() => setEditCanvasId(entry.id)}
                                className="rounded-md border border-stroke px-2 py-1 text-xs font-semibold text-ink-2 hover:bg-surface-2"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => setCompareBaseId(entry.id)}
                                className="rounded-md border border-stroke px-2 py-1 text-xs font-semibold text-ink-2 hover:bg-surface-2"
                              >
                                Comparar
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  navigate("/results", {
                                    state: {
                                      scores: entry.scores,
                                      projectTitle: entry.title,
                                      updatedAt: entry.updatedAt
                                    }
                                  })
                                }
                                className="rounded-md border border-stroke px-2 py-1 text-xs font-semibold text-ink-2 hover:bg-surface-2"
                              >
                                Ver Resultados
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCanvas(entry.id)}
                                className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-700/50 dark:text-red-300 dark:hover:bg-red-900/20"
                              >
                                Excluir
                              </button>
                            </div>
                          </div>
                          <p className="mt-2 font-mono text-xs text-ink-2">
                            [{entry.metrics.total} / 108] - {entry.filledBlocks}/12 blocos
                            preenchidos | Scorecard: {entry.metrics.riskScore.toFixed(2)} | CV:{" "}
                            {entry.metrics.cv.toFixed(2)}
                          </p>
                          {scoreDelta !== null && (
                            <p className="mt-1 text-xs text-ink-2">
                              Evolucao do Scorecard vs avaliação anterior:{" "}
                              <strong className="text-ink">
                                {formatSignedNumber(scoreDelta, 2)}
                              </strong>
                            </p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </div>

      <AboutSrlCanvasModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {editCanvas && (
        <EditCanvasWarningModal
          canvasTitle={editCanvas.title || buildCanvasTitle(editCanvas.meta)}
          onCancel={() => setEditCanvasId(null)}
          onCreateNew={() => {
            setEditCanvasId(null);
            navigate("/canvas/new");
          }}
          onConfirmEdit={confirmEditCanvas}
        />
      )}

      {compareBaseEntry && (
        <CanvasComparisonModal
          baseEntry={compareBaseEntry}
          entries={historyEntries}
          onClose={() => setCompareBaseId(null)}
        />
      )}
    </AppShell>
  );
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("pt-BR");
}

function formatSignedNumber(value: number, fractionDigits: number): string {
  const signal = value > 0 ? "+" : "";
  return `${signal}${value.toFixed(fractionDigits)}`;
}
