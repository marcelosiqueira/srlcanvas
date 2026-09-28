import { cleanup } from "@testing-library/react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { CanvasPage } from "./CanvasPage";
import { AuthProvider } from "../auth/AuthProvider";
import { useCanvasStore } from "../store/useCanvasStore";
import { SRL_BLOCKS } from "../data/srlBlocks";

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <CanvasPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  useCanvasStore.getState().resetCanvas();
});

describe("CanvasPage", () => {
  it("renderiza dentro do shell com Informações Gerais e toolbar", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Meu SRL Canvas" })).toBeInTheDocument();
    expect(screen.getByText("Informações Gerais")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lista" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mural Canvas" })).toBeInTheDocument();
  });

  it("alterna para Mural e persiste a preferência", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Mural Canvas" }));
    expect(window.localStorage.getItem("srl-canvas-layout-v1")).toBe("mural");
  });

  it("o botão Ver Resultados aponta para navegação (não abre modal)", () => {
    renderPage();
    const botao = screen.getByRole("button", { name: /Ver Resultados/i });
    expect(botao).toBeInTheDocument();
    // não deve existir diálogo de resultados aberto na tela inicial
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("abre o modal ao clicar num bloco e fecha ao cancelar", () => {
    renderPage();
    fireEvent.click(screen.getByText(/Problema e Oportunidade/).closest("button")!);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/P1 ·/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("canvas vazio mostra avaliação incompleta e pontos registrados, sem total /108", () => {
    renderPage();
    expect(screen.getByText("Avaliação incompleta — 0/12 blocos")).toBeInTheDocument();
    expect(screen.getByText("Pontos registrados: 0")).toBeInTheDocument();
    expect(screen.queryByText(/\/ 108/)).not.toBeInTheDocument();
  });

  it("cancelar o modal após escolher um nível não persiste a nota", () => {
    renderPage();
    fireEvent.click(screen.getByText(/Problema e Oportunidade/).closest("button")!);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Selecionar nível 7" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    const firstBlockId = SRL_BLOCKS[0].id;
    expect(useCanvasStore.getState().blocks[firstBlockId].score).toBeNull();
    expect(screen.getByText("Pontos registrados: 0")).toBeInTheDocument();
  });

  it("salvar persiste a nota e atualiza os pontos registrados", () => {
    renderPage();
    fireEvent.click(screen.getByText(/Problema e Oportunidade/).closest("button")!);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Selecionar nível 1" }));
    fireEvent.click(within(dialog).getByRole("button", { name: /Salvar/ }));

    expect(useCanvasStore.getState().blocks[SRL_BLOCKS[0].id].score).toBe(1);
    expect(screen.getByText("Avaliação incompleta — 1/12 blocos")).toBeInTheDocument();
    expect(screen.getByText("Pontos registrados: 1")).toBeInTheDocument();
  });
});
