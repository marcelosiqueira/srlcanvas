import type { CanvasBlockState, CanvasMeta } from "../types";
import { supabase } from "../lib/supabase";
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

export async function listCanvasesByUser(userId: string): Promise<RemoteCanvas[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("canvases")
    .select("id,title,meta,blocks,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RemoteCanvas[];
}

export async function saveCanvas(input: SaveCanvasInput): Promise<RemoteCanvas> {
  if (!supabase) {
    throw new Error("Supabase nao configurado");
  }

  const payload = {
    id: input.id,
    user_id: input.userId,
    title: input.title?.trim() || buildCanvasTitle(input.meta),
    meta: input.meta,
    blocks: input.blocks
  };

  const { data, error } = await supabase
    .from("canvases")
    .upsert(payload)
    .select("id,title,meta,blocks,updated_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as RemoteCanvas;
}
