import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "u1", name: "Ana", email: "ana@x.com" },
    isEnabled: true,
    signOut: vi.fn()
  })
}));
vi.mock("../services/canvasApi", () => ({
  saveCanvas: vi
    .fn()
    .mockResolvedValue({ id: "NEW1", title: "t", meta: {}, blocks: {}, updated_at: "" })
}));

import { NewCanvasPage } from "./NewCanvasPage";
import { saveCanvas } from "../services/canvasApi";

const mockedSaveCanvas = vi.mocked(saveCanvas);

afterEach(() => {
  cleanup();
  mockedSaveCanvas.mockClear();
});

describe("NewCanvasPage (criação explícita)", () => {
  it("cria UM registro remoto (sem id) ao clicar em Criar Canvas", async () => {
    render(
      <MemoryRouter>
        <NewCanvasPage />
      </MemoryRouter>
    );

    // Avaliador já vem pré-preenchido com o nome da conta (editável).
    expect(screen.getByLabelText("Avaliador")).toHaveValue("Ana");

    fireEvent.change(screen.getByLabelText("Startup"), { target: { value: "Empresa X" } });
    fireEvent.click(screen.getByRole("button", { name: /Criar Canvas/i }));

    await waitFor(() => expect(mockedSaveCanvas).toHaveBeenCalledTimes(1));
    const payload = mockedSaveCanvas.mock.calls[0][0];
    expect(payload.id).toBeUndefined(); // criação, não atualização
    expect(payload.userId).toBe("u1");
  });
});
