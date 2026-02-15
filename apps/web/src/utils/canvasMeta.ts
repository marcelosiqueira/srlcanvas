import type { CanvasMeta } from "../types";

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const BR_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

const isValidDateParts = (year: number, month: number, day: number): boolean => {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const candidate = new Date(year, month - 1, day);
  return (
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day
  );
};

const toIsoDate = (year: number, month: number, day: number): string =>
  `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export const formatTodayIso = (): string => {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
};

export const isIsoDate = (value: string): boolean => {
  const match = value.trim().match(ISO_DATE_PATTERN);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return isValidDateParts(year, month, day);
};

export const normalizeCanvasDate = (value: string): string | null => {
  const raw = value.trim();
  if (!raw) return null;

  const isoMatch = raw.match(ISO_DATE_PATTERN);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    return isValidDateParts(year, month, day) ? toIsoDate(year, month, day) : null;
  }

  const brMatch = raw.match(BR_DATE_PATTERN);
  if (brMatch) {
    const day = Number(brMatch[1]);
    const month = Number(brMatch[2]);
    const year = Number(brMatch[3]);
    return isValidDateParts(year, month, day) ? toIsoDate(year, month, day) : null;
  }

  return null;
};

export interface CanvasMetaValidation {
  startupValid: boolean;
  evaluatorValid: boolean;
  dateValid: boolean;
  isValid: boolean;
}

export const validateCanvasMeta = (
  meta: Pick<CanvasMeta, "startup" | "evaluator" | "date">
): CanvasMetaValidation => {
  const startupValid = meta.startup.trim().length > 0;
  const evaluatorValid = meta.evaluator.trim().length > 0;
  const dateValid = isIsoDate(meta.date);

  return {
    startupValid,
    evaluatorValid,
    dateValid,
    isValid: startupValid && evaluatorValid && dateValid
  };
};
