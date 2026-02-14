import { beforeEach, describe, expect, it, vi } from "vitest";
import { listCanvasesByUser, saveCanvas } from "./canvasApi";
import { syncCanvasScopeForSession } from "./canvasSessionManager";
import {
  GUEST_CANVAS_SCOPE,
  LEGACY_CANVAS_STORAGE_KEY,
  getCanvasStorageKey,
  makeInitialBlocks,
  makeInitialMeta,
  useCanvasStore
} from "../store/useCanvasStore";

vi.mock("./canvasApi", () => ({
  listCanvasesByUser: vi.fn(),
  saveCanvas: vi.fn()
}));

describe("canvasSessionManager", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.mocked(listCanvasesByUser).mockReset();
    vi.mocked(saveCanvas).mockReset();

    useCanvasStore.setState({
      meta: makeInitialMeta(),
      blocks: makeInitialBlocks(),
      darkMode: false,
      storageScope: GUEST_CANVAS_SCOPE
    });
    useCanvasStore.getState().loadCanvasScope(GUEST_CANVAS_SCOPE);
  });

  it("migrates legacy storage into guest scope", async () => {
    const legacyPayload = {
      state: {
        meta: { startup: "Legacy Startup", evaluator: "Legacy Evaluator", date: "14/02/2026" },
        blocks: {
          1: { score: 8, notes: "Nota legada", evidence: "Evidencia legada" }
        },
        darkMode: true
      },
      version: 0
    };
    window.localStorage.setItem(LEGACY_CANVAS_STORAGE_KEY, JSON.stringify(legacyPayload));

    await syncCanvasScopeForSession({ userId: null, isAuthEnabled: false });

    expect(window.localStorage.getItem(LEGACY_CANVAS_STORAGE_KEY)).toBeNull();
    const guestRaw = window.localStorage.getItem(getCanvasStorageKey(GUEST_CANVAS_SCOPE));
    expect(guestRaw).not.toBeNull();
    expect(useCanvasStore.getState().meta.startup).toBe("Legacy Startup");
    expect(useCanvasStore.getState().blocks[1].score).toBe(8);
  });

  it("claims guest draft to first authenticated user and clears guest scope", async () => {
    window.localStorage.setItem(
      getCanvasStorageKey(GUEST_CANVAS_SCOPE),
      JSON.stringify({
        meta: { startup: "Draft Startup", evaluator: "Researcher", date: "14/02/2026" },
        blocks: {
          1: { score: 6, notes: "Draft", evidence: "Interview notes" }
        },
        darkMode: false,
        updatedAt: "2026-02-14T00:00:00.000Z"
      })
    );
    vi.mocked(saveCanvas).mockResolvedValue({
      id: "canvas-1",
      title: "Draft Startup",
      meta: { startup: "Draft Startup", evaluator: "Researcher", date: "14/02/2026" },
      blocks: makeInitialBlocks(),
      updated_at: "2026-02-14T00:00:00.000Z"
    });
    vi.mocked(listCanvasesByUser).mockResolvedValue([]);

    await syncCanvasScopeForSession({ userId: "user-1", isAuthEnabled: true });

    const userRaw = window.localStorage.getItem(getCanvasStorageKey("user-1"));
    expect(userRaw).not.toBeNull();
    expect(window.localStorage.getItem(getCanvasStorageKey(GUEST_CANVAS_SCOPE))).toBeNull();
    expect(vi.mocked(saveCanvas)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(saveCanvas)).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1"
      })
    );
    expect(useCanvasStore.getState().storageScope).toBe("user-1");
    expect(useCanvasStore.getState().meta.startup).toBe("Draft Startup");
  });

  it("loads isolated scope for a different user", async () => {
    window.localStorage.setItem(
      getCanvasStorageKey("user-1"),
      JSON.stringify({
        meta: { startup: "User One Startup", evaluator: "U1", date: "14/02/2026" },
        blocks: {
          1: { score: 9, notes: "U1", evidence: "U1 evidence" }
        },
        darkMode: false,
        updatedAt: "2026-02-14T00:00:00.000Z"
      })
    );
    vi.mocked(listCanvasesByUser).mockResolvedValue([]);

    await syncCanvasScopeForSession({ userId: "user-1", isAuthEnabled: true });
    expect(useCanvasStore.getState().meta.startup).toBe("User One Startup");

    await syncCanvasScopeForSession({ userId: "user-2", isAuthEnabled: true });
    expect(useCanvasStore.getState().storageScope).toBe("user-2");
    expect(useCanvasStore.getState().meta.startup).toBe("");
    expect(useCanvasStore.getState().blocks[1].score).toBeNull();
  });
});
