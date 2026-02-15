import { describe, expect, it } from "vitest";
import { SRL_BLOCKS } from "../data/srlBlocks";
import type { CanvasBlockState, ScoreMetrics } from "../types";
import {
  buildCanvasHistoryEntries,
  compareCanvasHistoryEntries,
  type CanvasHistoryInput
} from "./canvasHistory";

const makeBlocks = (filledCount: number, score: number): Record<number, CanvasBlockState> =>
  SRL_BLOCKS.reduce<Record<number, CanvasBlockState>>((acc, block, index) => {
    acc[block.id] = {
      score: index < filledCount ? score : null,
      notes: "",
      evidence: ""
    };
    return acc;
  }, {});

const makeMetrics = (overrides: Partial<ScoreMetrics>): ScoreMetrics => ({
  total: 0,
  mean: 0,
  stdDev: 0,
  cv: 0,
  riskScore: 0,
  completion: 0,
  ...overrides
});

describe("canvasHistory utilities", () => {
  it("builds history entries ordered by latest update and fallback timeline", () => {
    const input: CanvasHistoryInput[] = [
      {
        id: "older",
        title: "Older",
        meta: { startup: "A", evaluator: "Eva", date: "2026-01-10" },
        blocks: makeBlocks(4, 5),
        updated_at: "2026-01-11T10:00:00.000Z"
      },
      {
        id: "fallback-updated",
        title: "Fallback",
        meta: { startup: "B", evaluator: "Eva", date: "" },
        blocks: makeBlocks(6, 4),
        updated_at: "2026-02-14T10:00:00.000Z"
      },
      {
        id: "newer",
        title: "Newer",
        meta: { startup: "C", evaluator: "Eva", date: "2026-02-01" },
        blocks: makeBlocks(12, 3),
        updated_at: "2026-02-13T10:00:00.000Z"
      }
    ];

    const entries = buildCanvasHistoryEntries(input);

    expect(entries.map((entry) => entry.id)).toEqual(["fallback-updated", "newer", "older"]);
    expect(entries[1]?.metrics.total).toBe(36);
    expect(entries[1]?.filledBlocks).toBe(12);
  });

  it("deduplicates entries with the same startup/date/scores", () => {
    const duplicatedBlocks = makeBlocks(12, 3);
    const input: CanvasHistoryInput[] = [
      {
        id: "recent-duplicate",
        title: "Unused title",
        meta: { startup: "AGRODATA", evaluator: "Eva", date: "2026-02-12" },
        blocks: duplicatedBlocks,
        updated_at: "2026-02-15T14:02:41.000Z"
      },
      {
        id: "older-duplicate",
        title: "Unused title",
        meta: { startup: "AGRODATA", evaluator: "Eva", date: "2026-02-12" },
        blocks: duplicatedBlocks,
        updated_at: "2026-02-14T13:57:27.000Z"
      }
    ];

    const entries = buildCanvasHistoryEntries(input);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.id).toBe("recent-duplicate");
  });

  it("compares two entries and returns metric deltas", () => {
    const comparison = compareCanvasHistoryEntries(
      {
        metrics: makeMetrics({ total: 60, riskScore: 52.45, cv: 0.12, completion: 100 }),
        filledBlocks: 12
      },
      {
        metrics: makeMetrics({ total: 36, riskScore: 29.25, cv: 0.22, completion: 75 }),
        filledBlocks: 9
      }
    );

    expect(comparison.totalDelta).toBe(24);
    expect(comparison.riskScoreDelta).toBeCloseTo(23.2, 4);
    expect(comparison.cvDelta).toBeCloseTo(-0.1, 4);
    expect(comparison.completionDelta).toBe(25);
    expect(comparison.filledBlocksDelta).toBe(3);
  });
});
