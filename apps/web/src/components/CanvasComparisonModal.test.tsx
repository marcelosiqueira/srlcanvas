import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("react-chartjs-2", () => ({ Radar: () => <div data-testid="radar" /> }));

import { CanvasComparisonModal } from "./CanvasComparisonModal";
import { SRL_BLOCKS } from "../data/srlBlocks";
import { buildCanvasHistoryEntries } from "../utils/canvasHistory";
import type { RemoteCanvas } from "../services/canvasApi";

afterEach(() => cleanup());

const makeCanvas = (
  id: string,
  startup: string,
  score: number,
  filledCount = SRL_BLOCKS.length
): RemoteCanvas => ({
  id,
  title: startup,
  updated_at: "2026-06-25T10:00:00.000Z",
  meta: { startup, evaluator: "", date: "2026-06-25" },
  blocks: SRL_BLOCKS.reduce<RemoteCanvas["blocks"]>((acc, block, index) => {
    acc[block.id] = { score: index < filledCount ? score : null, notes: "", evidence: "" };
    return acc;
  }, {})
});

describe("CanvasComparisonModal", () => {
  it("mostra a base, o seletor da outra avaliação e o delta das métricas", () => {
    const entries = buildCanvasHistoryEntries([
      makeCanvas("a", "Empresa A", 6),
      makeCanvas("b", "Empresa B", 4)
    ]);
    const base = entries.find((entry) => entry.title === "Empresa A")!;

    render(<CanvasComparisonModal baseEntry={base} entries={entries} onClose={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Comparar avaliações" })).toBeInTheDocument();
    expect(screen.getByText("Empresa A")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Empresa B/ })).toBeInTheDocument();
    // total A (72) - total B (48) = +24
    expect(screen.getByText("+24")).toBeInTheDocument();
  });

  it("com avaliação incompleta não compara total, CV nem scorecard e mostra Pendente", () => {
    const entries = buildCanvasHistoryEntries([
      makeCanvas("a", "Empresa A", 6),
      makeCanvas("b", "Empresa B", 4, 3)
    ]);
    const base = entries.find((entry) => entry.title === "Empresa A")!;

    render(<CanvasComparisonModal baseEntry={base} entries={entries} onClose={vi.fn()} />);

    expect(screen.queryByText("Estágio")).not.toBeInTheDocument();
    expect(screen.queryByText("+24")).not.toBeInTheDocument();
    expect(screen.getByText("3/12")).toBeInTheDocument();
    expect(screen.getByText("+9")).toBeInTheDocument();
    expect(screen.getAllByText("Incompleta").length).toBe(3);
    expect(screen.getAllByText("Pendente").length).toBe(9);
    expect(screen.getByText(/apenas entre avaliações completas/)).toBeInTheDocument();
  });
});
