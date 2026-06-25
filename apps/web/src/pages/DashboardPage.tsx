import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AppShell } from "../components/AppShell";
import { AboutSrlCanvasModal } from "../components/AboutSrlCanvasModal";
import { ResearchOpinionPanel } from "../components/ResearchOpinionPanel";
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
  const { meta, blocks } = useCanvasStore();
  const { isEnabled, user } = useAuth();
  const navigate = useNavigate();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<CanvasHistoryEntry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [comparisonTargetId, setComparisonTargetId] = useState<string | null>(null);

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
          <h2 className="text-sm font-semibold text-ink">Histórico e Comparativo Temporal</h2>
          <div className="mt-2 rounded-lg border border-stroke bg-inset p-3 text-xs text-ink-2">
            <p className="font-semibold text-ink">Como usar este comparativo</p>
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

                  {comparisonCandidates.length > 0 && (
                    <div className="rounded-lg border border-stroke bg-inset p-3">
                      <label className="block text-xs font-medium text-ink-2">
                        Comparar com
                        <select
                          className="mt-1 block w-full rounded-md border border-stroke bg-surface p-2 text-sm text-ink focus:border-brand focus:ring-brand"
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
                          <p className="text-ink-2">
                            Delta Total:{" "}
                            <strong className="text-ink">
                              {formatSignedNumber(temporalComparison.totalDelta, 0)}
                            </strong>
                          </p>
                          <p className="text-ink-2">
                            Delta Scorecard:{" "}
                            <strong className="text-ink">
                              {formatSignedNumber(temporalComparison.riskScoreDelta, 2)}
                            </strong>
                          </p>
                          <p className="text-ink-2">
                            Delta CV:{" "}
                            <strong className="text-ink">
                              {formatSignedNumber(temporalComparison.cvDelta, 2)}
                            </strong>
                          </p>
                          <p className="text-ink-2">
                            Delta Blocos Preenchidos:{" "}
                            <strong className="text-ink">
                              {formatSignedNumber(temporalComparison.filledBlocksDelta, 0)}
                            </strong>
                          </p>
                          {temporalComparison.maturityVelocity !== null && (
                            <p className="text-ink-2 sm:col-span-2">
                              Velocidade de Maturidade:{" "}
                              <strong className="text-ink">
                                {formatSignedNumber(temporalComparison.maturityVelocity, 2)} pts/mês
                              </strong>{" "}
                              <span className="text-[11px]">
                                (reaplicação recomendada a cada 3-6 meses)
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {historyEntries.length > 1 && comparisonCandidates.length === 0 && (
                    <p className="text-xs text-ink-2">
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
    </AppShell>
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
