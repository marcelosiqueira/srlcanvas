import { beforeEach, describe, expect, it } from "vitest";
import {
  GUEST_CANVAS_SCOPE,
  getCanvasStorageKey,
  makeInitialBlocks,
  makeInitialMeta,
  useCanvasStore
} from "./useCanvasStore";

const waitForPersist = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe("useCanvasStore", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    useCanvasStore.getState().loadCanvasScope(GUEST_CANVAS_SCOPE);
    useCanvasStore.setState({
      meta: makeInitialMeta(),
      blocks: makeInitialBlocks(),
      darkMode: false,
      storageScope: GUEST_CANVAS_SCOPE
    });
    await waitForPersist();
  });

  it("updates metadata and block fields", async () => {
    const { setMeta, updateBlock } = useCanvasStore.getState();

    setMeta({ startup: "Startup X", evaluator: "Avaliador Y" });
    updateBlock(1, { score: 7, notes: "Problema validado", evidence: "Relatorio de entrevistas" });

    await waitForPersist();

    const state = useCanvasStore.getState();
    expect(state.meta.startup).toBe("Startup X");
    expect(state.meta.evaluator).toBe("Avaliador Y");
    expect(state.blocks[1].score).toBe(7);
    expect(state.blocks[1].notes).toBe("Problema validado");
    expect(state.blocks[1].evidence).toBe("Relatorio de entrevistas");
  });

  it("resets the canvas data while keeping methods available", async () => {
    const { updateBlock, resetCanvas } = useCanvasStore.getState();

    updateBlock(2, { score: 9, notes: "Antes do reset" });
    await waitForPersist();

    resetCanvas();
    await waitForPersist();

    const state = useCanvasStore.getState();
    expect(state.blocks[2].score).toBeNull();
    expect(state.blocks[2].notes).toBe("");
    expect(typeof state.resetCanvas).toBe("function");
  });

  it("persists changes into localStorage", async () => {
    const { updateBlock } = useCanvasStore.getState();
    updateBlock(3, { score: 5 });

    await waitForPersist();

    const raw = window.localStorage.getItem(getCanvasStorageKey(GUEST_CANVAS_SCOPE));
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw as string) as {
      blocks: Record<string, { score: number | null }>;
    };

    expect(parsed.blocks["3"].score).toBe(5);
  });

  it("toggles dark mode", () => {
    const { toggleDarkMode } = useCanvasStore.getState();

    expect(useCanvasStore.getState().darkMode).toBe(false);
    toggleDarkMode();
    expect(useCanvasStore.getState().darkMode).toBe(true);
  });

  it("keeps canvas data isolated by storage scope", async () => {
    const store = useCanvasStore.getState();

    store.setMeta({ startup: "Startup Guest" });
    store.updateBlock(1, { score: 7 });
    await waitForPersist();

    store.loadCanvasScope("user-a");
    expect(useCanvasStore.getState().meta.startup).toBe("");
    expect(useCanvasStore.getState().blocks[1].score).toBeNull();

    useCanvasStore.getState().setMeta({ startup: "Startup User A" });
    useCanvasStore.getState().updateBlock(1, { score: 4 });
    await waitForPersist();

    useCanvasStore.getState().loadCanvasScope(GUEST_CANVAS_SCOPE);
    expect(useCanvasStore.getState().meta.startup).toBe("Startup Guest");
    expect(useCanvasStore.getState().blocks[1].score).toBe(7);
  });
});
