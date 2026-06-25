import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditCanvasWarningModal } from "./EditCanvasWarningModal";

afterEach(() => cleanup());

describe("EditCanvasWarningModal", () => {
  it("mostra o aviso e dispara cada ação", () => {
    const onCancel = vi.fn();
    const onCreateNew = vi.fn();
    const onConfirmEdit = vi.fn();

    render(
      <EditCanvasWarningModal
        canvasTitle="Empresa X"
        onCancel={onCancel}
        onCreateNew={onCreateNew}
        onConfirmEdit={onConfirmEdit}
      />
    );

    expect(screen.getByText("Empresa X")).toBeInTheDocument();
    expect(screen.getByText(/criar um novo SRL Canvas/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Editar mesmo assim" }));
    expect(onConfirmEdit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Criar novo" }));
    expect(onCreateNew).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
