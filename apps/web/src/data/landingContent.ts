import { GROUP_BY_KEY, SRL_BLOCKS } from "./srlBlocks";

/*
 * Conteúdo educativo da landing page. As notas dos cenários são fictícias e os
 * textos não são recomendações da plataforma (ver CONTEUDO-E-FONTES do pacote da LP).
 * Nomes e grupos vêm de SRL_BLOCKS para acompanhar o modelo manual.
 */
const DIMENSION_COPY: Record<string, { question: string; evidence: string }> = {
  problema: {
    question: "Existe um problema relevante, compreendido a partir da realidade do cliente?",
    evidence: "Entrevistas registradas, padrões de dor e dados sobre o problema."
  },
  "proposta-de-valor": {
    question: "A solução responde à dor e seu valor é percebido pelo público?",
    evidence: "Testes da proposta, retornos de clientes e registros de validação."
  },
  "produto-tecnologia": {
    question: "A solução entrega valor e sua maturidade técnica é demonstrável?",
    evidence: "Testes do produto, registros de uso e feedback documentado."
  },
  "clientes-tracao": {
    question: "Há sinais reais de demanda, satisfação e retenção?",
    evidence: "Dados de clientes, contratos, receita recorrente ou métricas de retenção."
  },
  equipe: {
    question: "O time reúne competências e alinhamento para executar a visão?",
    evidence: "Papéis definidos, competências mapeadas e acordos documentados."
  },
  operacoes: {
    question: "A startup consegue entregar valor de forma consistente?",
    evidence: "Processos documentados, indicadores de entrega e registros operacionais."
  },
  "adocao-crescimento": {
    question: "A entrada, a ativação e a continuidade de uso são replicáveis?",
    evidence: "Dados de ativação, uso, retenção e recomendação; conforme o modelo do negócio."
  },
  "marketing-canais": {
    question: "Os canais alcançam e adquirem clientes de forma consistente?",
    evidence: "Experimentos de canal, conversões e custos de aquisição documentados."
  },
  "modelo-de-negocio": {
    question: "Como a startup captura valor e sustenta sua receita?",
    evidence: "Testes de preço, vendas e registros do modelo de receita."
  },
  "sustentacao-financeira": {
    question: "O caixa e os custos permitem sustentar a operação?",
    evidence: "Fluxo de caixa, projeções, demonstrativos e indicadores financeiros."
  },
  "estrategia-visao": {
    question: "A direção do negócio e o posicionamento competitivo estão claros?",
    evidence: "Marcos estratégicos, análise de mercado e decisões registradas."
  },
  "governanca-compliance": {
    question: "O negócio tem estrutura jurídica e proteção para seus compromissos?",
    evidence:
      "Contratos, acordos societários e registros de propriedade intelectual, quando aplicáveis."
  }
};

export interface LandingDimension {
  name: string;
  short: string;
  group: string;
  question: string;
  evidence: string;
}

export const LANDING_DIMENSIONS: LandingDimension[] = SRL_BLOCKS.map((block) => ({
  name: block.name,
  short: block.shortLabel,
  group: GROUP_BY_KEY[block.group].name,
  ...DIMENSION_COPY[block.key]
}));

export type LandingScenarioKey = "governance" | "market" | "balanced";

export interface LandingScenario {
  label: string;
  values: number[];
  title: string;
  description: string;
  scores: Array<{ value: number; label: string }>;
  question: string;
}

export const LANDING_SCENARIOS: Record<LandingScenarioKey, LandingScenario> = {
  governance: {
    label: "Produto forte, base frágil",
    values: [7, 7, 7, 6, 6, 5, 6, 5, 5, 3, 4, 2],
    title: "O produto avançou. A estrutura precisa acompanhar.",
    description:
      "Neste caso fictício, o produto e os clientes mostram avanços, mas finanças e governança pedem investigação. Mais funcionalidades podem não resolver essas lacunas.",
    scores: [
      { value: 7, label: "Produto e Tecnologia" },
      { value: 2, label: "Governança e Compliance" }
    ],
    question:
      "Quais acordos, contratos e controles financeiros precisam ser organizados antes do próximo compromisso de crescimento?"
  },
  market: {
    label: "Tecnologia sem tração",
    values: [6, 6, 7, 3, 6, 4, 4, 6, 4, 3, 5, 4],
    title: "Tecnologia desenvolvida. Demanda ainda pouco demonstrada.",
    description:
      "A solução deste exemplo está mais desenvolvida do que as evidências de clientes e tração. O radar convida a investigar a distância entre entregar tecnologia e comprovar demanda.",
    scores: [
      { value: 7, label: "Produto e Tecnologia" },
      { value: 3, label: "Clientes e Tração" }
    ],
    question:
      "Que teste com clientes poderia produzir evidências mais consistentes de compra, uso continuado ou retenção?"
  },
  balanced: {
    label: "Perfil mais equilibrado",
    values: [7, 7, 7, 6, 7, 6, 6, 6, 7, 6, 7, 6],
    title: "Mais equilíbrio. Ainda há perguntas a fazer.",
    description:
      "Este perfil fictício tem menos distância entre as dimensões. O equilíbrio ajuda a conversa, mas não certifica prontidão para investir, escalar ou captar.",
    scores: [
      { value: 7, label: "Produto e Tecnologia" },
      { value: 6, label: "Governança e Compliance" }
    ],
    question:
      "As evidências seguem atuais e suficientes para o próximo marco? Que hipótese de crescimento ainda precisa ser testada?"
  }
};

export const LANDING_PREPARATION = [
  {
    title: "Comece pela pergunta certa.",
    text: "Você vai avaliar a maturidade da sua startup em 12 dimensões. Pense no momento atual do negócio e no próximo marco que deseja discutir.",
    items: [
      "Não é uma prova nem uma previsão de sucesso.",
      "O resultado depende da qualidade das evidências.",
      "O guia oficial explica os critérios de cada nível."
    ]
  },
  {
    title: "Separe o que sustenta sua avaliação.",
    text: "Tenha à mão os registros que já existem. Você não precisa inventar uma certeza quando ainda há uma hipótese.",
    items: [
      "Entrevistas e testes com clientes.",
      "Métricas de uso, vendas e fluxo de caixa.",
      "Contratos e acordos, quando aplicáveis."
    ]
  },
  {
    title: "Pronto para olhar para o todo?",
    text: "O próximo botão abre o cadastro da plataforma. Depois de criar sua conta, consulte os critérios e faça sua avaliação.",
    items: [
      "Já tem conta? Use o link “Entrar” abaixo.",
      "Notas acima de 3 exigem evidência registrada.",
      "Se precisar, preencha com um mentor."
    ]
  }
] as const;

/** Vídeo de apresentação (77 s). Arquivos em public/video; roteiro em docs/landing-roteiro-video.md. */
export const LANDING_VIDEO = {
  src: "/video/srl-canvas-apresentacao.mp4",
  poster: "/video/srl-canvas-apresentacao-poster.webp",
  captions: "/video/srl-canvas-apresentacao.pt-BR.vtt",
  duration: "1min17"
} as const;

/** Transcrição da narração, na ordem das cenas (mantenha igual ao áudio publicado). */
export const LANDING_VIDEO_TRANSCRIPT = [
  "Sua startup está realmente pronta... para crescer?",
  "Talvez o produto esteja avançado. Mas e o caixa? E os clientes? E a governança?",
  "Imagine um caso fictício: produto no nível sete; governança no nível dois. O negócio evolui em ritmos diferentes, e o próximo obstáculo pode estar onde você ainda não olhou.",
  "O SRL Canvas ajuda você a enxergar o negócio inteiro.",
  "São doze dimensões de maturidade, do problema do cliente à governança, cada uma em nove níveis.",
  "Em cada uma, você consulta os critérios, escolhe o nível e registra a evidência que sustenta a nota.",
  "O radar revela o formato da sua startup e onde estão as lacunas. E o resumo por bloco orienta o que investigar.",
  "Prefere aplicar no papel? Baixe gratuitamente o Canvas, o Radar e o Guia de aplicação em PDF, e aplique manualmente com sua equipe.",
  "Com sua equipe ou mentor, vocês discutem prioridades e escolhem os próximos testes. O diagnóstico orienta a conversa; a decisão continua humana.",
  "O método nasceu de uma pesquisa de mestrado no PROFNIT, no IFMS, com conteúdo validado por quinze especialistas. Ele não prevê sucesso nem calcula valuation: ele dá clareza para o próximo passo.",
  "Antes de acelerar, entenda onde você está. Acesse srlcanvas.com e comece seu diagnóstico."
] as const;
