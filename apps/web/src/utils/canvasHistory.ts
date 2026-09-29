import type { CanvasBlockState, CanvasMeta } from "../types";
import { normalizeCanvasDate } from "./canvasMeta";
import { buildCanvasTitle } from "./canvasIdentity";
import {
  scoresFromBlocks,
  summarizeAssessment,
  type AssessmentSummary,
  type BlockScore
} from "./score";

export interface CanvasHistoryInput {
  id: string;
  title: string;
  meta: CanvasMeta;
  blocks: Record<number, CanvasBlockState>;
  updated_at: string;
}

export interface CanvasHistoryEntry {
  id: string;
  title: string;
  meta: CanvasMeta;
  updatedAt: string;
  evaluatedAt: string | null;
  timelineTimestamp: number;
  /** Alinhado a SRL_BLOCKS; null = bloco pendente. */
  scores: BlockScore[];
  summary: AssessmentSummary;
}

/** Deltas consolidados são null quando alguma das avaliações está incompleta. */
export interface CanvasTemporalComparison {
  totalDelta: number | null;
  riskScoreDelta: number | null;
  cvDelta: number | null;
  answeredBlocksDelta: number;
  /** Pontos de maturidade por mês (guia, seção 5.3); null se o intervalo for menor que 1 dia. */
  maturityVelocity: number | null;
}

const toTimestamp = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.getTime();
};

const toTimelineTimestamp = (metaDate: string, updatedAt: string): number => {
  const normalizedDate = normalizeCanvasDate(metaDate);
  const metaTimestamp = normalizedDate ? toTimestamp(`${normalizedDate}T00:00:00`) : null;
  const updatedTimestamp = toTimestamp(updatedAt);
  return updatedTimestamp ?? metaTimestamp ?? 0;
};

const buildHistorySignature = (entry: CanvasHistoryEntry): string => {
  const startup = entry.meta.startup.trim().toLowerCase();
  const evaluator = entry.meta.evaluator.trim().toLowerCase();
  const evaluatedAt = entry.evaluatedAt ?? "";
  const scores = entry.scores.join(",");
  return `${startup}|${evaluator}|${evaluatedAt}|${scores}`;
};

export function buildCanvasHistoryEntries(canvases: CanvasHistoryInput[]): CanvasHistoryEntry[] {
  const ordered = canvases
    .map((canvas) => {
      const evaluatedAt = normalizeCanvasDate(canvas.meta.date);
      const scores = scoresFromBlocks(canvas.blocks);
      return {
        id: canvas.id,
        title: buildCanvasTitle(canvas.meta),
        meta: canvas.meta,
        updatedAt: canvas.updated_at,
        evaluatedAt,
        timelineTimestamp: toTimelineTimestamp(canvas.meta.date, canvas.updated_at),
        scores,
        summary: summarizeAssessment(scores)
      };
    })
    .sort((a, b) => b.timelineTimestamp - a.timelineTimestamp);

  const seenSignatures = new Set<string>();
  return ordered.filter((entry) => {
    const signature = buildHistorySignature(entry);
    if (seenSignatures.has(signature)) return false;
    seenSignatures.add(signature);
    return true;
  });
}

const MS_PER_DAY = 86_400_000;
const DAYS_PER_MONTH = 30.44;

export function compareCanvasHistoryEntries(
  current: Pick<CanvasHistoryEntry, "summary" | "timelineTimestamp">,
  previous: Pick<CanvasHistoryEntry, "summary" | "timelineTimestamp">
): CanvasTemporalComparison {
  const answeredBlocksDelta = current.summary.answeredCount - previous.summary.answeredCount;
  const currentMetrics = current.summary.metrics;
  const previousMetrics = previous.summary.metrics;

  if (!currentMetrics || !previousMetrics) {
    return {
      totalDelta: null,
      riskScoreDelta: null,
      cvDelta: null,
      answeredBlocksDelta,
      maturityVelocity: null
    };
  }

  const totalDelta = currentMetrics.total - previousMetrics.total;
  const elapsedDays = (current.timelineTimestamp - previous.timelineTimestamp) / MS_PER_DAY;
  const maturityVelocity = elapsedDays >= 1 ? totalDelta / (elapsedDays / DAYS_PER_MONTH) : null;

  return {
    totalDelta,
    riskScoreDelta: currentMetrics.riskScore - previousMetrics.riskScore,
    cvDelta: currentMetrics.cv - previousMetrics.cv,
    answeredBlocksDelta,
    maturityVelocity
  };
}
