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

  it("selecionar um nível altera apenas o rascunho; Salvar persiste nota e evidência juntas", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<BlockEditModal block={block} value={emptyValue} onClose={onClose} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Selecionar nível 5" }));
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Evidências"), { target: { value: "  contrato  " } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar/ }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ score: 5, notes: "", evidence: "contrato" });
    expect(onClose).toHaveBeenCalled();
  });

  it.each([
    ["Cancelar", () => fireEvent.click(screen.getByRole("button", { name: "Cancelar" }))],
    ["Escape", () => fireEvent.keyDown(window, { key: "Escape" })],
    [
      "clique no fundo",
      () => fireEvent.mouseDown(screen.getByRole("dialog").parentElement as HTMLElement)
    ]
  ])("%s descarta as alterações do modal sem persistir", (_label, dismiss) => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <BlockEditModal
        block={block}
        value={{ score: 2, notes: "", evidence: "original" }}
        onClose={onClose}
        onSave={onSave}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Selecionar nível 8" }));
    fireEvent.change(screen.getByLabelText("Evidências"), { target: { value: "alterada" } });
    dismiss();

    expect(onClose).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("bloco sem nota mostra Pendente, não Nível 0 ou Nível 1", () => {
    render(
      <BlockEditModal block={block} value={emptyValue} onClose={() => {}} onSave={() => {}} />
    );
    expect(screen.getByText("Pendente")).toBeInTheDocument();
    expect(screen.queryByText(/Nível [01]\/9/)).not.toBeInTheDocument();
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
