import { useMemo, useRef, useState } from "react";
import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip
} from "chart.js";
import { Radar } from "react-chartjs-2";
import { SRL_BLOCKS } from "../data/srlBlocks";
import { maturityStageFromTotal } from "../utils/score";
import type { ScoreMetrics } from "../types";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface ResultsModalProps {
  onClose: () => void;
  metrics: ScoreMetrics;
  scores: number[];
  darkMode: boolean;
}

const format = (value: number, digits = 2): string =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);

export function ResultsModal({ onClose, metrics, scores, darkMode }: ResultsModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const radarData = useMemo(
    () => ({
      labels: SRL_BLOCKS.map((block) => `${block.id}. ${block.shortLabel}`),
      datasets: [
        {
          label: "Nivel SRL",
          data: scores,
          borderWidth: 2,
          borderColor: "#135bec",
          pointBackgroundColor: "#135bec",
          pointBorderColor: "#dbe8ff",
          backgroundColor: "rgba(19, 91, 236, 0.22)",
          fill: true
        }
      ]
    }),
    [scores]
  );

  const radarOptions = useMemo(
    () => ({
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: darkMode ? "#f0f2f4" : "#111318"
          }
        }
      },
      scales: {
        r: {
          min: 0,
          max: 9,
          ticks: {
            stepSize: 1,
            backdropColor: "transparent",
            color: darkMode ? "#909cb5" : "#616f89"
          },
          grid: {
            color: darkMode ? "rgba(144, 156, 181, 0.3)" : "rgba(97, 111, 137, 0.3)"
          },
          angleLines: {
            color: darkMode ? "rgba(144, 156, 181, 0.3)" : "rgba(97, 111, 137, 0.3)"
          },
          pointLabels: {
            color: darkMode ? "#f0f2f4" : "#111318",
            font: {
              size: 11
            }
          }
        }
      }
    }),
    [darkMode]
  );

  const interpretiveResults = useMemo(
    () =>
      SRL_BLOCKS.map((block, index) => {
        const score = scores[index] ?? 0;
        const summary = block.interpretiveSummary;
        const selectedLevel = block.levels.find((item) => item.level === score) ?? null;

        if (!summary || score < 1) {
          return {
            blockId: block.id,
            blockName: block.name,
            score,
            band: null,
            selectedLevel
          };
        }

        const band =
          summary.bands.find((item) => score >= item.minLevel && score <= item.maxLevel) ?? null;

        return {
          blockId: block.id,
          blockName: block.name,
          score,
          band,
          selectedLevel
        };
      }),
    [scores]
  );

  const exportPng = async () => {
    if (!cardRef.current) return;

    setIsExporting(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: darkMode ? "#1a2230" : "#ffffff"
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "srl-canvas-resultados.png";
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  const exportPdf = async () => {
    if (!cardRef.current) return;

    setIsExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf")
      ]);

      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: darkMode ? "#1a2230" : "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const renderWidth = pageWidth - margin * 2;
      const renderHeight = (canvas.height * renderWidth) / canvas.width;

      if (renderHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, "PNG", margin, margin, renderWidth, renderHeight);
      } else {
        const resizedHeight = pageHeight - margin * 2;
        pdf.addImage(imgData, "PNG", margin, margin, renderWidth, resizedHeight);
      }

      pdf.save("srl-canvas-resultados.pdf");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/55 p-4 md:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Resultados do SRL Canvas"
    >
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-card-light shadow-2xl dark:bg-card-dark">
        <div className="flex items-center justify-between border-b border-zinc-200/80 p-4 dark:border-zinc-800/80">
          <h2 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
            Diagnostico SRL Canvas
          </h2>
          <button
            type="button"
            className="rounded-md p-2 text-text-light-secondary hover:bg-zinc-100 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
            onClick={onClose}
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-5 p-4 md:p-6">
          <div
            ref={cardRef}
            className="space-y-5 rounded-xl border border-zinc-200/80 p-4 dark:border-zinc-800/80"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                Radar de Maturidade (12 blocos)
              </p>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20">
                Estagio: {maturityStageFromTotal(metrics.total)}
              </span>
            </div>

            <div className="h-[340px] w-full">
              <Radar data={radarData} options={radarOptions} />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  Pontuacao Total
                </p>
                <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                  {metrics.total} / 108
                </p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  Media
                </p>
                <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                  {format(metrics.mean)}
                </p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  Desvio-padrao
                </p>
                <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                  {format(metrics.stdDev)}
                </p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  Coeficiente de Variacao
                </p>
                <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                  {format(metrics.cv)}
                </p>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 dark:border-primary/40 dark:bg-primary/10">
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  Scorecard de Risco
                </p>
                <p className="text-lg font-bold text-primary">{format(metrics.riskScore)}</p>
              </div>
            </div>

            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              Formula: Scorecard = Pontuacao Total x (1 - Coeficiente de Variacao).
            </p>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                Resumo Interpretativo por Bloco
              </h3>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {interpretiveResults.map((item) => (
                  <article
                    key={item.blockId}
                    className="rounded-lg border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-800/60"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                        {item.blockId}. {item.blockName}
                      </p>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary dark:bg-primary/20">
                        Nota: {item.score > 0 ? `${item.score}/9` : "Pendente"}
                      </span>
                    </div>

                    {!item.band && (
                      <p className="mt-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        Sem nota atribuida para este bloco.
                      </p>
                    )}

                    {item.band && (
                      <div className="mt-2 space-y-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        <p>
                          <strong>Agrupamento:</strong> {item.band.grouping}
                        </p>
                        <p>
                          <strong>Nivel:</strong> {item.band.minLevel}-{item.band.maxLevel}
                        </p>
                        <p>
                          <strong>Foco estratégico:</strong> {item.band.strategicFocus}
                        </p>
                        {item.selectedLevel && (
                          <>
                            <p>
                              <strong>Descrição do nível:</strong> {item.selectedLevel.description}
                            </p>
                            <p>
                              <strong>Evidência sugerida:</strong> {item.selectedLevel.evidence}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={exportPng}
              disabled={isExporting}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
            >
              Exportar PNG
            </button>
            <button
              type="button"
              onClick={exportPdf}
              disabled={isExporting}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-text-light-secondary hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-zinc-700 dark:text-text-dark-secondary dark:hover:bg-zinc-800"
            >
              Exportar PDF
            </button>
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
              onClick={onClose}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
