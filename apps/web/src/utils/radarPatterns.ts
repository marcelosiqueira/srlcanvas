import { SRL_BLOCKS } from "../data/srlBlocks";
import type { GroupKey } from "../types";

export interface RadarPattern {
  key: "buraco-fundacao" | "sustentacao-fraca" | "governanca-fraca" | "assimetria-agrupamento";
  title: string;
  description: string;
  applies: boolean;
}

// Heurística do app (spec 2026-06-11): fraco = média <= 3; forte = média >= 6;
// assimetria extrema = diferença >= 4 entre blocos pontuados do mesmo agrupamento.
const WEAK_MEAN = 3;
const STRONG_MEAN = 6;
const EXTREME_GAP = 4;

const scoredByGroup = (scores: number[], group: GroupKey): number[] =>
  SRL_BLOCKS.flatMap((block, index) => {
    const score = scores[index] ?? 0;
    return block.group === group && score >= 1 ? [score] : [];
  });

const mean = (values: number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

export function detectRadarPatterns(scores: number[]): RadarPattern[] {
  const fundacao = scoredByGroup(scores, "fundacao");
  const produtoMercado = scoredByGroup(scores, "produtoMercado");
  const escala = scoredByGroup(scores, "escala");
  const governanca = scoredByGroup(scores, "governanca");

  const buracoFundacao = fundacao.length >= 2 && mean(fundacao) <= WEAK_MEAN;

  const sustentacaoFraca =
    produtoMercado.length >= 2 &&
    mean(produtoMercado) >= STRONG_MEAN &&
    escala.length >= 2 &&
    mean(escala) <= WEAK_MEAN;

  const nonGovernanca = [...fundacao, ...produtoMercado, ...escala];
  const governancaFraca =
    nonGovernanca.length >= 6 &&
    mean(nonGovernanca) >= STRONG_MEAN &&
    governanca.length >= 1 &&
    mean(governanca) <= WEAK_MEAN;

  const assimetria = (["fundacao", "produtoMercado", "escala", "governanca"] as GroupKey[]).some(
    (group) => {
      const groupScores = scoredByGroup(scores, group);
      return (
        groupScores.length >= 2 &&
        Math.max(...groupScores) - Math.min(...groupScores) >= EXTREME_GAP
      );
    }
  );

  return [
    {
      key: "buraco-fundacao",
      title: "Buraco na Fundação (P1, P2 e P5 muito baixos)",
      description:
        "Risco de escalar um problema mal definido, com proposta de valor pouco clara e time desalinhado.",
      applies: buracoFundacao
    },
    {
      key: "sustentacao-fraca",
      title: "Bom Produto e Mercado, mas baixa Sustentabilidade e Escala (P6, P9 e P10 baixos)",
      description:
        "A startup vende e gera tração, mas não captura valor de forma saudável ou não tem operação estruturada para crescer.",
      applies: sustentacaoFraca
    },
    {
      key: "governanca-fraca",
      title: "Radar forte em quase tudo, mas fraco em Futuro e Governança (P11 e P12 baixos)",
      description:
        "Risco de travamento em contratos maiores, captação ou parcerias por falta de visão e base jurídica.",
      applies: governancaFraca
    },
    {
      key: "assimetria-agrupamento",
      title: "Assimetria extrema entre blocos do mesmo agrupamento",
      description:
        "Indica gargalos críticos, como muito marketing com problema mal definido, gerando desperdício.",
      applies: assimetria
    }
  ];
}
