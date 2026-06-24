import { cleanup } from "@testing-library/react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { CanvasPage } from "./CanvasPage";
import { AuthProvider } from "../auth/AuthProvider";
import { useCanvasStore } from "../store/useCanvasStore";

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

  it("abre o modal ao clicar num bloco e fecha ao cancelar", () => {
    renderPage();
    fireEvent.click(screen.getByText(/Problema \/ Oportunidade/).closest("button")!);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/P1 ·/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
