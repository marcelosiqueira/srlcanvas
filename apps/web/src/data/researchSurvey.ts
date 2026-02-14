export const RESEARCH_SURVEY_VERSION = "questionario_quantitativo_srl_canvas_revisado_2025-11-28";
export const RESEARCH_CONSENT_VERSION = "tcle_v1_2025-11-28";

export const LIKERT_SCALE_OPTIONS = [1, 2, 3, 4, 5] as const;

export const LIKERT_SCALE_LABELS: Record<(typeof LIKERT_SCALE_OPTIONS)[number], string> = {
  1: "Discordo totalmente",
  2: "Discordo",
  3: "Neutro",
  4: "Concordo",
  5: "Concordo totalmente"
};

export const SURVEY_DIMENSIONS = [
  { key: "problema_oportunidade", label: "Problema/Oportunidade" },
  { key: "proposta_valor", label: "Proposta de Valor" },
  { key: "produto_tecnologia", label: "Produto/Tecnologia" },
  { key: "clientes_tracao", label: "Clientes/Tracao" },
  { key: "plg", label: "Product-Led Growth (PLG)" },
  { key: "modelo_negocio", label: "Modelo de Negocio" },
  { key: "equipe", label: "Equipe" },
  { key: "operacoes_execucao", label: "Operacoes/Execucao" },
  { key: "marketing_canais", label: "Marketing/Canais" },
  { key: "sustentacao_financeira", label: "Sustentacao Financeira" },
  { key: "estrategia_visao", label: "Estrategia/Visao" },
  { key: "governanca_compliance", label: "Governanca & Compliance" }
] as const;

export type SurveyDimensionKey = (typeof SURVEY_DIMENSIONS)[number]["key"];

export const DIMENSION_ASSERTIONS = [
  {
    key: "definitionClarity",
    label: "A definicao do bloco esta clara."
  },
  {
    key: "levelCriteriaClarity",
    label: "Os criterios de niveis (1 a 9) para este bloco sao compreensiveis."
  },
  {
    key: "objectiveScoring",
    label: "Consigo pontuar este bloco de forma relativamente objetiva."
  },
  {
    key: "dimensionRelevance",
    label: "Este bloco e relevante para avaliar a maturidade de uma startup."
  }
] as const;

export type DimensionAssertionKey = (typeof DIMENSION_ASSERTIONS)[number]["key"];

export const PROFILE_ROLE_OPTIONS = [
  { value: "empreendedor_fundador", label: "Empreendedor(a) / Fundador(a)" },
  { value: "mentor", label: "Mentor(a)" },
  { value: "investidor", label: "Investidor(a) (Anjo/VC/Corporate VC)" },
  { value: "gestor_incubadora_aceleradora", label: "Gestor(a) de incubadora/aceleradora" },
  { value: "consultor", label: "Consultor(a)" },
  { value: "pesquisador_docente", label: "Pesquisador(a)/Docente" },
  { value: "outro", label: "Outro" }
] as const;

export const EXPERIENCE_OPTIONS = [
  { value: "lt_1", label: "< 1 ano" },
  { value: "1_3", label: "1-3 anos" },
  { value: "4_6", label: "4-6 anos" },
  { value: "7_10", label: "7-10 anos" },
  { value: "gt_10", label: "> 10 anos" }
] as const;

export const SECTOR_OPTIONS = [
  { value: "saas_software", label: "SaaS / Software" },
  { value: "industria_hardware_iot", label: "Industria / Hardware / IoT" },
  { value: "health_biotech", label: "Health / Biotech" },
  { value: "fintech_insurtech", label: "FinTech / InsurTech" },
  { value: "agtech_food", label: "AgTech / Food" },
  { value: "gov_edtech_impacto", label: "Gov / EdTech / Impacto Social" },
  { value: "outro", label: "Outro" }
] as const;

export const STAGE_OPTIONS = [
  { value: "ideacao", label: "Ideacao" },
  { value: "validacao", label: "Validacao" },
  { value: "tracao", label: "Tracao" },
  { value: "escala", label: "Escala" }
] as const;

export const TEAM_SIZE_OPTIONS = [
  { value: "1_3", label: "1-3 pessoas" },
  { value: "4_10", label: "4-10 pessoas" },
  { value: "11_30", label: "11-30 pessoas" },
  { value: "gt_30", label: "> 30 pessoas" }
] as const;

export const PREFERRED_SCALE_OPTIONS = [
  { value: "nao", label: "Nao" },
  { value: "1_5", label: "1-5" },
  { value: "1_7", label: "1-7" },
  { value: "outro", label: "Outro" }
] as const;

export const SUS_ITEMS = [
  { key: 1, label: "Eu usaria o SRL Canvas com frequencia no meu trabalho." },
  { key: 2, label: "Achei o SRL Canvas desnecessariamente complexo." },
  { key: 3, label: "Achei o SRL Canvas facil de usar." },
  { key: 4, label: "Eu precisaria do apoio de um especialista para aplicar o SRL Canvas." },
  { key: 5, label: "As funcionalidades/dimensoes do SRL Canvas estao bem integradas." },
  { key: 6, label: "Ha muita inconsistenca entre os blocos." },
  { key: 7, label: "A maioria das pessoas aprenderia a usar o SRL Canvas rapidamente." },
  { key: 8, label: "Considerei o SRL Canvas pesado e trabalhoso de usar." },
  { key: 9, label: "Senti-me confiante usando o SRL Canvas." },
  { key: 10, label: "Precisei aprender muitas coisas antes de conseguir usar o SRL Canvas." }
] as const;

export const USAGE_CONTEXT_OPTIONS = [
  { value: "autoavaliacao_startup", label: "Autoavaliacao de startup" },
  {
    value: "selecao_programas",
    label: "Selecao de startups em programas (aceleracao/incubacao)"
  },
  { value: "acompanhamento_portfolio", label: "Acompanhamento de portfolio" },
  { value: "analise_investimento", label: "Analise de investimento (due diligence)" },
  { value: "ensino_aprendizagem", label: "Ensino/aprendizagem" },
  { value: "outro", label: "Outro" }
] as const;

export const ACCEPTABLE_TIME_OPTIONS = [
  { value: "ate_15", label: "<= 15 minutos" },
  { value: "16_30", label: "16-30 minutos" },
  { value: "31_45", label: "31-45 minutos" },
  { value: "gt_45", label: "> 45 minutos" }
] as const;
