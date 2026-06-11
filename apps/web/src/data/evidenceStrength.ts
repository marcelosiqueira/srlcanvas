export interface EvidenceStrengthLevel {
  level: number;
  name: string;
  type: string;
  example: string;
}

// Guia SRL Canvas v2, seção 3 (Protocolo de Evidências).
export const EVIDENCE_STRENGTH_LEVELS: EvidenceStrengthLevel[] = [
  {
    level: 1,
    name: "Fraca",
    type: "Relatos informais e percepções sem registro estruturado",
    example: "Conversas não documentadas, impressões soltas da equipe"
  },
  {
    level: 2,
    name: "Média",
    type: "Registros estruturados de natureza qualitativa",
    example: "Entrevistas transcritas, personas, job stories, atas de validação"
  },
  {
    level: 3,
    name: "Forte",
    type: "Métricas quantitativas e dados consolidados",
    example: "Dashboards, relatórios de uso, pesquisas com amostragem, indicadores de conversão"
  },
  {
    level: 4,
    name: "Muito forte",
    type: "Evidências formais de natureza jurídica, financeira ou contratual",
    example: "Contratos assinados, notas fiscais, DRE, registros de propriedade intelectual"
  }
];
