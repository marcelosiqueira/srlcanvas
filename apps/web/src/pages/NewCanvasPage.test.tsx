import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { NewCanvasPage } from "./NewCanvasPage";
import { AuthProvider } from "../auth/AuthProvider";

afterEach(() => cleanup());

describe("NewCanvasPage", () => {
  it("renderiza no shell com o formulário de novo canvas", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <NewCanvasPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { level: 1, name: "Novo SRL Canvas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar Canvas" })).toBeInTheDocument();
    expect(screen.getByLabelText("Startup")).toBeInTheDocument();
    // marcador exclusivo do AppShell (nav lateral + bottom nav; ausente no AppHeader/FooterNav antigo)
    expect(screen.getAllByRole("link", { name: /Meu Canvas/ }).length).toBeGreaterThan(0);
  });
});
