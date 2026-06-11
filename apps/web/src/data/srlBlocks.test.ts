import { describe, expect, it } from "vitest";
import { SRL_BLOCKS, SRL_BLOCKS_BY_ID } from "./srlBlocks";

describe("SRL_BLOCKS (guia v2)", () => {
  it("mantém os ids de armazenamento estáveis por key", () => {
    const idByKey = Object.fromEntries(SRL_BLOCKS.map((block) => [block.key, block.id]));
    expect(idByKey).toEqual({
      problema: 1,
      "proposta-de-valor": 2,
      "produto-tecnologia": 3,
      "clientes-tracao": 4,
      "adocao-crescimento": 5,
      "modelo-de-negocio": 6,
      equipe: 7,
      operacoes: 8,
      "marketing-canais": 9,
      "sustentacao-financeira": 10,
      "estrategia-visao": 11,
      "governanca-compliance": 12
    });
  });

  it("ordena o array pela numeração P1-P12 do guia (matriz 3x4)", () => {
    expect(SRL_BLOCKS.map((block) => block.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
    ]);
    expect(SRL_BLOCKS.map((block) => block.id)).toEqual([1, 2, 3, 4, 7, 8, 5, 9, 6, 10, 11, 12]);
  });

  it("define o bloco Adoção e Crescimento conforme a seção 6.8 do guia", () => {
    const block = SRL_BLOCKS_BY_ID[5];
    expect(block.name).toBe("Adoção e Crescimento");
    expect(block.number).toBe(7);
    expect(block.group).toBe("produtoMercado");
    expect(block.note).toContain("Product-Led Growth");
    expect(block.levels).toHaveLength(9);
    expect(block.levels[0].description).toBe("Crescimento dependente de esforço manual.");
    expect(block.levels[3].description).toBe("Processo de ativação estruturado.");
    expect(block.levels[8].description).toBe("Crescimento replicável e otimizado.");
    expect(block.levels[8].evidence).toBe("Playbook de crescimento.");
  });

  it("usa a numeração nova nos agrupamentos", () => {
    const fundacao = SRL_BLOCKS.filter((block) => block.group === "fundacao");
    expect(fundacao.map((block) => block.number)).toEqual([1, 2, 5]);
    const produtoMercado = SRL_BLOCKS.filter((block) => block.group === "produtoMercado");
    expect(produtoMercado.map((block) => block.number)).toEqual([3, 4, 7, 8]);
    const escala = SRL_BLOCKS.filter((block) => block.group === "escala");
    expect(escala.map((block) => block.number)).toEqual([6, 9, 10]);
  });
});
