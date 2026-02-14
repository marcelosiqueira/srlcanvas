import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AppHeader } from "../components/AppHeader";
import { AboutSrlCanvasModal } from "../components/AboutSrlCanvasModal";
import { FooterNav } from "../components/FooterNav";
import { ResearchOpinionPanel } from "../components/ResearchOpinionPanel";
import { ResultsModal } from "../components/ResultsModal";
import type { ScoreMetrics } from "../types";
import { useCanvasStore } from "../store/useCanvasStore";
import { buildCanvasTitle } from "../utils/canvasIdentity";
import { calculateScoreMetrics, maturityStageFromTotal } from "../utils/score";
import { SRL_BLOCKS } from "../data/srlBlocks";
import { listCanvasesByUser, type RemoteCanvas } from "../services/canvasApi";

const SRL_DOWNLOADS = [
  {
    label: "Baixar Guia de Aplicacao",
    href: "/downloads/guia-aplicacao-srl-canvas.pdf"
  },
  {
    label: "Baixar SRL Canvas",
    href: "/downloads/srl-canvas-modelo-manual.pdf"
  },
  {
    label: "Baixar Grafico Radar",
    href: "/downloads/grafico-radar-srl-canvas.pdf"
  }
] as const;

export function DashboardPage() {
  const { meta, blocks, darkMode } = useCanvasStore();
  const { isEnabled, user } = useAuth();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [remoteCanvases, setRemoteCanvases] = useState<RemoteCanvas[]>([]);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [resultsPayload, setResultsPayload] = useState<{
    scores: number[];
    metrics: ScoreMetrics;
  } | null>(null);

  const currentScores = buildScoresFromBlocks(blocks);
  const metrics = calculateScoreMetrics(currentScores);
  const filledBlocks = SRL_BLOCKS.filter(
    (block) => typeof blocks[block.id]?.score === "number"
  ).length;
  const currentCanvasTitle = buildCanvasTitle(meta);
  const remoteCards = remoteCanvases.map((canvas) => {
    const canvasScores = buildScoresFromBlocks(canvas.blocks);
    const canvasMetrics = calculateScoreMetrics(canvasScores);
    const canvasFilledBlocks = SRL_BLOCKS.filter(
      (block) => typeof canvas.blocks[block.id]?.score === "number"
    ).length;

    return {
      id: canvas.id,
      title: buildCanvasTitle(canvas.meta),
      updatedAt: formatDateTime(canvas.updated_at),
      scores: canvasScores,
      metrics: canvasMetrics,
      filledBlocks: canvasFilledBlocks
    };
  });

  useEffect(() => {
    if (!isEnabled || !user) return;

    void listCanvasesByUser(user.id)
      .then((items) => {
        setRemoteCanvases(items);
        setRemoteError(null);
      })
      .catch((error) => {
        setRemoteError(error instanceof Error ? error.message : "Erro ao carregar canvases");
      });
  }, [isEnabled, user]);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light font-display dark:bg-background-dark">
      <AppHeader title="Dashboard" />

      <main className="flex-grow space-y-4 px-4 pb-28 pt-6">
        <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary">
              Canvas Atual
            </p>
            <button
              type="button"
              onClick={() => setResultsPayload({ scores: currentScores, metrics })}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
            >
              Ver Resultados
            </button>
          </div>
          <h2 className="mt-1 text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
            {currentCanvasTitle}
          </h2>
          <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Estagio: {maturityStageFromTotal(metrics.total)}
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
                Coeficiente de Variacao
              </p>
              <p className="mt-1 text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                {metrics.cv.toFixed(2)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200/80 bg-card-light p-4 dark:border-zinc-800/80 dark:bg-card-dark">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Acoes
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
            O nome oficial da ferramenta e <strong>SRL Canvas (Startup Readiness Level Canvas)</strong>.
            Aqui voce encontra o contexto, proposito e publico-alvo do framework.
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
            Nao e obrigatorio usar esta plataforma para aplicar o SRL Canvas. O metodo foi
            desenhado para ser simples e agil: voce pode baixar o guia de aplicacao, o modelo
            do SRL Canvas e o grafico radar para preenchimento manual.
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
            Sync de Banco
          </h3>
          {!isEnabled && (
            <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Supabase desabilitado. Operando apenas em modo local.
            </p>
          )}
          {isEnabled && !user && (
            <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Faça login para sincronizar seus canvases com o banco.
            </p>
          )}
          {isEnabled && user && (
            <div className="mt-2 space-y-2">
              {remoteError && <p className="text-xs text-red-500">{remoteError}</p>}
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Canvases remotos encontrados: <strong>{remoteCanvases.length}</strong>
              </p>
              {remoteCards.length > 0 && (
                <div className="space-y-2">
                  {remoteCards.map((canvas) => (
                    <article
                      key={canvas.id}
                      className="rounded-lg border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-800/70"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                          {canvas.title}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setResultsPayload({ scores: canvas.scores, metrics: canvas.metrics })
                          }
                          className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-white hover:brightness-110"
                        >
                          Ver Resultados
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        Atualizado em: {canvas.updatedAt}
                      </p>
                      <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        Estagio: {maturityStageFromTotal(canvas.metrics.total)}
                      </p>
                      <p className="mt-1 text-xs font-mono text-text-light-secondary dark:text-text-dark-secondary">
                        [{canvas.metrics.total} / 108] - {canvas.filledBlocks}/12 blocos preenchidos
                      </p>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                          <strong>Scorecard:</strong> {canvas.metrics.riskScore.toFixed(2)}
                        </p>
                        <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                          <strong>CV:</strong> {canvas.metrics.cv.toFixed(2)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
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
          onClose={() => setResultsPayload(null)}
        />
      )}

      <AboutSrlCanvasModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}

function buildScoresFromBlocks(
  canvasBlocks: Record<number, { score: number | null } | undefined>
): number[] {
  return SRL_BLOCKS.map((block) => {
    const value = canvasBlocks[block.id]?.score;
    return typeof value === "number" ? value : 0;
  });
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString("pt-BR");
}
