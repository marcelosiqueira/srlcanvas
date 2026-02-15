function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;

  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  return fallback;
}

export const PRODUCT_METRICS_CONFIG = {
  enabled: parseBoolean(import.meta.env.VITE_PRODUCT_METRICS_ENABLED, true)
} as const;
