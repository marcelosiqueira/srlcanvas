import type { CanvasMeta } from "../types";

export const DEFAULT_CANVAS_TITLE = "Meu SRL Canvas";

export function formatCanvasDate(value: string): string {
  const raw = value.trim();
  if (!raw) return "";

  const normalized = raw.includes("T") ? raw : `${raw}T00:00:00`;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) return raw;

  return parsed.toLocaleDateString("pt-BR");
}

export function buildCanvasTitle(meta: Pick<CanvasMeta, "startup" | "date">): string {
  const startup = meta.startup.trim() || DEFAULT_CANVAS_TITLE;
  const date = formatCanvasDate(meta.date);

  return date ? `${date} - ${startup}` : startup;
}
