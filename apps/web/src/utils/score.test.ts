import { describe, expect, it } from "vitest";
import { calculateScoreMetrics, maturityStageFromTotal } from "./score";

describe("calculateScoreMetrics", () => {
  it("returns zeroed metrics when all scores are zero", () => {
    const metrics = calculateScoreMetrics(new Array(12).fill(0));

    expect(metrics.total).toBe(0);
    expect(metrics.mean).toBe(0);
    expect(metrics.stdDev).toBe(0);
    expect(metrics.cv).toBe(0);
    expect(metrics.riskScore).toBe(0);
    expect(metrics.completion).toBe(0);
  });

  it("calculates the balanced profile from the SRL guide example", () => {
    const metrics = calculateScoreMetrics([4, 4, 4, 4, 4, 4, 6, 6, 6, 6, 6, 6]);

    expect(metrics.total).toBe(60);
    expect(metrics.mean).toBe(5);
    expect(metrics.stdDev).toBeCloseTo(1, 10);
    expect(metrics.cv).toBeCloseTo(0.2, 10);
    expect(metrics.riskScore).toBeCloseTo(48, 10);
    expect(metrics.completion).toBe((60 / 108) * 100);
  });

  it("normalizes non-finite values to zero", () => {
    const metrics = calculateScoreMetrics([1, Number.NaN, Number.POSITIVE_INFINITY, 2]);

    expect(metrics.total).toBe(3);
    expect(metrics.mean).toBe(0.75);
  });
});

describe("maturityStageFromTotal", () => {
  it("maps each score range to the expected maturity stage", () => {
    expect(maturityStageFromTotal(35)).toBe("Ideacao");
    expect(maturityStageFromTotal(59)).toBe("Validacao");
    expect(maturityStageFromTotal(83)).toBe("Tracao");
    expect(maturityStageFromTotal(101)).toBe("Escala");
    expect(maturityStageFromTotal(108)).toBe("Maturidade Alta");
  });
});
