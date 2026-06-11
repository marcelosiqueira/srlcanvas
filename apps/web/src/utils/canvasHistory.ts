import { SRL_BLOCKS } from "../data/srlBlocks";
import type { CanvasBlockState, CanvasMeta, ScoreMetrics } from "../types";
import { normalizeCanvasDate } from "./canvasMeta";
import { buildCanvasTitle } from "./canvasIdentity";
import { calculateScoreMetrics } from "./score";

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
  scores: number[];
  metrics: ScoreMetrics;
  filledBlocks: number;
}

export interface CanvasTemporalComparison {
  totalDelta: number;
  riskScoreDelta: number;
  cvDelta: number;
  completionDelta: number;
  filledBlocksDelta: number;
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

export function buildScoresFromBlocks(
  blocks: Record<number, { score: number | null } | undefined>
): number[] {
  return SRL_BLOCKS.map((block) => {
    const value = blocks[block.id]?.score;
    return typeof value === "number" ? value : 0;
  });
}

export function countFilledBlocks(
  blocks: Record<number, { score: number | null } | undefined>
): number {
  return SRL_BLOCKS.filter((block) => typeof blocks[block.id]?.score === "number").length;
}

export function buildCanvasHistoryEntries(canvases: CanvasHistoryInput[]): CanvasHistoryEntry[] {
  const ordered = canvases
    .map((canvas) => {
      const evaluatedAt = normalizeCanvasDate(canvas.meta.date);
      const scores = buildScoresFromBlocks(canvas.blocks);
      return {
        id: canvas.id,
        title: buildCanvasTitle(canvas.meta),
        meta: canvas.meta,
        updatedAt: canvas.updated_at,
        evaluatedAt,
        timelineTimestamp: toTimelineTimestamp(canvas.meta.date, canvas.updated_at),
        scores,
        metrics: calculateScoreMetrics(scores),
        filledBlocks: countFilledBlocks(canvas.blocks)
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
  current: Pick<CanvasHistoryEntry, "metrics" | "filledBlocks" | "timelineTimestamp">,
  previous: Pick<CanvasHistoryEntry, "metrics" | "filledBlocks" | "timelineTimestamp">
): CanvasTemporalComparison {
  const totalDelta = current.metrics.total - previous.metrics.total;
  const elapsedDays = (current.timelineTimestamp - previous.timelineTimestamp) / MS_PER_DAY;
  const maturityVelocity = elapsedDays >= 1 ? totalDelta / (elapsedDays / DAYS_PER_MONTH) : null;

  return {
    totalDelta,
    riskScoreDelta: current.metrics.riskScore - previous.metrics.riskScore,
    cvDelta: current.metrics.cv - previous.metrics.cv,
    completionDelta: current.metrics.completion - previous.metrics.completion,
    filledBlocksDelta: current.filledBlocks - previous.filledBlocks,
    maturityVelocity
  };
}
