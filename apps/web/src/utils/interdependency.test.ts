import { describe, expect, it } from "vitest";
import { SRL_BLOCKS } from "../data/srlBlocks";
import { detectInterdependencyAlerts } from "./interdependency";

// Constrói o array de scores (alinhado a SRL_BLOCKS) a partir de um mapa por key.
const makeScores = (byKey: Record<string, number>): number[] =>
  SRL_BLOCKS.map((block) => byKey[block.key] ?? 0);

describe("detectInterdependencyAlerts", () => {
  it("não gera alertas para canvas equilibrado", () => {
    const scores = SRL_BLOCKS.map(() => 5);
    expect(detectInterdependencyAlerts(scores)).toEqual([]);
  });

  it("não gera alertas para canvas vazio", () => {
    const scores = SRL_BLOCKS.map(() => 0);
    expect(detectInterdependencyAlerts(scores)).toEqual([]);
  });

  it("alerta quando um bloco excede a média de referência em mais de 2 níveis", () => {
    // Fundação fraca (problema 3, proposta 3, equipe 3) e produto 7:
    // referência do produto = produtoMercado pontuados (exceto ele) + fundação = {3, 3, 3} → média 3
    // 7 > 3 + 2 → alerta
    const scores = makeScores({
      problema: 3,
      "proposta-de-valor": 3,
      equipe: 3,
      "produto-tecnologia": 7
    });

    const alerts = detectInterdependencyAlerts(scores);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      blockId: 3,
      blockNumber: 3,
      score: 7,
      referenceMean: 3
    });
    expect(alerts[0].message).toContain("P3. Produto / Tecnologia");
    expect(alerts[0].message).toContain("nota 7");
  });

  it("ignora blocos sem nota no cálculo da média de referência", () => {
    // Só problema (2) e produto (7) pontuados: referência do produto = {2} → média 2 → alerta
    const scores = makeScores({ problema: 2, "produto-tecnologia": 7 });

    const alerts = detectInterdependencyAlerts(scores);

    expect(alerts).toHaveLength(1);
    expect(alerts[0].referenceMean).toBe(2);
  });

  it("não alerta quando não há blocos de referência pontuados", () => {
    // Apenas um bloco pontuado: sem referência externa → sem alerta
    const scores = makeScores({ "produto-tecnologia": 9 });
    expect(detectInterdependencyAlerts(scores)).toEqual([]);
  });
});
