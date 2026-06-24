import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { AuthProvider } from "../auth/AuthProvider";
import { AppShell } from "./AppShell";

afterEach(() => cleanup());

function renderShell() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AppShell title="Meu SRL Canvas">
          <p>conteúdo</p>
        </AppShell>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("AppShell", () => {
  it("renderiza título, marca, nav e o conteúdo", () => {
    renderShell();
    expect(screen.getByRole("heading", { name: "Meu SRL Canvas" })).toBeInTheDocument();
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Meu Canvas/ })[0]).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Novo SRL Canvas/ })).toBeInTheDocument();
  });

  it("tem botões de tema e sair", () => {
    renderShell();
    expect(screen.getByRole("button", { name: /tema/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
  });
});
