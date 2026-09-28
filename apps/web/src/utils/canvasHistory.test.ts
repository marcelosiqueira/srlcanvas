import { describe, expect, it } from "vitest";
import { SRL_BLOCKS } from "../data/srlBlocks";
import type { CanvasBlockState } from "../types";
import { summarizeAssessment, type BlockScore } from "./score";
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

const fill = (count: number, score: number): BlockScore[] =>
  Array.from({ length: 12 }, (_, index) => (index < count ? score : null));

const entryFrom = (scores: BlockScore[], timelineTimestamp: number) => ({
  summary: summarizeAssessment(scores),
  timelineTimestamp
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
    expect(entries[1]?.summary.metrics?.total).toBe(36);
    expect(entries[1]?.summary.answeredCount).toBe(12);
    // avaliação parcial: sem métricas consolidadas e com null preservado
    expect(entries[2]?.summary.metrics).toBeNull();
    expect(entries[2]?.summary.registeredPoints).toBe(20);
    expect(entries[2]?.scores[11]).toBeNull();
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

  it("compara duas avaliações completas e retorna os deltas das métricas", () => {
    const comparison = compareCanvasHistoryEntries(
      entryFrom(fill(12, 5), Date.UTC(2026, 5, 1)),
      entryFrom([9, ...new Array<number>(11).fill(1)], Date.UTC(2026, 2, 1))
    );

    expect(comparison.totalDelta).toBe(40);
    // 60 × (1 − 0) − (−6,53)
    expect(comparison.riskScoreDelta).toBeCloseTo(66.53, 2);
    expect(comparison.cvDelta).toBeLessThan(-1);
    expect(comparison.answeredBlocksDelta).toBe(0);
  });

  it("não calcula deltas consolidados quando alguma avaliação está incompleta", () => {
    const comparison = compareCanvasHistoryEntries(
      entryFrom(fill(12, 5), Date.UTC(2026, 5, 1)),
      entryFrom(fill(9, 4), Date.UTC(2026, 2, 1))
    );

    expect(comparison.totalDelta).toBeNull();
    expect(comparison.riskScoreDelta).toBeNull();
    expect(comparison.cvDelta).toBeNull();
    expect(comparison.maturityVelocity).toBeNull();
    expect(comparison.answeredBlocksDelta).toBe(3);
  });

  it("calcula a velocidade de maturidade em pontos por mês", () => {
    const comparison = compareCanvasHistoryEntries(
      entryFrom(fill(12, 5), Date.UTC(2026, 5, 1)), // 2026-06-01, total 60
      entryFrom(fill(12, 3), Date.UTC(2026, 2, 1)) // 2026-03-01, total 36, 92 dias antes
    );

    // 24 pontos em 92 dias = 24 / (92 / 30,44) ≈ 7,94 pts/mês
    expect(comparison.maturityVelocity).toBeCloseTo(24 / (92 / 30.44), 4);
  });

  it("retorna velocidade nula quando o intervalo é menor que um dia", () => {
    const comparison = compareCanvasHistoryEntries(
      entryFrom(fill(12, 5), Date.UTC(2026, 5, 1, 12)),
      entryFrom(fill(12, 3), Date.UTC(2026, 5, 1, 0))
    );

    expect(comparison.maturityVelocity).toBeNull();
  });
});
