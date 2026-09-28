import { useMemo } from "react";
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
import { PENDING_RADAR_LEGEND, radarDisplayPoints, type BlockScore } from "../utils/score";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

type PointStyle = "circle" | "crossRot";

const ANSWERED_POINT: PointStyle = "circle";
const PENDING_POINT: PointStyle = "crossRot";

const describeScore = (score: BlockScore): string =>
  score === null ? "Pendente" : `Nível ${score}`;

interface MaturityRadarProps {
  /** Notas alinhadas a SRL_BLOCKS; null = pendente (desenhado no nível 1 só para exibição). */
  scores: BlockScore[];
  darkMode: boolean;
  className?: string;
  /** Série secundária (comparação) sobreposta, em laranja tracejado. */
  compareScores?: BlockScore[];
  /** Legendas das séries [base, comparação] (exibe legenda quando há comparação). */
  seriesLabels?: [string, string];
}

export function MaturityRadar({
  scores,
  darkMode,
  className = "h-[340px] w-full",
  compareScores,
  seriesLabels
}: MaturityRadarProps) {
  const series = useMemo(
    () => (compareScores ? [scores, compareScores] : [scores]),
    [scores, compareScores]
  );
  const hasPending = series.some((values) => values.some((score) => score === null));

  const data = useMemo(() => {
    // Pendentes: posição do nível 1 com marcador "x" vazado, para não parecerem nota atribuída.
    const pointStyling = (values: BlockScore[], color: string) => {
      const { values: plotted, pending } = radarDisplayPoints(values);
      return {
        data: plotted,
        pointStyle: pending.map((isPending) => (isPending ? PENDING_POINT : ANSWERED_POINT)),
        pointRadius: pending.map((isPending) => (isPending ? 5 : 3)),
        pointBorderWidth: pending.map((isPending) => (isPending ? 2 : 1)),
        pointBorderColor: pending.map((isPending) =>
          isPending ? color : darkMode ? "#101829" : "#ffffff"
        ),
        pointBackgroundColor: pending.map((isPending) => (isPending ? "transparent" : color))
      };
    };

    const baseColor = darkMode ? "#2DC7B6" : "#0F7E7C";
    const datasets = [
      {
        label: seriesLabels?.[0] ?? "Nível SRL",
        ...pointStyling(scores, baseColor),
        borderWidth: 2.5,
        borderColor: baseColor,
        backgroundColor: darkMode ? "rgba(45,199,182,0.22)" : "rgba(15,126,124,0.18)",
        fill: true
      }
    ];

    if (compareScores) {
      datasets.push({
        label: seriesLabels?.[1] ?? "Comparação",
        ...pointStyling(compareScores, "#EA8520"),
        borderWidth: 2,
        borderColor: "#EA8520",
        backgroundColor: "rgba(234,133,32,0.10)",
        borderDash: [5, 4],
        fill: true
      } as (typeof datasets)[number]);
    }

    return {
      labels: SRL_BLOCKS.map((block) => `${block.number}. ${block.shortLabel}`),
      datasets
    };
  }, [scores, compareScores, seriesLabels, darkMode]);

  const options = useMemo(
    () => ({
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: Boolean(compareScores),
          labels: { color: darkMode ? "#E9EEF6" : "#16202E" }
        },
        tooltip: {
          callbacks: {
            label: (context: {
              datasetIndex: number;
              dataIndex: number;
              dataset: { label?: string };
            }) =>
              `${context.dataset.label ?? ""}: ${describeScore(
                series[context.datasetIndex]?.[context.dataIndex] ?? null
              )}`
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
            color: darkMode ? "#9DAAC0" : "#586271"
          },
          grid: { color: darkMode ? "rgba(157,170,192,0.3)" : "rgba(88,98,113,0.3)" },
          angleLines: { color: darkMode ? "rgba(157,170,192,0.3)" : "rgba(88,98,113,0.3)" },
          pointLabels: { color: darkMode ? "#E9EEF6" : "#16202E", font: { size: 11 } }
        }
      }
    }),
    [darkMode, compareScores, series]
  );

  const labels = seriesLabels ?? ["Nível SRL", "Comparação"];

  return (
    <>
      <div className={className}>
        <Radar
          data={data}
          options={options}
          role="img"
          aria-label="Radar de maturidade SRL; valores por bloco listados a seguir."
        />
      </div>
      <ul className="sr-only">
        {SRL_BLOCKS.map((block, index) => {
          const name = `P${block.number}. ${block.shortLabel}`;
          const text = compareScores
            ? `${name}: ${labels[0]} ${describeScore(scores[index] ?? null)}; ${labels[1]} ${describeScore(compareScores[index] ?? null)}`
            : `${name}: ${describeScore(scores[index] ?? null)}`;
          return <li key={block.id}>{text}</li>;
        })}
      </ul>
      {hasPending && <p className="mt-2 text-[11.5px] text-ink-3">{PENDING_RADAR_LEGEND}</p>}
    </>
  );
}
