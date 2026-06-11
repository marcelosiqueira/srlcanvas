import { describe, expect, it } from "vitest";
import { SRL_BLOCKS } from "../data/srlBlocks";
import { detectRadarPatterns } from "./radarPatterns";

const makeScores = (byKey: Record<string, number>): number[] =>
  SRL_BLOCKS.map((block) => byKey[block.key] ?? 0);

const appliedKeys = (scores: number[]): string[] =>
  detectRadarPatterns(scores)
    .filter((pattern) => pattern.applies)
    .map((pattern) => pattern.key);

describe("detectRadarPatterns", () => {
  it("sempre retorna os 4 padrões do guia", () => {
    const patterns = detectRadarPatterns(SRL_BLOCKS.map(() => 0));
    expect(patterns).toHaveLength(4);
    expect(patterns.map((pattern) => pattern.key)).toEqual([
      "buraco-fundacao",
      "sustentacao-fraca",
      "governanca-fraca",
      "assimetria-agrupamento"
    ]);
    expect(patterns.every((pattern) => !pattern.applies)).toBe(true);
  });

  it("detecta buraco na fundação (P1, P2 e P5 muito baixos)", () => {
    const scores = makeScores({
      problema: 2,
      "proposta-de-valor": 3,
      equipe: 2,
      "produto-tecnologia": 6,
      "clientes-tracao": 6
    });
    expect(appliedKeys(scores)).toContain("buraco-fundacao");
  });

  it("detecta produto e mercado bons com sustentabilidade fraca", () => {
    const scores = makeScores({
      "produto-tecnologia": 7,
      "clientes-tracao": 6,
      "marketing-canais": 7,
      operacoes: 2,
      "modelo-de-negocio": 3,
      "sustentacao-financeira": 2
    });
    expect(appliedKeys(scores)).toContain("sustentacao-fraca");
  });

  it("detecta radar forte com futuro e governança fracos", () => {
    const scores = makeScores({
      problema: 7,
      "proposta-de-valor": 7,
      "produto-tecnologia": 6,
      "clientes-tracao": 7,
      equipe: 6,
      operacoes: 6,
      "adocao-crescimento": 7,
      "marketing-canais": 6,
      "modelo-de-negocio": 7,
      "sustentacao-financeira": 6,
      "estrategia-visao": 2,
      "governanca-compliance": 3
    });
    expect(appliedKeys(scores)).toContain("governanca-fraca");
  });

  it("detecta assimetria extrema dentro de um agrupamento", () => {
    const scores = makeScores({
      problema: 8,
      "proposta-de-valor": 3,
      equipe: 5
    });
    expect(appliedKeys(scores)).toContain("assimetria-agrupamento");
  });

  it("canvas equilibrado não aplica nenhum padrão", () => {
    const scores = SRL_BLOCKS.map(() => 5);
    expect(appliedKeys(scores)).toEqual([]);
  });
});
