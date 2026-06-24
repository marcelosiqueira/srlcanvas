import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { AuthLayout } from "./AuthLayout";

afterEach(() => cleanup());

function renderLayout() {
  return render(
    <MemoryRouter>
      <AuthLayout>
        <p>conteúdo do formulário</p>
      </AuthLayout>
    </MemoryRouter>
  );
}

describe("AuthLayout", () => {
  it("renderiza a marca, o conteúdo e o toggle de tema", () => {
    renderLayout();
    expect(screen.getAllByText("SRL").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("CANVAS").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("conteúdo do formulário")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tema/i })).toBeInTheDocument();
  });
});
