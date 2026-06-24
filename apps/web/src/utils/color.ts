export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const clamped = Math.min(1, Math.max(0, alpha));
  return `rgba(${r}, ${g}, ${b}, ${clamped})`;
}
