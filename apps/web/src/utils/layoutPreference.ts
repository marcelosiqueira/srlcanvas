export type CanvasLayout = "lista" | "mural";

export const LAYOUT_STORAGE_KEY = "srl-canvas-layout-v1";

export function readLayoutPreference(): CanvasLayout {
  if (typeof window === "undefined") return "lista";
  return window.localStorage.getItem(LAYOUT_STORAGE_KEY) === "mural" ? "mural" : "lista";
}

export function writeLayoutPreference(layout: CanvasLayout): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
}
