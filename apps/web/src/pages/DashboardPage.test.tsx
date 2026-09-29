import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { DashboardPage } from "./DashboardPage";
import { AuthProvider } from "../auth/AuthProvider";
import { SRL_BLOCKS } from "../data/srlBlocks";
import { useCanvasStore } from "../store/useCanvasStore";

afterEach(() => {
  cleanup();
  useCanvasStore.getState().resetCanvas();
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    </MemoryRouter>
  );

describe("DashboardPage", () => {
  it("renderiza no shell com hero, métricas e ações", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("CANVAS ATUAL")).toBeInTheDocument();
    expect(screen.getByText("Scorecard (experimental)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir Meu SRL Canvas/i })).toBeInTheDocument();
  });

  it("canvas vazio: 12 pendências, sem estágio nem scorecard calculado", () => {
    renderPage();
    expect(screen.getByText("Avaliação incompleta — 0/12 blocos")).toBeInTheDocument();
    expect(screen.getByText("Pontos registrados: 0")).toBeInTheDocument();
    expect(screen.queryByText(/Estágio|Ideação/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\/ 108/)).not.toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("canvas completo: total e scorecard negativo preservado", () => {
    SRL_BLOCKS.forEach((block, index) =>
      useCanvasStore.getState().updateBlock(block.id, { score: index === 0 ? 9 : 1 })
    );
    renderPage();
    expect(screen.getByText("Total: 20 / 108")).toBeInTheDocument();
    expect(screen.getByText("-6.53")).toBeInTheDocument();
    expect(screen.queryByText(/Estágio/)).not.toBeInTheDocument();
  });
});
