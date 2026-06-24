import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CanvasListView } from "./CanvasListView";
import { GROUPS, SRL_BLOCKS } from "../data/srlBlocks";

const emptyState = SRL_BLOCKS.reduce<
  Record<number, { score: null; notes: string; evidence: string }>
>((acc, block) => {
  acc[block.id] = { score: null, notes: "", evidence: "" };
  return acc;
}, {});

describe("CanvasListView", () => {
  afterEach(() => {
    cleanup();
  });
  it("renderiza os 4 cabeçalhos de categoria e os 12 blocos", () => {
    render(<CanvasListView blockState={emptyState} onSelectBlock={() => {}} />);
    for (const group of GROUPS) {
      expect(screen.getByText(group.name)).toBeInTheDocument();
    }
    // 12 blocos => 12 botões de bloco
    expect(screen.getAllByRole("button")).toHaveLength(SRL_BLOCKS.length);
  });

  it("mostra 'Pendente' sem score e 'Nível n' com score", () => {
    const withScore = { ...emptyState, 1: { score: 4, notes: "", evidence: "" } };
    render(<CanvasListView blockState={withScore} onSelectBlock={() => {}} />);
    expect(screen.getByText("Nível 4")).toBeInTheDocument();
    expect(screen.getAllByText("Pendente").length).toBe(SRL_BLOCKS.length - 1);
  });

  it("chama onSelectBlock com o id do bloco ao clicar", () => {
    const onSelect = vi.fn();
    render(<CanvasListView blockState={emptyState} onSelectBlock={onSelect} />);
    fireEvent.click(screen.getByText(/Problema \/ Oportunidade/).closest("button")!);
    expect(onSelect).toHaveBeenCalledWith(1);
  });
});
