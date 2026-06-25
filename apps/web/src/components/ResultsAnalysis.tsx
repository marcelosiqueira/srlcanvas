import { type RefObject, useMemo, useRef, useState } from "react";
import { SRL_BLOCKS } from "../data/srlBlocks";
import type { ScoreMetrics } from "../types";
import { detectInterdependencyAlerts } from "../utils/interdependency";
import { detectRadarPatterns } from "../utils/radarPatterns";

interface ResultsAnalysisProps {
  scores: number[];
  metrics: ScoreMetrics;
  darkMode: boolean;
  /** Elemento a capturar no export (radar+conteúdo). Se ausente, captura a própria seção. */
  captureRef?: RefObject<HTMLElement>;
}

const format = (value: number, digits = 2): string =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);

export function ResultsAnalysis({ scores, metrics, darkMode, captureRef }: ResultsAnalysisProps) {
  const [isExporting, setIsExporting] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const interpretiveResults = useMemo(
    () =>
      SRL_BLOCKS.map((block, index) => {
        const score = scores[index] ?? 0;
        const summary = block.interpretiveSummary;
        const selectedLevel = block.levels.find((item) => item.level === score) ?? null;

        if (!summary || score < 1) {
          return {
            blockId: block.id,
            blockNumber: block.number,
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
          blockNumber: block.number,
          blockName: block.name,
          score,
          band,
          selectedLevel
        };
      }),
    [scores]
  );

  const interdependencyAlerts = useMemo(() => detectInterdependencyAlerts(scores), [scores]);
  const radarPatterns = useMemo(() => detectRadarPatterns(scores), [scores]);

  const exportPng = async () => {
    const node = captureRef?.current ?? sectionRef.current;
    if (!node) return;
    setIsExporting(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: darkMode ? "#101829" : "#ffffff"
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
    const node = captureRef?.current ?? sectionRef.current;
    if (!node) return;
    setIsExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf")
      ]);
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: darkMode ? "#101829" : "#ffffff"
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const renderWidth = pageWidth - margin * 2;
      const renderHeight = (canvas.height * renderWidth) / canvas.width;
      const finalHeight =
        renderHeight <= pageHeight - margin * 2 ? renderHeight : pageHeight - margin * 2;
      pdf.addImage(imgData, "PNG", margin, margin, renderWidth, finalHeight);
      pdf.save("srl-canvas-resultados.pdf");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div ref={sectionRef} className="space-y-5">
      {/* Cards de métrica */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-card border border-stroke bg-inset p-3">
          <p className="text-xs text-ink-3">Pontuação Total</p>
          <p className="text-lg font-bold text-ink">{metrics.total} / 108</p>
        </div>
        <div className="rounded-card border border-stroke bg-inset p-3">
          <p className="text-xs text-ink-3">Média</p>
          <p className="text-lg font-bold text-ink">{format(metrics.mean)}</p>
        </div>
        <div className="rounded-card border border-stroke bg-inset p-3">
          <p className="text-xs text-ink-3">Desvio-padrão</p>
          <p className="text-lg font-bold text-ink">{format(metrics.stdDev)}</p>
        </div>
        <div className="rounded-card border border-stroke bg-inset p-3">
          <p className="text-xs text-ink-3">Coeficiente de Variação</p>
          <p className="text-lg font-bold text-ink">{format(metrics.cv)}</p>
        </div>
        <div className="rounded-card border border-stroke bg-surface-2 p-3">
          <p className="text-xs text-ink-3">Scorecard de Risco</p>
          <p className="text-lg font-bold text-teal">{format(metrics.riskScore)}</p>
        </div>
      </div>

      <p className="text-xs text-ink-3">
        Fórmula: Scorecard = Pontuação Total x (1 - Coeficiente de Variação).
      </p>

      {/* Padrões Comuns de Leitura do Radar */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-ink">Padrões Comuns de Leitura do Radar</h3>
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {radarPatterns.map((pattern) => (
            <div
              key={pattern.key}
              className={`rounded-card border p-3 text-xs ${
                pattern.applies
                  ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-200"
                  : "border-stroke bg-inset text-ink-2"
              }`}
            >
              <p className="font-semibold">
                {pattern.applies ? "⚠ " : ""}
                {pattern.title}
              </p>
              <p className="mt-1">{pattern.description}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-ink-3">
          Use esses padrões como guia, combinando sempre com evidências e contexto real.
        </p>
      </div>

      {/* Protocolo de Interdependência */}
      {interdependencyAlerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-ink">Protocolo de Interdependência</h3>
          <p className="text-xs text-ink-2">
            Análise não-linear (guia, seção 7): pontuações altas em blocos avançados devem ser
            questionadas quando os blocos de base estão imaturos. Aviso consultivo.
          </p>
          {interdependencyAlerts.map((alert) => (
            <p
              key={alert.blockId}
              className="rounded-card border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300"
            >
              {alert.message}
            </p>
          ))}
        </div>
      )}

      {/* Resumo Interpretativo por Bloco */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-ink">Resumo Interpretativo por Bloco</h3>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {interpretiveResults.map((item) => (
            <article key={item.blockId} className="rounded-card border border-stroke bg-inset p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">
                  {item.blockNumber}. {item.blockName}
                </p>
                <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-semibold text-teal">
                  Nota: {item.score > 0 ? `${item.score}/9` : "Pendente"}
                </span>
              </div>

              {!item.band && (
                <p className="mt-2 text-xs text-ink-2">Sem nota atribuída para este bloco.</p>
              )}

              {item.band && (
                <div className="mt-2 space-y-1 text-xs text-ink-2">
                  <p>
                    <strong>Agrupamento:</strong> {item.band.grouping}
                  </p>
                  <p>
                    <strong>Nível:</strong> {item.band.minLevel}-{item.band.maxLevel}
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

      {/* Botões de export */}
      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={exportPng}
          disabled={isExporting}
          className="rounded-[10px] border border-stroke px-4 py-2 text-sm font-semibold text-ink-2 disabled:opacity-70"
        >
          Exportar PNG
        </button>
        <button
          type="button"
          onClick={exportPdf}
          disabled={isExporting}
          className="rounded-[10px] border border-stroke px-4 py-2 text-sm font-semibold text-ink-2 disabled:opacity-70"
        >
          Exportar PDF
        </button>
      </div>
    </div>
  );
}
