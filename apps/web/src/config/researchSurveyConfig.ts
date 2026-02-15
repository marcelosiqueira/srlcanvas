import { RESEARCH_SURVEY_VERSION } from "../data/researchSurvey";

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;

  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  return fallback;
}

function parseActiveVersion(value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) return RESEARCH_SURVEY_VERSION;
  return normalized;
}

export const RESEARCH_SURVEY_CONFIG = {
  enabled: parseBoolean(import.meta.env.VITE_RESEARCH_SURVEY_ENABLED, true),
  approvedVersion: RESEARCH_SURVEY_VERSION,
  activeVersion: parseActiveVersion(import.meta.env.VITE_RESEARCH_SURVEY_ACTIVE_VERSION)
} as const;
