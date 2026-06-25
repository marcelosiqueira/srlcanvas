import type { CanvasBlockState, CanvasMeta } from "../types";
import { apiFetch, isApiConfigured } from "../lib/apiClient";
import { buildCanvasTitle } from "../utils/canvasIdentity";

export interface RemoteCanvas {
  id: string;
  title: string;
  meta: CanvasMeta;
  blocks: Record<number, CanvasBlockState>;
  updated_at: string;
}

interface SaveCanvasInput {
  id?: string;
  userId: string;
  title?: string;
  meta: CanvasMeta;
  blocks: Record<number, CanvasBlockState>;
}

// O parâmetro userId é mantido por compatibilidade de assinatura com os
// consumidores existentes; o servidor identifica o usuário pelo JWT.
export async function listCanvasesByUser(_userId: string): Promise<RemoteCanvas[]> {
  void _userId;

  if (!isApiConfigured) return [];

  const data = await apiFetch<{ canvases: RemoteCanvas[] }>("/canvases");
  return data.canvases;
}

export async function saveCanvas(input: SaveCanvasInput): Promise<RemoteCanvas> {
  if (!isApiConfigured) {
    throw new Error("API não configurada");
  }

  const data = await apiFetch<{ canvas: RemoteCanvas }>("/canvases", {
    method: "PUT",
    body: {
      id: input.id,
      title: input.title?.trim() || buildCanvasTitle(input.meta),
      meta: input.meta,
      blocks: input.blocks
    }
  });

  return data.canvas;
}

export async function deleteCanvas(id: string): Promise<void> {
  if (!isApiConfigured) {
    throw new Error("API não configurada");
  }

  await apiFetch<{ ok: boolean }>(`/canvases/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}
