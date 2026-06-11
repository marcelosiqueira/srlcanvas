export type GroupKey = "fundacao" | "produtoMercado" | "escala" | "governanca";

export interface MaturityLevel {
  level: number;
  description: string;
  evidence: string;
}

export type InterpretiveGrouping = "BAIXO" | "MÉDIO" | "ALTO";

export interface InterpretiveBand {
  grouping: InterpretiveGrouping;
  minLevel: number;
  maxLevel: number;
  strategicFocus: string;
  description?: string;
}

export interface BlockInterpretiveSummary {
  bands: [InterpretiveBand, InterpretiveBand, InterpretiveBand];
}

export interface CanvasBlockDefinition {
  /** Chave estável de armazenamento (localStorage/Supabase). NUNCA renumerar. */
  id: number;
  key: string;
  /** Numeração de exibição P1-P12 do guia oficial (matriz 3x4). */
  number: number;
  name: string;
  shortLabel: string;
  group: GroupKey;
  icon: string;
  color: "blue" | "green" | "orange" | "purple";
  objective: string;
  /** Nota metodológica do bloco (ex.: lente PLG no bloco Adoção e Crescimento). */
  note?: string;
  questions: string[];
  exampleTips?: string[];
  levels: MaturityLevel[];
  interpretiveSummary?: BlockInterpretiveSummary;
}

export interface CanvasBlockState {
  score: number | null;
  notes: string;
  evidence: string;
}

export interface CanvasMeta {
  startup: string;
  evaluator: string;
  date: string;
}

export interface ScoreMetrics {
  total: number;
  mean: number;
  stdDev: number;
  cv: number;
  riskScore: number;
  completion: number;
}
