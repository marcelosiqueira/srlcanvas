import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/canvasApi", () => ({ saveCanvas: vi.fn() }));

import { saveCanvas } from "../services/canvasApi";
import { useRemoteCanvasSync } from "./useRemoteCanvasSync";
import type { CanvasBlockState, CanvasMeta } from "../types";

const mockedSaveCanvas = vi.mocked(saveCanvas);
const emptyBlocks: Record<number, CanvasBlockState> = {};
const meta = (startup: string): CanvasMeta => ({ startup, evaluator: "", date: "2026-06-25" });

beforeEach(() => {
  vi.useFakeTimers();
  mockedSaveCanvas.mockReset();
  mockedSaveCanvas.mockResolvedValue({
    id: "R1",
    title: "t",
    meta: meta("x"),
    blocks: emptyBlocks,
    updated_at: ""
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useRemoteCanvasSync", () => {
  it("NÃO grava quando não há remoteCanvasId (criação é explícita pelo botão Novo)", async () => {
    renderHook(() =>
      useRemoteCanvasSync({
        enabled: true,
        userId: "u1",
        meta: meta("Nova Startup"),
        blocks: emptyBlocks,
        remoteCanvasId: null,
        debounceMs: 800
      })
    );

    await vi.advanceTimersByTimeAsync(1000);
    expect(mockedSaveCanvas).not.toHaveBeenCalled();
  });

  it("atualiza o registro existente (com id) ao mudar os dados, sem criar outro", async () => {
    renderHook(() =>
      useRemoteCanvasSync({
        enabled: true,
        userId: "u1",
        meta: meta("Empresa"),
        blocks: emptyBlocks,
        remoteCanvasId: "R1",
        debounceMs: 800
      })
    );

    await vi.advanceTimersByTimeAsync(800);
    expect(mockedSaveCanvas).toHaveBeenCalledTimes(1);
    expect(mockedSaveCanvas.mock.calls[0][0].id).toBe("R1");
  });

  type Props = Parameters<typeof useRemoteCanvasSync>[0];
  const base = (overrides: Partial<Props> = {}): Props => ({
    enabled: true,
    userId: "u1",
    meta: meta("Empresa"),
    blocks: emptyBlocks,
    remoteCanvasId: "R1",
    debounceMs: 800,
    ...overrides
  });
  const scored = (score: number): Record<number, CanvasBlockState> => ({
    1: { score, notes: "", evidence: "" }
  });

  it("ao desmontar com gravação pendente, envia imediatamente em vez de descartar", async () => {
    const { rerender, unmount } = renderHook((props: Props) => useRemoteCanvasSync(props), {
      initialProps: base()
    });
    await vi.advanceTimersByTimeAsync(800);
    mockedSaveCanvas.mockClear();

    rerender(base({ blocks: scored(7) }));
    await vi.advanceTimersByTimeAsync(100);
    unmount();

    expect(mockedSaveCanvas).toHaveBeenCalledTimes(1);
    expect(mockedSaveCanvas.mock.calls[0][0].blocks).toEqual(scored(7));
    await vi.advanceTimersByTimeAsync(2000);
    expect(mockedSaveCanvas).toHaveBeenCalledTimes(1);
  });

  it("ao esconder/fechar a aba, envia a gravação pendente com keepalive", async () => {
    const { rerender } = renderHook((props: Props) => useRemoteCanvasSync(props), {
      initialProps: base()
    });
    await vi.advanceTimersByTimeAsync(800);
    mockedSaveCanvas.mockClear();

    rerender(base({ blocks: scored(4) }));
    window.dispatchEvent(new Event("pagehide"));

    expect(mockedSaveCanvas).toHaveBeenCalledTimes(1);
    expect(mockedSaveCanvas.mock.calls[0][0]).toMatchObject({
      id: "R1",
      blocks: scored(4),
      keepalive: true
    });
  });

  it("ao trocar de canvas com gravação pendente, grava o canvas anterior no id anterior", async () => {
    const { rerender } = renderHook((props: Props) => useRemoteCanvasSync(props), {
      initialProps: base()
    });
    await vi.advanceTimersByTimeAsync(800);
    mockedSaveCanvas.mockClear();

    rerender(base({ blocks: scored(9) }));
    rerender(base({ remoteCanvasId: "R2", meta: meta("Outra"), blocks: emptyBlocks }));

    expect(mockedSaveCanvas).toHaveBeenCalledTimes(1);
    expect(mockedSaveCanvas.mock.calls[0][0]).toMatchObject({ id: "R1", blocks: scored(9) });

    await vi.advanceTimersByTimeAsync(800);
    expect(mockedSaveCanvas).toHaveBeenCalledTimes(2);
    expect(mockedSaveCanvas.mock.calls[1][0]).toMatchObject({ id: "R2", meta: meta("Outra") });
  });

  it("não reenvia quando nada mudou desde a última gravação", async () => {
    const { rerender } = renderHook((props: Props) => useRemoteCanvasSync(props), {
      initialProps: base()
    });
    await vi.advanceTimersByTimeAsync(800);
    rerender(base());
    window.dispatchEvent(new Event("pagehide"));
    await vi.advanceTimersByTimeAsync(2000);

    expect(mockedSaveCanvas).toHaveBeenCalledTimes(1);
  });
});
