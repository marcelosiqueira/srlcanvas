import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/canvasApi", () => ({ saveCanvas: vi.fn() }));
vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({ isEnabled: true, user: { id: "u1" } })
}));

import { saveCanvas } from "../services/canvasApi";
import { useCanvasStore } from "../store/useCanvasStore";
import { RemoteCanvasSync } from "./RemoteCanvasSync";

const mockedSaveCanvas = vi.mocked(saveCanvas);

beforeEach(() => {
  vi.useFakeTimers();
  mockedSaveCanvas.mockReset();
  mockedSaveCanvas.mockResolvedValue({} as Awaited<ReturnType<typeof saveCanvas>>);
  useCanvasStore.getState().setRemoteCanvasId("R1");
});

afterEach(() => {
  useCanvasStore.getState().setRemoteCanvasId(null);
  useCanvasStore.getState().resetCanvas();
  vi.useRealTimers();
});

describe("RemoteCanvasSync", () => {
  it("sincroniza alterações do store independentemente da página aberta (ex.: Resultados)", async () => {
    render(<RemoteCanvasSync />);
    await vi.advanceTimersByTimeAsync(800);
    mockedSaveCanvas.mockClear();

    act(() => useCanvasStore.getState().updateBlock(1, { score: 6 }));
    await vi.advanceTimersByTimeAsync(800);

    expect(mockedSaveCanvas).toHaveBeenCalledTimes(1);
    expect(mockedSaveCanvas.mock.calls[0][0]).toMatchObject({ id: "R1" });
    expect(mockedSaveCanvas.mock.calls[0][0].blocks[1].score).toBe(6);
  });
});
