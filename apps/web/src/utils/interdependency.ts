import { SRL_BLOCKS } from "../data/srlBlocks";

export interface InterdependencyAlert {
  blockId: number;
  blockNumber: number;
  blockName: string;
  score: number;
  referenceMean: number;
  message: string;
}

const MAX_LEVELS_ABOVE_REFERENCE = 2;

/**
 * Protocolo de Interdependência (guia, seção 7): a nota de um bloco não deve
 * exceder em mais de 2 níveis a média dos blocos pontuados do seu agrupamento
 * e do agrupamento Fundação (I). `scores` é alinhado à ordem de SRL_BLOCKS;
 * 0 = bloco sem nota (ignorado como referência e nunca alertado).
 */
export function detectInterdependencyAlerts(scores: number[]): InterdependencyAlert[] {
  const alerts: InterdependencyAlert[] = [];

  SRL_BLOCKS.forEach((block, index) => {
    const score = scores[index] ?? 0;
    if (score < 1) return;

    const referenceScores = SRL_BLOCKS.flatMap((candidate, candidateIndex) => {
      if (candidateIndex === index) return [];
      const candidateScore = scores[candidateIndex] ?? 0;
      if (candidateScore < 1) return [];
      const isSameGroup = candidate.group === block.group;
      const isFoundation = candidate.group === "fundacao";
      return isSameGroup || isFoundation ? [candidateScore] : [];
    });

    if (referenceScores.length === 0) return;

    const referenceMean =
      referenceScores.reduce((sum, value) => sum + value, 0) / referenceScores.length;

    if (score <= referenceMean + MAX_LEVELS_ABOVE_REFERENCE) return;

    const formattedMean = referenceMean.toFixed(1).replace(".", ",");
    alerts.push({
      blockId: block.id,
      blockNumber: block.number,
      blockName: block.name,
      score,
      referenceMean,
      message: `P${block.number}. ${block.name} (nota ${score}) excede em mais de 2 níveis a média do seu agrupamento e da Fundação (${formattedMean}). Revise se a base está suficientemente validada.`
    });
  });

  return alerts;
}
