import { create } from "zustand";
import { SRL_BLOCKS } from "../data/srlBlocks";
import type { CanvasBlockState, CanvasMeta } from "../types";
import { formatTodayIso, normalizeCanvasDate } from "../utils/canvasMeta";

export const LEGACY_CANVAS_STORAGE_KEY = "srl-canvas-storage-v1";
export const CANVAS_STORAGE_KEY_PREFIX = "srl-canvas-storage-v2";
export const GUEST_CANVAS_SCOPE = "guest";

export interface CanvasPersistedSnapshot {
  meta: CanvasMeta;
  blocks: Record<number, CanvasBlockState>;
  darkMode: boolean;
  remoteCanvasId: string | null;
  updatedAt: string;
}

export const formatToday = (): string => {
  return formatTodayIso();
};

const getSystemPrefersDark = (): boolean => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export const makeInitialBlocks = (): Record<number, CanvasBlockState> =>
  SRL_BLOCKS.reduce<Record<number, CanvasBlockState>>((acc, block) => {
    acc[block.id] = { score: null, notes: "", evidence: "" };
    return acc;
  }, {});

export const makeInitialMeta = (): CanvasMeta => ({
  startup: "",
  evaluator: "",
  date: formatToday()
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sanitizeMeta = (value: unknown): CanvasMeta | null => {
  if (!isRecord(value)) return null;
  const startup = typeof value.startup === "string" ? value.startup : "";
  const evaluator = typeof value.evaluator === "string" ? value.evaluator : "";
  const normalizedDate = typeof value.date === "string" ? normalizeCanvasDate(value.date) : null;
  const date = normalizedDate ?? formatToday();
  return { startup, evaluator, date };
};

const sanitizeBlocks = (value: unknown): Record<number, CanvasBlockState> | null => {
  if (!isRecord(value)) return null;

  const base = makeInitialBlocks();
  for (const block of SRL_BLOCKS) {
    const blockRaw = value[String(block.id)];
    if (!isRecord(blockRaw)) continue;

    const scoreRaw = blockRaw.score;
    const score = typeof scoreRaw === "number" && scoreRaw >= 1 && scoreRaw <= 9 ? scoreRaw : null;
    const notes = typeof blockRaw.notes === "string" ? blockRaw.notes : "";
    const evidence = typeof blockRaw.evidence === "string" ? blockRaw.evidence : "";
    base[block.id] = { score, notes, evidence };
  }

  return base;
};

const parsePersistedSnapshot = (raw: string | null): CanvasPersistedSnapshot | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return null;

    const meta = sanitizeMeta(parsed.meta);
    const blocks = sanitizeBlocks(parsed.blocks);
    if (!meta || !blocks) return null;

    const darkMode = typeof parsed.darkMode === "boolean" ? parsed.darkMode : false;
    const remoteCanvasId =
      typeof parsed.remoteCanvasId === "string" && parsed.remoteCanvasId.trim()
        ? parsed.remoteCanvasId
        : null;
    const updatedAt =
      typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString();
    return { meta, blocks, darkMode, remoteCanvasId, updatedAt };
  } catch {
    return null;
  }
};

const parseLegacySnapshot = (raw: string | null): CanvasPersistedSnapshot | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || !isRecord(parsed.state)) return null;

    const meta = sanitizeMeta(parsed.state.meta);
    const blocks = sanitizeBlocks(parsed.state.blocks);
    if (!meta || !blocks) return null;

    const darkMode = typeof parsed.state.darkMode === "boolean" ? parsed.state.darkMode : false;
    return { meta, blocks, darkMode, remoteCanvasId: null, updatedAt: new Date().toISOString() };
  } catch {
    return null;
  }
};

export const getCanvasStorageKey = (scope: string): string =>
  `${CANVAS_STORAGE_KEY_PREFIX}:${scope}`;

export const readCanvasSnapshot = (scope: string): CanvasPersistedSnapshot | null =>
  parsePersistedSnapshot(window.localStorage.getItem(getCanvasStorageKey(scope)));

export const writeCanvasSnapshot = (scope: string, snapshot: CanvasPersistedSnapshot): void => {
  window.localStorage.setItem(getCanvasStorageKey(scope), JSON.stringify(snapshot));
};

export const removeCanvasSnapshot = (scope: string): void => {
  window.localStorage.removeItem(getCanvasStorageKey(scope));
};

export const readLegacyCanvasSnapshot = (): CanvasPersistedSnapshot | null =>
  parseLegacySnapshot(window.localStorage.getItem(LEGACY_CANVAS_STORAGE_KEY));

export const removeLegacyCanvasSnapshot = (): void => {
  window.localStorage.removeItem(LEGACY_CANVAS_STORAGE_KEY);
};

export const hasMeaningfulCanvasData = (
  value: Pick<CanvasPersistedSnapshot, "meta" | "blocks"> | null
): boolean => {
  if (!value) return false;

  const hasMeta = Boolean(value.meta.startup.trim() || value.meta.evaluator.trim());
  const hasContentInBlocks = SRL_BLOCKS.some((block) => {
    const current = value.blocks[block.id];
    return Boolean(
      typeof current?.score === "number" || current?.notes.trim() || current?.evidence.trim()
    );
  });

  return hasMeta || hasContentInBlocks;
};

const makeSnapshotFromState = (
  state: Pick<CanvasStore, "meta" | "blocks" | "darkMode" | "remoteCanvasId">
): CanvasPersistedSnapshot => ({
  meta: state.meta,
  blocks: state.blocks,
  darkMode: state.darkMode,
  remoteCanvasId: state.remoteCanvasId,
  updatedAt: new Date().toISOString()
});

interface CanvasStore {
  meta: CanvasMeta;
  blocks: Record<number, CanvasBlockState>;
  darkMode: boolean;
  remoteCanvasId: string | null;
  storageScope: string;
  setMeta: (updates: Partial<CanvasMeta>) => void;
  updateBlock: (id: number, updates: Partial<CanvasBlockState>) => void;
  resetCanvas: () => void;
  toggleDarkMode: () => void;
  setRemoteCanvasId: (id: string | null) => void;
  loadCanvasScope: (scope: string) => void;
  replaceCanvas: (input: {
    meta: CanvasMeta;
    blocks: Record<number, CanvasBlockState>;
    remoteCanvasId?: string | null;
  }) => void;
}

const guestSnapshot = readCanvasSnapshot(GUEST_CANVAS_SCOPE);
const initialDarkMode = guestSnapshot?.darkMode ?? getSystemPrefersDark();

export const useCanvasStore = create<CanvasStore>()((set, get) => {
  const persistCurrentScope = () => {
    const state = get();
    writeCanvasSnapshot(state.storageScope, makeSnapshotFromState(state));
  };

  return {
    meta: guestSnapshot?.meta ?? makeInitialMeta(),
    blocks: guestSnapshot?.blocks ?? makeInitialBlocks(),
    darkMode: initialDarkMode,
    remoteCanvasId: guestSnapshot?.remoteCanvasId ?? null,
    storageScope: GUEST_CANVAS_SCOPE,
    setMeta: (updates) => {
      set((state) => ({ meta: { ...state.meta, ...updates } }));
      persistCurrentScope();
    },
    updateBlock: (id, updates) => {
      set((state) => ({
        blocks: {
          ...state.blocks,
          [id]: {
            ...state.blocks[id],
            ...updates
          }
        }
      }));
      persistCurrentScope();
    },
    resetCanvas: () => {
      set({
        meta: makeInitialMeta(),
        blocks: makeInitialBlocks()
      });
      persistCurrentScope();
    },
    toggleDarkMode: () => {
      set((state) => ({ darkMode: !state.darkMode }));
      persistCurrentScope();
    },
    setRemoteCanvasId: (id) => {
      set({ remoteCanvasId: id });
      persistCurrentScope();
    },
    loadCanvasScope: (scope) => {
      const snapshot = readCanvasSnapshot(scope);
      set((state) => ({
        storageScope: scope,
        meta: snapshot?.meta ?? makeInitialMeta(),
        blocks: snapshot?.blocks ?? makeInitialBlocks(),
        remoteCanvasId: snapshot?.remoteCanvasId ?? null,
        darkMode: snapshot?.darkMode ?? state.darkMode
      }));
      persistCurrentScope();
    },
    replaceCanvas: ({ meta, blocks, remoteCanvasId }) => {
      const normalizedDate = normalizeCanvasDate(meta.date);
      set({
        meta: { ...meta, date: normalizedDate ?? formatToday() },
        blocks,
        remoteCanvasId: remoteCanvasId ?? null
      });
      persistCurrentScope();
    }
  };
});
