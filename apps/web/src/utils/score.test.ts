import { describe, expect, it } from "vitest";
import { SRL_BLOCKS } from "../data/srlBlocks";
import type { CanvasBlockState } from "../types";
import {
  assessmentPointsLabel,
  assessmentStatusLabel,
  calculateScoreMetrics,
  formatBlockScore,
  radarDisplayPoints,
  scoresFromBlocks,
  summarizeAssessment
} from "./score";

const PENDING_12 = new Array<null>(12).fill(null);

describe("calculateScoreMetrics", () => {
  it("calculates the balanced profile from the SRL guide example", () => {
    const metrics = calculateScoreMetrics([4, 4, 4, 4, 4, 4, 6, 6, 6, 6, 6, 6]);

    expect(metrics.total).toBe(60);
    expect(metrics.mean).toBe(5);
    expect(metrics.stdDev).toBeCloseTo(1, 10);
    expect(metrics.cv).toBeCloseTo(0.2, 10);
    expect(metrics.riskScore).toBeCloseTo(48, 10);
  });

  it("preserva scorecard negativo quando CV > 1 (uma nota 9 e onze notas 1)", () => {
    const metrics = calculateScoreMetrics([9, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);

    expect(metrics.total).toBe(20);
    expect(metrics.cv).toBeGreaterThan(1);
    expect(metrics.cv).toBeCloseTo(1.3266, 4);
    expect(metrics.riskScore).toBeCloseTo(-6.53, 2);
  });
});

describe("summarizeAssessment", () => {
  it("canvas vazio: 12 pendências, sem pontos, sem scorecard", () => {
    const summary = summarizeAssessment(PENDING_12);

    expect(summary.answeredCount).toBe(0);
    expect(summary.pendingCount).toBe(12);
    expect(summary.isComplete).toBe(false);
    expect(summary.registeredPoints).toBe(0);
    expect(summary.metrics).toBeNull();
  });

  it("canvas parcial: soma apenas as notas respondidas e não calcula scorecard", () => {
    const scores = [4, null, 2, null, null, 7, null, null, null, null, null, 1];
    const summary = summarizeAssessment(scores);

    expect(summary.answeredCount).toBe(4);
    expect(summary.pendingCount).toBe(8);
    expect(summary.isComplete).toBe(false);
    expect(summary.registeredPoints).toBe(14);
    expect(summary.metrics).toBeNull();
  });

  it("distingue nota 1 explícita de ausência de resposta", () => {
    const withExplicitOne = summarizeAssessment([1, ...new Array<null>(11).fill(null)]);
    const empty = summarizeAssessment(PENDING_12);

    expect(withExplicitOne.answeredCount).toBe(1);
    expect(withExplicitOne.registeredPoints).toBe(1);
    expect(empty.answeredCount).toBe(0);
    expect(empty.registeredPoints).toBe(0);
  });

  it("canvas completo com todas as notas 1: total 12, CV 0, scorecard 12", () => {
    const summary = summarizeAssessment(new Array(12).fill(1));

    expect(summary.isComplete).toBe(true);
    expect(summary.metrics?.total).toBe(12);
    expect(summary.metrics?.cv).toBe(0);
    expect(summary.metrics?.riskScore).toBe(12);
  });

  it("canvas completo com uma nota 9 e onze notas 1: scorecard ≈ −6,53", () => {
    const summary = summarizeAssessment([9, ...new Array(11).fill(1)]);

    expect(summary.isComplete).toBe(true);
    expect(summary.metrics?.cv).toBeGreaterThan(1);
    expect(summary.metrics?.riskScore).toBeCloseTo(-6.53, 2);
  });

  it("trata valores fora do intervalo 1-9 como pendentes", () => {
    const summary = summarizeAssessment([0, 10, Number.NaN, 2.5, ...new Array(8).fill(5)]);

    expect(summary.answeredCount).toBe(8);
    expect(summary.isComplete).toBe(false);
    expect(summary.registeredPoints).toBe(40);
  });
});

describe("scoresFromBlocks", () => {
  it("mantém null para blocos sem nota, sem converter para 0 ou 1", () => {
    const blocks = SRL_BLOCKS.reduce<Record<number, CanvasBlockState>>((acc, block, index) => {
      acc[block.id] = { score: index === 0 ? 1 : null, notes: "", evidence: "" };
      return acc;
    }, {});

    const scores = scoresFromBlocks(blocks);

    expect(scores).toHaveLength(12);
    expect(scores[0]).toBe(1);
    expect(scores.slice(1).every((score) => score === null)).toBe(true);
  });
});

describe("radarDisplayPoints", () => {
  it("posiciona pendentes no nível 1 apenas para exibição, marcando-os como pendentes", () => {
    const scores = [5, null, 1, ...new Array<null>(9).fill(null)];
    const points = radarDisplayPoints(scores);

    expect(points.values.slice(0, 3)).toEqual([5, 1, 1]);
    expect(points.pending.slice(0, 3)).toEqual([false, true, false]);
    // não altera o array de origem
    expect(scores[1]).toBeNull();
  });
});

describe("formatBlockScore", () => {
  it("exibe Pendente para ausência e x/9 para nota atribuída", () => {
    expect(formatBlockScore(null)).toBe("Pendente");
    expect(formatBlockScore(1)).toBe("1/9");
  });
});

describe("rótulos de avaliação", () => {
  it("avaliação parcial: 'Avaliação incompleta' e 'Pontos registrados', sem total /108", () => {
    const summary = summarizeAssessment([4, 3, ...new Array<null>(10).fill(null)]);
    expect(assessmentStatusLabel(summary)).toBe("Avaliação incompleta — 2/12 blocos");
    expect(assessmentPointsLabel(summary)).toBe("Pontos registrados: 7");
  });

  it("avaliação completa: total sobre 108", () => {
    const summary = summarizeAssessment(new Array(12).fill(1));
    expect(assessmentStatusLabel(summary)).toBe("Avaliação completa — 12/12 blocos");
    expect(assessmentPointsLabel(summary)).toBe("Total: 12 / 108");
  });
});
