import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ResultsAnalysis } from "./ResultsAnalysis";
import { calculateScoreMetrics } from "../utils/score";

afterEach(() => cleanup());

describe("ResultsAnalysis", () => {
  it("mostra total e scorecard e os botões de export", () => {
    const scores = [9, 8, 7, 6, 5, 4, 3, 2, 1, 5, 5, 5];
    const metrics = calculateScoreMetrics(scores);
    render(<ResultsAnalysis scores={scores} metrics={metrics} darkMode={false} />);
    expect(screen.getByText(`${metrics.total} / 108`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exportar PNG/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exportar PDF/i })).toBeInTheDocument();
    expect(screen.getByText(/Resumo Interpretativo/i)).toBeInTheDocument();
  });
});
