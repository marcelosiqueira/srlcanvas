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

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface MaturityRadarProps {
  scores: number[];
  darkMode: boolean;
  className?: string;
}

export function MaturityRadar({
  scores,
  darkMode,
  className = "h-[340px] w-full"
}: MaturityRadarProps) {
  const data = useMemo(
    () => ({
      labels: SRL_BLOCKS.map((block) => `${block.number}. ${block.shortLabel}`),
      datasets: [
        {
          label: "Nível SRL",
          data: scores,
          borderWidth: 2.5,
          borderColor: darkMode ? "#2DC7B6" : "#0F7E7C",
          pointBackgroundColor: darkMode ? "#2DC7B6" : "#0F7E7C",
          pointBorderColor: darkMode ? "#101829" : "#ffffff",
          backgroundColor: darkMode ? "rgba(45,199,182,0.22)" : "rgba(15,126,124,0.18)",
          fill: true
        }
      ]
    }),
    [scores, darkMode]
  );

  const options = useMemo(
    () => ({
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
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
    [darkMode]
  );

  return (
    <div className={className}>
      <Radar data={data} options={options} />
    </div>
  );
}
