import { useEffect, useMemo, useRef } from "react";
import { saveCanvas } from "../services/canvasApi";
import type { CanvasBlockState, CanvasMeta } from "../types";

interface UseRemoteCanvasSyncParams {
  enabled: boolean;
  userId: string | null;
  meta: CanvasMeta;
  blocks: Record<number, CanvasBlockState>;
  remoteCanvasId: string | null;
  /** Debounce em ms antes de gravar (default 800). */
  debounceMs?: number;
}

/**
 * Gravação remota silenciosa do canvas (debounced).
 *
 * APENAS ATUALIZA um registro existente. A criação de um novo registro é
 * explícita (botão "Novo SRL Canvas") — o auto-save NUNCA cria, para não gerar
 * registros duplicados ou vazios. Sem `remoteCanvasId`, não faz nada.
 */
export function useRemoteCanvasSync({
  enabled,
  userId,
  meta,
  blocks,
  remoteCanvasId,
  debounceMs = 800
}: UseRemoteCanvasSyncParams): void {
  const lastSyncedFingerprintRef = useRef<string | null>(null);

  const canvasFingerprint = useMemo(() => JSON.stringify({ meta, blocks }), [meta, blocks]);

  useEffect(() => {
    if (!enabled || !userId) return;
    if (!remoteCanvasId) return; // criação é explícita; auto-save só atualiza
    if (canvasFingerprint === lastSyncedFingerprintRef.current) return;

    const fingerprint = canvasFingerprint;
    const timer = window.setTimeout(() => {
      void saveCanvas({ id: remoteCanvasId, userId, meta, blocks })
        .then(() => {
          lastSyncedFingerprintRef.current = fingerprint;
        })
        .catch(() => {
          /* silencioso */
        });
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [blocks, canvasFingerprint, debounceMs, enabled, meta, remoteCanvasId, userId]);
}
