import { useCallback, useEffect, useMemo, useRef } from "react";
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

interface PendingSave {
  id: string;
  userId: string;
  meta: CanvasMeta;
  blocks: Record<number, CanvasBlockState>;
  fingerprint: string;
}

/**
 * Gravação remota silenciosa do canvas (debounced).
 *
 * APENAS ATUALIZA um registro existente. A criação de um novo registro é
 * explícita (botão "Novo SRL Canvas") — o auto-save NUNCA cria, para não gerar
 * registros duplicados ou vazios. Sem `remoteCanvasId`, não faz nada.
 *
 * Uma gravação pendente nunca é descartada: é enviada imediatamente ao trocar
 * de canvas, ao desmontar e ao esconder/fechar a aba (com keepalive).
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
  const pendingRef = useRef<PendingSave | null>(null);

  const canvasFingerprint = useMemo(() => JSON.stringify({ meta, blocks }), [meta, blocks]);

  const flush = useCallback((keepalive = false) => {
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;

    void saveCanvas({
      id: pending.id,
      userId: pending.userId,
      meta: pending.meta,
      blocks: pending.blocks,
      ...(keepalive ? { keepalive } : {})
    })
      .then(() => {
        lastSyncedFingerprintRef.current = `${pending.id}|${pending.fingerprint}`;
      })
      .catch(() => {
        /* silencioso */
      });
  }, []);

  useEffect(() => {
    // Trocou de canvas/usuário com alteração pendente: grava no registro anterior.
    const pending = pendingRef.current;
    if (pending && (pending.id !== remoteCanvasId || pending.userId !== userId)) {
      flush();
    }

    if (!enabled || !userId) return;
    if (!remoteCanvasId) return; // criação é explícita; auto-save só atualiza
    if (`${remoteCanvasId}|${canvasFingerprint}` === lastSyncedFingerprintRef.current) return;

    pendingRef.current = {
      id: remoteCanvasId,
      userId,
      meta,
      blocks,
      fingerprint: canvasFingerprint
    };
    const timer = window.setTimeout(() => flush(), debounceMs);

    return () => window.clearTimeout(timer);
  }, [blocks, canvasFingerprint, debounceMs, enabled, flush, meta, remoteCanvasId, userId]);

  useEffect(() => {
    const flushWithKeepalive = () => flush(true);
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushWithKeepalive();
    };

    window.addEventListener("pagehide", flushWithKeepalive);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", flushWithKeepalive);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      flush();
    };
  }, [flush]);
}
