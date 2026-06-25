import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { DashboardPage } from "./DashboardPage";
import { AuthProvider } from "../auth/AuthProvider";

afterEach(() => cleanup());

describe("DashboardPage", () => {
  it("renderiza no shell com hero, métricas e ações", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("CANVAS ATUAL")).toBeInTheDocument();
    expect(screen.getByText("Scorecard de Risco")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir Meu SRL Canvas/i })).toBeInTheDocument();
  });
});
