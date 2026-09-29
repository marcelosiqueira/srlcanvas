import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ResultsAnalysis } from "./ResultsAnalysis";
import {
  NEGATIVE_SCORECARD_NOTE,
  SCORECARD_EXPERIMENTAL_NOTE,
  summarizeAssessment
} from "../utils/score";

afterEach(() => cleanup());

const renderWith = (scores: (number | null)[]) =>
  render(
    <ResultsAnalysis scores={scores} summary={summarizeAssessment(scores)} darkMode={false} />
  );

describe("ResultsAnalysis", () => {
  it("avaliação completa: mostra total, scorecard experimental e os botões de export", () => {
    const scores = [9, 8, 7, 6, 5, 4, 3, 2, 1, 5, 5, 5];
    renderWith(scores);

    expect(screen.getByText("60 / 108")).toBeInTheDocument();
    expect(screen.getByText("Scorecard (experimental)")).toBeInTheDocument();
    expect(screen.getByText(SCORECARD_EXPERIMENTAL_NOTE)).toBeInTheDocument();
    expect(screen.queryByText(NEGATIVE_SCORECARD_NOTE)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exportar PNG/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exportar PDF/i })).toBeInTheDocument();
    expect(screen.getByText(/Resumo Interpretativo/i)).toBeInTheDocument();
  });

  it("avaliação parcial: sem total nem scorecard; soma apenas das notas respondidas", () => {
    renderWith([4, null, 2, ...new Array<null>(9).fill(null)]);

    expect(screen.getByText("Avaliação incompleta — 2/12 blocos")).toBeInTheDocument();
    expect(screen.getByText("Pontos registrados")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.queryByText(/\/ 108/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Scorecard/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Coeficiente de Variação/)).not.toBeInTheDocument();
    expect(screen.getAllByText("Nota: Pendente")).toHaveLength(10);
  });

  it("canvas vazio: 12 pendências e nenhum scorecard ou estágio", () => {
    renderWith(new Array<null>(12).fill(null));

    expect(screen.getByText("Avaliação incompleta — 0/12 blocos")).toBeInTheDocument();
    expect(screen.getAllByText("Nota: Pendente")).toHaveLength(12);
    expect(screen.queryByText(/Scorecard/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Estágio|Ideação/)).not.toBeInTheDocument();
  });

  it("scorecard negativo é preservado e explicado", () => {
    renderWith([9, ...new Array<number>(11).fill(1)]);

    expect(screen.getByText("-6,53")).toBeInTheDocument();
    expect(screen.getByText(NEGATIVE_SCORECARD_NOTE)).toBeInTheDocument();
  });
});
