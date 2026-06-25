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
});
