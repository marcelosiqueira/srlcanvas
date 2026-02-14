import type { CanvasBlockState, CanvasMeta } from "../types";
import { listCanvasesByUser, saveCanvas } from "./canvasApi";
import {
  GUEST_CANVAS_SCOPE,
  hasMeaningfulCanvasData,
  readCanvasSnapshot,
  readLegacyCanvasSnapshot,
  removeCanvasSnapshot,
  removeLegacyCanvasSnapshot,
  useCanvasStore,
  writeCanvasSnapshot
} from "../store/useCanvasStore";

interface SyncCanvasScopeInput {
  userId: string | null;
  isAuthEnabled: boolean;
}

let lastSyncRequest = 0;

const toSnapshotFromRemote = (input: {
  meta: CanvasMeta;
  blocks: Record<number, CanvasBlockState>;
  darkMode: boolean;
}) => ({
  meta: input.meta,
  blocks: input.blocks,
  darkMode: input.darkMode,
  updatedAt: new Date().toISOString()
});

const migrateLegacyStorageToGuestScope = () => {
  const legacySnapshot = readLegacyCanvasSnapshot();
  if (!legacySnapshot) return;

  const guestSnapshot = readCanvasSnapshot(GUEST_CANVAS_SCOPE);
  if (!guestSnapshot || !hasMeaningfulCanvasData(guestSnapshot)) {
    writeCanvasSnapshot(GUEST_CANVAS_SCOPE, legacySnapshot);
  }

  removeLegacyCanvasSnapshot();
};

export async function syncCanvasScopeForSession(input: SyncCanvasScopeInput): Promise<void> {
  const syncId = ++lastSyncRequest;
  migrateLegacyStorageToGuestScope();

  if (!input.isAuthEnabled || !input.userId) {
    if (syncId !== lastSyncRequest) return;
    useCanvasStore.getState().loadCanvasScope(GUEST_CANVAS_SCOPE);
    return;
  }

  const userScope = input.userId;
  const currentDarkMode = useCanvasStore.getState().darkMode;
  let userSnapshot = readCanvasSnapshot(userScope);
  const guestSnapshot = readCanvasSnapshot(GUEST_CANVAS_SCOPE);

  if (!userSnapshot && guestSnapshot && hasMeaningfulCanvasData(guestSnapshot)) {
    const claimedSnapshot = {
      meta: guestSnapshot.meta,
      blocks: guestSnapshot.blocks,
      darkMode: guestSnapshot.darkMode,
      updatedAt: new Date().toISOString()
    };
    userSnapshot = claimedSnapshot;
    writeCanvasSnapshot(userScope, userSnapshot);
    removeCanvasSnapshot(GUEST_CANVAS_SCOPE);

    try {
      await saveCanvas({
        userId: input.userId,
        meta: claimedSnapshot.meta,
        blocks: claimedSnapshot.blocks
      });
    } catch (error) {
      console.error("Falha ao salvar migracao inicial do canvas no Supabase:", error);
    }
  }

  if (!userSnapshot) {
    try {
      const remoteCanvases = await listCanvasesByUser(input.userId);
      const latestRemote = remoteCanvases[0];
      if (latestRemote) {
        userSnapshot = toSnapshotFromRemote({
          meta: latestRemote.meta,
          blocks: latestRemote.blocks,
          darkMode: currentDarkMode
        });
        writeCanvasSnapshot(userScope, userSnapshot);
      }
    } catch (error) {
      console.error("Falha ao carregar canvas remoto da sessao:", error);
    }
  }

  if (syncId !== lastSyncRequest) return;
  useCanvasStore.getState().loadCanvasScope(userScope);
}
