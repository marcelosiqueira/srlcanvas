import { useAuth } from "../auth/AuthProvider";
import { useRemoteCanvasSync } from "../hooks/useRemoteCanvasSync";
import { useCanvasStore } from "../store/useCanvasStore";

/**
 * Auto-save remoto montado uma única vez no App, para que alterações feitas em
 * qualquer tela (Canvas, Resultados) cheguem ao servidor, inclusive ao navegar.
 */
export function RemoteCanvasSync() {
  const { user, isEnabled } = useAuth();
  const meta = useCanvasStore((state) => state.meta);
  const blocks = useCanvasStore((state) => state.blocks);
  const remoteCanvasId = useCanvasStore((state) => state.remoteCanvasId);

  useRemoteCanvasSync({
    enabled: isEnabled,
    userId: user?.id ?? null,
    meta,
    blocks,
    remoteCanvasId
  });

  return null;
}
