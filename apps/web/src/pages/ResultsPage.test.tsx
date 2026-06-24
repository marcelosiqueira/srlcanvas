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

function renderPage() {
  return render(
    <MemoryRouter>
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
});
