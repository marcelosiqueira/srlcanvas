import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { AccountPage } from "./AccountPage";
import { AuthProvider } from "../auth/AuthProvider";

afterEach(() => cleanup());

describe("AccountPage", () => {
  it("renderiza no shell com Perfil e Tema", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AccountPage />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "Minha Conta" })).toBeInTheDocument();
    expect(screen.getByText("Perfil")).toBeInTheDocument();
    expect(screen.getByText("Tema")).toBeInTheDocument();
  });
});
