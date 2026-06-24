import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BlockEditModal } from "./BlockEditModal";
import { SRL_BLOCKS_BY_ID } from "../data/srlBlocks";

afterEach(() => cleanup());

const block = SRL_BLOCKS_BY_ID[1];
const emptyValue = { score: null, notes: "", evidence: "" };

describe("BlockEditModal", () => {
  it("exibe título Pn · nome e o objetivo", () => {
    render(
      <BlockEditModal block={block} value={emptyValue} onClose={() => {}} onSave={() => {}} />
    );
    expect(screen.getByText(`P${block.number} · ${block.name}`)).toBeInTheDocument();
    expect(screen.getByText(block.objective)).toBeInTheDocument();
  });

  it("selecionar um nível aplica imediatamente via onSave", () => {
    const onSave = vi.fn();
    render(<BlockEditModal block={block} value={emptyValue} onClose={() => {}} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Selecionar nível 5" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ score: 5 }));
  });

  it("mostra a descrição do nível selecionado e oculta 'Para avançar' no nível 9", () => {
    render(
      <BlockEditModal
        block={block}
        value={{ ...emptyValue, score: 9 }}
        onClose={() => {}}
        onSave={() => {}}
      />
    );
    expect(screen.getByText(block.levels[8].description)).toBeInTheDocument();
    expect(screen.queryByText(/PARA AVANÇAR/i)).not.toBeInTheDocument();
  });
});
