import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AppHeader } from "../components/AppHeader";
import { AboutSrlCanvasModal } from "../components/AboutSrlCanvasModal";
import { FooterNav } from "../components/FooterNav";
import { ResearchOpinionPanel } from "../components/ResearchOpinionPanel";
import { ResultsModal } from "../components/ResultsModal";
import type { ScoreMetrics } from "../types";
import { listCanvasesByUser } from "../services/canvasApi";
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
  const { meta, blocks, darkMode } = useCanvasStore();
  const { isEnabled, user } = useAuth();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<CanvasHistoryEntry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [comparisonTargetId, setComparisonTargetId] = useState<string | null>(null);
  const [resultsPayload, setResultsPayload] = useState<{
    scores: number[];
    metrics: ScoreMetrics;
    projectTitle: string;
    updatedAt: string | null;
  } | null>(null);

  useEffect(() => {
    if (!isEnabled || !user) return;

    let isActive = true;

    void listCanvasesByUser(user.id)
      .then((canvases) => {
        if (!isActive) return;
        setHistoryError(null);
        const entries = buildCanvasHistoryEntries(canvases);
        setHistoryEntries(entries);
        setComparisonTargetId((currentTargetId) => {
          const latestEntry = entries[0];
          const candidates = latestEntry
            ? entries
                .slice(1)
                .filter((entry) =>
                  hasMeaningfulComparisonDelta(compareCanvasHistoryEntries(latestEntry, entry))
                )
            : [];
          if (!candidates.length) return null;
          if (currentTargetId && candidates.some((entry) => entry.id === currentTargetId)) {
            return currentTargetId;
          }
          return candidates[0]?.id ?? null;
        });
      })
      .catch((error) => {
        if (!isActive) return;
        setHistoryError(error instanceof Error ? error.message : "Falha ao carregar histórico.");
        setHistoryEntries([]);
        setComparisonTargetId(null);
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
  const comparisonCandidates = useMemo(() => {
    if (!latestHistoryEntry) return [];
    return historyEntries
      .slice(1)
      .filter((entry) =>
        hasMeaningfulComparisonDelta(compareCanvasHistoryEntries(latestHistoryEntry, entry))
      );
  }, [historyEntries, latestHistoryEntry]);
  const comparisonTargetEntry = useMemo(
    () => comparisonCandidates.find((entry) => entry.id === comparisonTargetId) ?? null,
    [comparisonCandidates, comparisonTargetId]
  );
  const temporalComparison =
    latestHistoryEntry && comparisonTargetEntry
      ? compareCanvasHistoryEntries(latestHistoryEntry, comparisonTargetEntry)
      : null;

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light font-display dark:bg-background-dark">
      <AppHeader title="Dashboard" showBackButton={false} />

      <main className="flex-grow space-y-4 px-4 pb-28 pt-6">
        <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary">
              Canvas Atual
            </p>
            <button
              type="button"
              onClick={() =>
                setResultsPayload({
                  scores: currentScores,
                  metrics,
                  projectTitle: currentCanvasTitle,
                  updatedAt: latestHistoryEntry?.updatedAt ?? new Date().toISOString()
                })
              }
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
            >
              Ver Resultados
            </button>
          </div>
          <h2 className="mt-1 text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
            {currentCanvasTitle}
          </h2>
          {latestHistoryEntry && (
            <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
              (Atualizado {formatDateTime(latestHistoryEntry.updatedAt)})
            </p>
          )}
          <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Estágio: {maturityStageFromTotal(metrics.total)}
          </p>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${metrics.completion}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-mono text-text-light-secondary dark:text-text-dark-secondary">
            [{metrics.total} / 108] - {filledBlocks}/12 blocos preenchidos
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-800/70">
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Scorecard de Risco
              </p>
              <p className="mt-1 text-2xl font-bold text-primary">{metrics.riskScore.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-800/70">
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Coeficiente de Variação
              </p>
              <p className="mt-1 text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                {metrics.cv.toFixed(2)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Ações
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/canvas"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
            >
              Abrir Meu SRL Canvas
            </Link>
            <Link
              to="/canvas/new"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
            >
              Novo SRL Canvas
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <h2 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Sobre o Projeto
          </h2>
          <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            O nome oficial da ferramenta é{" "}
            <strong>SRL Canvas (Startup Readiness Level Canvas)</strong>. Aqui você encontra o
            contexto, propósito e público-alvo do framework.
          </p>
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="mt-3 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
          >
            Ler: Por que o SRL Canvas?
          </button>
        </section>

        <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Material de Apoio (Uso Offline)
          </h3>
          <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
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
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
              >
                {item.label}
              </a>
            ))}
          </div>
        </section>

        <ResearchOpinionPanel nextPath="/dashboard" />

        <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Status de Sincronização
          </h3>
          {!isEnabled && (
            <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Supabase desabilitado. Operando apenas em modo local.
            </p>
          )}
          {isEnabled && !user && (
            <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Faça login para habilitar sincronização automática do canvas.
            </p>
          )}
          {isEnabled && user && (
            <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Sincronização automática ativa durante a edição do canvas.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Histórico e Comparativo Temporal
          </h3>
          <div className="mt-2 rounded-lg border border-zinc-200/80 bg-zinc-50 p-3 text-xs text-text-light-secondary dark:border-zinc-800/80 dark:bg-zinc-800/70 dark:text-text-dark-secondary">
            <p className="font-semibold text-text-light-primary dark:text-text-dark-primary">
              Como usar este comparativo
            </p>
            <p className="mt-1">
              A avaliação mais recente é a referência. Em <strong>Comparar com</strong>, selecione
              uma avaliação anterior do seu histórico para ver a evolução.
            </p>
            <p className="mt-1">
              Delta <strong>positivo</strong> em Total/Scorecard indica melhoria. Em CV, valores
              <strong> negativos</strong> indicam maior equilíbrio entre blocos.
            </p>
          </div>

          {!isEnabled && (
            <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Supabase desabilitado. Histórico temporal disponível apenas no modo remoto.
            </p>
          )}

          {isEnabled && !user && (
            <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
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
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  Nenhuma avaliação remota encontrada ainda.
                </p>
              )}

              {!historyError && historyEntries.length > 0 && (
                <>
                  <div className="rounded-lg border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-800/70">
                    <p className="text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                      Avaliação mais recente
                    </p>
                    <p className="mt-1 text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                      {latestHistoryEntry?.title} (Atualizado{" "}
                      {formatDateTime(latestHistoryEntry?.updatedAt ?? "")})
                    </p>
                    <p className="mt-1 text-xs font-mono text-text-light-secondary dark:text-text-dark-secondary">
                      [{latestHistoryEntry?.metrics.total ?? 0} / 108] -{" "}
                      {latestHistoryEntry?.filledBlocks ?? 0}/12 blocos preenchidos
                    </p>
                  </div>

                  {comparisonCandidates.length > 0 && (
                    <div className="rounded-lg border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-800/70">
                      <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                        Comparar com
                        <select
                          className="mt-1 block w-full rounded-md border-zinc-300 bg-white p-2 text-sm text-text-light-primary focus:border-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-text-dark-primary"
                          value={comparisonTargetId ?? ""}
                          onChange={(event) => setComparisonTargetId(event.target.value)}
                        >
                          {comparisonCandidates.map((entry) => (
                            <option key={entry.id} value={entry.id}>
                              {entry.title} (Atualizado {formatDateTime(entry.updatedAt)})
                            </option>
                          ))}
                        </select>
                      </label>

                      {temporalComparison && comparisonTargetEntry && (
                        <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                          <p className="text-text-light-secondary dark:text-text-dark-secondary">
                            Delta Total:{" "}
                            <strong className="text-text-light-primary dark:text-text-dark-primary">
                              {formatSignedNumber(temporalComparison.totalDelta, 0)}
                            </strong>
                          </p>
                          <p className="text-text-light-secondary dark:text-text-dark-secondary">
                            Delta Scorecard:{" "}
                            <strong className="text-text-light-primary dark:text-text-dark-primary">
                              {formatSignedNumber(temporalComparison.riskScoreDelta, 2)}
                            </strong>
                          </p>
                          <p className="text-text-light-secondary dark:text-text-dark-secondary">
                            Delta CV:{" "}
                            <strong className="text-text-light-primary dark:text-text-dark-primary">
                              {formatSignedNumber(temporalComparison.cvDelta, 2)}
                            </strong>
                          </p>
                          <p className="text-text-light-secondary dark:text-text-dark-secondary">
                            Delta Blocos Preenchidos:{" "}
                            <strong className="text-text-light-primary dark:text-text-dark-primary">
                              {formatSignedNumber(temporalComparison.filledBlocksDelta, 0)}
                            </strong>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {historyEntries.length > 1 && comparisonCandidates.length === 0 && (
                    <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      Nenhuma avaliação anterior com diferença de métricas para comparar.
                    </p>
                  )}

                  <div className="space-y-2">
                    {historyEntries.map((entry, index) => {
                      const previousEntry = historyEntries[index + 1];
                      const scoreDelta = previousEntry
                        ? compareCanvasHistoryEntries(entry, previousEntry).riskScoreDelta
                        : null;
                      return (
                        <article
                          key={entry.id}
                          className="rounded-lg border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-800/70"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                                {entry.title} (Atualizado {formatDateTime(entry.updatedAt)})
                              </p>
                              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                                Estágio: {maturityStageFromTotal(entry.metrics.total)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setResultsPayload({
                                  scores: entry.scores,
                                  metrics: entry.metrics,
                                  projectTitle: entry.title,
                                  updatedAt: entry.updatedAt
                                })
                              }
                              className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold text-text-light-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
                            >
                              Ver Resultados
                            </button>
                          </div>
                          <p className="mt-2 text-xs font-mono text-text-light-secondary dark:text-text-dark-secondary">
                            [{entry.metrics.total} / 108] - {entry.filledBlocks}/12 blocos
                            preenchidos | Scorecard: {entry.metrics.riskScore.toFixed(2)} | CV:{" "}
                            {entry.metrics.cv.toFixed(2)}
                          </p>
                          {scoreDelta !== null && (
                            <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                              Evolucao do Scorecard vs avaliação anterior:{" "}
                              <strong className="text-text-light-primary dark:text-text-dark-primary">
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
      </main>

      <FooterNav />

      {resultsPayload && (
        <ResultsModal
          darkMode={darkMode}
          metrics={resultsPayload.metrics}
          scores={resultsPayload.scores}
          projectTitle={resultsPayload.projectTitle}
          updatedAt={resultsPayload.updatedAt}
          onClose={() => setResultsPayload(null)}
        />
      )}

      <AboutSrlCanvasModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("pt-BR");
}

function hasMeaningfulComparisonDelta(
  comparison: ReturnType<typeof compareCanvasHistoryEntries>
): boolean {
  return (
    comparison.totalDelta !== 0 ||
    Math.abs(comparison.riskScoreDelta) > 0.0001 ||
    Math.abs(comparison.cvDelta) > 0.0001 ||
    comparison.filledBlocksDelta !== 0
  );
}

function formatSignedNumber(value: number, fractionDigits: number): string {
  const signal = value > 0 ? "+" : "";
  return `${signal}${value.toFixed(fractionDigits)}`;
}
