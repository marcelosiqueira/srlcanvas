import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CanvasMuralView } from "./CanvasMuralView";
import { SRL_BLOCKS } from "../data/srlBlocks";

afterEach(() => cleanup());

const emptyState = SRL_BLOCKS.reduce<
  Record<number, { score: null; notes: string; evidence: string }>
>((acc, block) => {
  acc[block.id] = { score: null, notes: "", evidence: "" };
  return acc;
}, {});

describe("CanvasMuralView", () => {
  it("renderiza 12 cards com contador n/9", () => {
    const withScore = { ...emptyState, 1: { score: 1, notes: "", evidence: "" } };
    render(<CanvasMuralView blockState={withScore} onSelectBlock={() => {}} />);
    expect(screen.getAllByRole("button")).toHaveLength(SRL_BLOCKS.length);
    expect(screen.getByText("1/9")).toBeInTheDocument();
    expect(screen.getAllByText("0/9").length).toBe(SRL_BLOCKS.length - 1);
  });

  it("chama onSelectBlock ao clicar num card", () => {
    const onSelect = vi.fn();
    render(<CanvasMuralView blockState={emptyState} onSelectBlock={onSelect} />);
    fireEvent.click(screen.getByText(/Problema \/ Oportunidade/).closest("button")!);
    expect(onSelect).toHaveBeenCalledWith(1);
  });
});
