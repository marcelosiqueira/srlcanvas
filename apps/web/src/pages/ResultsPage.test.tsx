import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResultsPage } from "./ResultsPage";
import { AuthProvider } from "../auth/AuthProvider";
import { useCanvasStore } from "../store/useCanvasStore";

vi.mock("react-chartjs-2", () => ({ Radar: () => <div data-testid="radar" /> }));

afterEach(() => {
  cleanup();
  useCanvasStore.getState().resetCanvas();
});

function renderPage(initialEntries?: object[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries ?? ["/results"]}>
      <AuthProvider>
        <ResultsPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("ResultsPage", () => {
  it("renderiza no shell com radar e Notas por dimensão", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Resultados" })).toBeInTheDocument();
    expect(screen.getByText(/Notas por dimensão/i)).toBeInTheDocument();
    // 12 tags P1..P12
    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getByText("P12")).toBeInTheDocument();
  });

  it("no modo ao vivo as notas são clicáveis (button)", () => {
    renderPage();
    expect(screen.getByText("P1").closest("button")).not.toBeNull();
  });

  it("em modo snapshot é somente leitura (sem botões de nota) e mostra 'Atualizado'", () => {
    const scores = [9, 8, 7, 6, 5, 4, 3, 2, 1, 5, 5, 5];
    renderPage([
      {
        pathname: "/results",
        state: { scores, projectTitle: "Avaliação anterior", updatedAt: "2026-06-20T10:00:00.000Z" }
      }
    ]);
    expect(screen.getByText("Avaliação anterior")).toBeInTheDocument();
    expect(screen.getByText(/Atualizado/i)).toBeInTheDocument();
    // as linhas de nota não são botões no modo snapshot
    expect(screen.getByText("P1").closest("button")).toBeNull();
  });
});
