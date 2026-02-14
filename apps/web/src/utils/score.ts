import type { ScoreMetrics } from "../types";

const MAX_SCORE = 108;

export const calculateScoreMetrics = (scores: number[]): ScoreMetrics => {
  const values = scores.map((value) => (Number.isFinite(value) ? value : 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  const mean = values.length > 0 ? total / values.length : 0;

  const variance =
    values.length > 0
      ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
      : 0;

  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 0;
  const riskScore = Math.max(0, total * (1 - cv));
  const completion = (total / MAX_SCORE) * 100;

  return {
    total,
    mean,
    stdDev,
    cv,
    riskScore,
    completion
  };
};

export const maturityStageFromTotal = (total: number): string => {
  if (total <= 35) return "Ideacao";
  if (total <= 59) return "Validacao";
  if (total <= 83) return "Tracao";
  if (total <= 101) return "Escala";
  return "Maturidade Alta";
};
