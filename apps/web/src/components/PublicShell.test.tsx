import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { PublicShell } from "./PublicShell";

afterEach(() => cleanup());

describe("PublicShell", () => {
  it("renderiza marca, título e conteúdo, sem o menu do app", () => {
    render(
      <MemoryRouter>
        <PublicShell title="Pesquisa Acadêmica">
          <p>conteúdo público</p>
        </PublicShell>
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Pesquisa Acadêmica" })
    ).toBeInTheDocument();
    expect(screen.getByText("conteúdo público")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tema/i })).toBeInTheDocument();
    // não traz a navegação do app (Meu Canvas/Dashboard/etc.)
    expect(screen.queryByRole("link", { name: /Meu Canvas/ })).toBeNull();
  });
});
