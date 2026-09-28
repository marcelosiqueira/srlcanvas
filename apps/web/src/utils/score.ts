import { SRL_BLOCKS } from "../data/srlBlocks";
import type { ScoreMetrics } from "../types";

/** Nota de um bloco: inteiro 1-9 ou null (bloco pendente, sem resposta). */
export type BlockScore = number | null;

export const TOTAL_BLOCKS = SRL_BLOCKS.length;
export const MAX_TOTAL_SCORE = TOTAL_BLOCKS * 9;

export const PENDING_RADAR_LEGEND =
  "Blocos pendentes são representados visualmente no nível 1; isso não constitui uma nota atribuída.";

export const SCORECARD_EXPERIMENTAL_NOTE =
  "Indicador experimental: não expressa probabilidade de sucesso ou fracasso da startup.";

export const NEGATIVE_SCORECARD_NOTE =
  "Valor negativo: nesta fórmula, a penalização por dispersão (Total × CV) supera a pontuação total.";

export const isAnsweredScore = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 9;

/** Notas alinhadas à ordem de SRL_BLOCKS, preservando null para blocos pendentes. */
export function scoresFromBlocks(
  blocks: Record<number, { score: number | null } | undefined>
): BlockScore[] {
  return SRL_BLOCKS.map((block) => {
    const value = blocks[block.id]?.score;
    return isAnsweredScore(value) ? value : null;
  });
}

/**
 * Métricas da dissertação (seção 8.6.2): Scorecard = Total × (1 − CV), com
 * CV = desvio-padrão populacional / média. Resultados negativos são preservados.
 * Deve ser chamada apenas com as 12 notas respondidas (ver summarizeAssessment).
 */
export const calculateScoreMetrics = (scores: number[]): ScoreMetrics => {
  const total = scores.reduce((sum, value) => sum + value, 0);
  const mean = scores.length > 0 ? total / scores.length : 0;

  const variance =
    scores.length > 0
      ? scores.reduce((sum, value) => sum + (value - mean) ** 2, 0) / scores.length
      : 0;

  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 0;
  const riskScore = total * (1 - cv);

  return { total, mean, stdDev, cv, riskScore };
};

export interface AssessmentSummary {
  answeredCount: number;
  pendingCount: number;
  isComplete: boolean;
  /** Soma apenas das notas efetivamente atribuídas (não é pontuação final). */
  registeredPoints: number;
  /** Total/CV/scorecard consolidados; null enquanto houver blocos pendentes. */
  metrics: ScoreMetrics | null;
}

/** Regra única de completude e cálculo usada por todas as telas e exportações. */
export function summarizeAssessment(scores: ReadonlyArray<BlockScore>): AssessmentSummary {
  const answered = scores.filter(isAnsweredScore);
  const answeredCount = answered.length;
  const isComplete = scores.length === TOTAL_BLOCKS && answeredCount === TOTAL_BLOCKS;

  return {
    answeredCount,
    pendingCount: TOTAL_BLOCKS - answeredCount,
    isComplete,
    registeredPoints: answered.reduce((sum, value) => sum + value, 0),
    metrics: isComplete ? calculateScoreMetrics(answered) : null
  };
}

export const assessmentStatusLabel = (summary: AssessmentSummary): string =>
  summary.isComplete
    ? `Avaliação completa — ${TOTAL_BLOCKS}/${TOTAL_BLOCKS} blocos`
    : `Avaliação incompleta — ${summary.answeredCount}/${TOTAL_BLOCKS} blocos`;

/** "Total" só existe com os 12 blocos; antes disso, apenas "Pontos registrados". */
export const assessmentPointsLabel = (summary: AssessmentSummary): string =>
  summary.metrics
    ? `Total: ${summary.metrics.total} / ${MAX_TOTAL_SCORE}`
    : `Pontos registrados: ${summary.registeredPoints}`;

export const formatBlockScore = (score: BlockScore): string =>
  isAnsweredScore(score) ? `${score}/9` : "Pendente";

/**
 * Pontos do radar: pendentes são desenhados no nível 1 apenas para exibição.
 * Não usar estes valores em cálculos, persistência ou comparativos.
 */
export function radarDisplayPoints(scores: ReadonlyArray<BlockScore>): {
  values: number[];
  pending: boolean[];
} {
  const pending = scores.map((score) => !isAnsweredScore(score));
  const values = scores.map((score) => (isAnsweredScore(score) ? score : 1));
  return { values, pending };
}
