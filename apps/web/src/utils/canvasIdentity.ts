import type { CanvasMeta } from "../types";

export const DEFAULT_CANVAS_TITLE = "Meu SRL Canvas";

export function buildCanvasTitle(meta: Pick<CanvasMeta, "startup">): string {
  const startup = meta.startup.trim() || DEFAULT_CANVAS_TITLE;
  return startup;
}
