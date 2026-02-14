import type {
  BlockInterpretiveSummary,
  CanvasBlockDefinition,
  GroupKey,
  MaturityLevel
} from "../types";

export interface GroupMeta {
  key: GroupKey;
  name: string;
  subtitle: string;
  detailTitle: string;
  conceptualFocus: string;
  includedBlocks: string;
  dotClass: string;
  badgeClass: string;
  iconTextClass: string;
  iconBgClass: string;
}

const toLevels = (items: Array<{ description: string; evidence: string }>): MaturityLevel[] =>
  items.map((item, index) => ({ level: index + 1, ...item }));

export const GROUPS: GroupMeta[] = [
  {
    key: "fundacao",
    name: "Fundação",
    subtitle: "I. Problem/Solution Fit",
    detailTitle: "I. FUNDAÇÃO",
    conceptualFocus:
      "Problema/Solução Fit: Garante que a startup está construída sobre uma dor real e que a equipe tem capacidade de iniciar a execução.",
    includedBlocks: "1. Problema/Oportunidade, 2. Proposta de Valor, 7. Equipe",
    dotClass: "bg-blue-500",
    badgeClass: "text-blue-500 dark:text-blue-400",
    iconTextClass: "text-blue-500 dark:text-blue-400",
    iconBgClass: "bg-blue-100 dark:bg-blue-900/40"
  },
  {
    key: "produtoMercado",
    name: "Produto & Mercado",
    subtitle: "II. Product/Market Fit",
    detailTitle: "II. PRODUTO & MERCADO",
    conceptualFocus:
      "Product/Market Fit: Analisa a interação do produto com o mercado, focando na geração de tração e canais de crescimento.",
    includedBlocks: "3. Produto/Tecnologia, 4. Clientes/Tração, 5. PLG, 9. Marketing/Canais",
    dotClass: "bg-green-500",
    badgeClass: "text-green-500 dark:text-green-400",
    iconTextClass: "text-green-500 dark:text-green-400",
    iconBgClass: "bg-green-100 dark:bg-green-900/40"
  },
  {
    key: "escala",
    name: "Sustentabilidade & Escala",
    subtitle: "III. Scalability Fit",
    detailTitle: "III. SUSTENTABILIDADE & ESCALA",
    conceptualFocus:
      "Scalability Fit: Foca na saúde do modelo de receita, na eficiência operacional e na capacidade financeira de manter e acelerar o crescimento.",
    includedBlocks: "6. Modelo de Negócio, 8. Operações/Execução, 10. Sustentação Financeira",
    dotClass: "bg-orange-500",
    badgeClass: "text-orange-500 dark:text-orange-400",
    iconTextClass: "text-orange-500 dark:text-orange-400",
    iconBgClass: "bg-orange-100 dark:bg-orange-900/40"
  },
  {
    key: "governanca",
    name: "Futuro & Governança",
    subtitle: "IV. Futuro & Governança",
    detailTitle: "IV. FUTURO & GOVERNANÇA",
    conceptualFocus:
      "Direcionamento e Proteção: Garante que o negócio tem uma visão estratégica clara e está legalmente protegido para escalar sem riscos.",
    includedBlocks: "11. Estratégia/Visão, 12. Governança & Compliance",
    dotClass: "bg-purple-500",
    badgeClass: "text-purple-500 dark:text-purple-400",
    iconTextClass: "text-purple-500 dark:text-purple-400",
    iconBgClass: "bg-purple-100 dark:bg-purple-900/40"
  }
];

export const GROUP_BY_KEY = GROUPS.reduce<Record<GroupKey, GroupMeta>>(
  (acc, group) => {
    acc[group.key] = group;
    return acc;
  },
  {} as Record<GroupKey, GroupMeta>
);

const makeInterpretiveSummary = (
  low: string,
  medium: string,
  high: string
): BlockInterpretiveSummary => ({
  bands: [
    { grouping: "BAIXO", minLevel: 1, maxLevel: 3, strategicFocus: low },
    { grouping: "MÉDIO", minLevel: 4, maxLevel: 6, strategicFocus: medium },
    { grouping: "ALTO", minLevel: 7, maxLevel: 9, strategicFocus: high }
  ]
});

const INTERPRETIVE_SUMMARY_BY_BLOCK_KEY: Record<string, BlockInterpretiveSummary> = {
  problema: makeInterpretiveSummary(
    'Problema Hipotético: Foco em descoberta e validação qualitativa da dor e do "trabalho" (JTBD).',
    "Validação Qualitativa: Foco em mapear o JTBD e documentar os padrões recorrentes da dor.",
    "Maturidade JTBD: Foco em mensurar o problema e na motivação intrínseca do cliente."
  ),
  "proposta-de-valor": makeInterpretiveSummary(
    "Solução Hipotética: Foco em definir a proposta de valor e testar a clareza da mensagem.",
    "Validação da Solução: Foco em validar o MVP e coletar feedback sobre a percepção de valor.",
    "Maturidade da Solução: Foco em otimizar a retenção e garantir que a proposta de valor seja única e defensável."
  ),
  "produto-tecnologia": makeInterpretiveSummary(
    "Protótipo: Foco em desenvolver o MVP e entregar as funcionalidades mínimas.",
    "Validação e Uso Contínuo: Foco em melhorar o produto com base em feedback e garantir o uso contínuo.",
    "Escalabilidade e Estabilidade: Foco em otimizar a infraestrutura para escala e garantir a estabilidade e integração."
  ),
  "clientes-tracao": makeInterpretiveSummary(
    "Sem Tração: Foco em adquirir os primeiros usuários e validar o interesse inicial.",
    "Tração Inicial: Foco em converter usuários em clientes pagantes e estabelecer a recorrência.",
    "Crescimento Sustentável: Foco em otimizar a retenção e escalar o crescimento de forma previsível."
  ),
  plg: makeInterpretiveSummary(
    "PLG Hipotético: Foco em desenhar e testar as primeiras funcionalidades de PLG.",
    "Validação do PLG: Foco em validar o onboarding, a viralidade e a conversão.",
    "Maturidade PLG: Foco em otimizar o PLG como principal motor de crescimento."
  ),
  "modelo-de-negocio": makeInterpretiveSummary(
    "Modelo Hipotético: Foco em definir e testar o modelo de receita e a precificação.",
    "Validação do Modelo: Foco em validar a receita recorrente e calcular os unit economics.",
    "Maturidade do Modelo: Foco em otimizar os unit economics e escalar o modelo de negócio."
  ),
  equipe: makeInterpretiveSummary(
    "Formação da Equipe: Foco em formar uma equipe complementar e com dedicação integral.",
    "Estruturação da Equipe: Foco em definir a cultura e fazer as primeiras contratações-chave.",
    "Maturidade da Equipe: Foco em criar uma equipe de alta performance e uma liderança forte."
  ),
  operacoes: makeInterpretiveSummary(
    "Estruturação da Execução: Foco em documentar e seguir os processos básicos.",
    "Otimização da Execução: Foco em otimizar e automatizar os processos e definir métricas de eficiência.",
    "Maturidade da Execução: Foco em criar uma operação escalável e orientada a dados, com excelência operacional."
  ),
  "marketing-canais": makeInterpretiveSummary(
    "Estratégia de Marketing: Foco em definir a estratégia de marketing e testar os primeiros canais.",
    "Validação de Canais: Foco em validar o canal principal e otimizar o ROI.",
    "Maturidade de Marketing: Foco em escalar a aquisição, garantir a previsibilidade e construir uma marca forte."
  ),
  "sustentacao-financeira": makeInterpretiveSummary(
    "Controle Básico: Foco em estabelecer o controle de fluxo de caixa e registrar as transações.",
    "Planejamento: Foco em analisar as entradas e saídas e prever o runway.",
    "Maturidade Financeira: Foco em otimizar os unit economics e definir a estratégia de captação."
  ),
  "estrategia-visao": makeInterpretiveSummary(
    "Visão Inicial: Foco em definir a missão, visão e valores, e entender o mercado.",
    "Alinhamento: Foco em alinhar a operação com a estratégia e definir o roadmap tático.",
    "Visão Estratégica: Foco em posicionamento competitivo e garantir que as métricas impulsionem a visão de longo prazo."
  ),
  "governanca-compliance": makeInterpretiveSummary(
    "Estrutura Legal Básica: Foco em formalizar o registro da empresa e o acordo entre fundadores.",
    "Proteção Inicial: Foco em proteger a Propriedade Intelectual e iniciar o compliance legal.",
    "Governança Robusta: Foco em estruturar o vesting, formar o conselho e garantir o compliance auditado."
  )
};

export const SRL_BLOCKS: CanvasBlockDefinition[] = [
  {
    id: 1,
    key: "problema",
    interpretiveSummary: INTERPRETIVE_SUMMARY_BY_BLOCK_KEY.problema,
    name: "Problema / Oportunidade",
    shortLabel: "Problema",
    group: "fundacao",
    icon: "report_problem",
    color: "blue",
    objective:
      'Validar se a startup compreende profundamente o "trabalho" que o cliente está tentando realizar.',
    questions: [
      "A dor do cliente é clara e real?",
      'Há validação externa ou dados concretos que comprovem o "trabalho" (JTBD) [3] que o cliente deseja realizar?'
    ],
    exampleTips: [
      "Testes: Use Jobs-to-be-Done e Mapas de Empatia para encontrar a verdadeira causa da dor.",
      "Documente: Colete depoimentos e evidências que confirmem que o problema é frequente e doloroso para o público-alvo.",
      "Dados: Faça pesquisas com amostragem estatisticamente relevante (para o Nível 7+) para quantificar o tamanho da dor."
    ],
    levels: toLevels([
      {
        description: "Ideia vaga, sem definição clara do problema.",
        evidence: "Nenhuma interação registrada com clientes ou usuários."
      },
      {
        description: "Problema descrito genericamente, baseado em suposição.",
        evidence: "Anotações internas ou hipóteses em documentos, apresentações ou planos iniciais."
      },
      {
        description: "Identificação qualitativa do problema com observações ou hipóteses.",
        evidence:
          "Relatos informais de conversas com clientes, sem roteiro estruturado ou registro sistemático."
      },
      {
        description: "Realização de entrevistas ou conversas com público-alvo.",
        evidence: "Transcrições, gravações ou notas estruturadas de entrevistas com clientes/usuários."
      },
      {
        description: "Feedback estruturado de potenciais clientes.",
        evidence: "Questionários aplicados ou formulários on-line com respostas consolidadas."
      },
      {
        description: "Problema documentado com padrões recorrentes.",
        evidence: "Mapas de dor, Job Stories ou síntese estruturada das evidências coletadas."
      },
      {
        description: "Validação quantitativa do problema com dados ou pesquisas.",
        evidence: "Pesquisa de satisfação (NPS/CSAT) ou survey quantitativo com amostra mínima relevante."
      },
      {
        description: "Evidência ampla de que o problema é real e relevante no mercado.",
        evidence:
          "Dados de uso (analytics, logs, métricas de comportamento) demonstrando recorrência da dor ou do JTBD."
      },
      {
        description: "Dor bem conhecida, mensurada e reconhecida como significativa.",
        evidence:
          "Estudos de caso, depoimentos robustos (vídeo, texto), citações em mídia ou relatórios setoriais."
      }
    ])
  },
  {
    id: 2,
    key: "proposta-de-valor",
    interpretiveSummary: INTERPRETIVE_SUMMARY_BY_BLOCK_KEY["proposta-de-valor"],
    name: "Proposta de Valor",
    shortLabel: "Valor",
    group: "fundacao",
    icon: "diamond",
    color: "blue",
    objective: "Entender se a solução proposta resolve claramente o problema identificado.",
    questions: [
      "A solução atende diretamente à dor validada?",
      "A proposta de valor é clara e percebida como valiosa pelo cliente?"
    ],
    exampleTips: [
      "Validação: Utilize o Value Proposition Canvas para garantir o alinhamento problema-solução.",
      "Testes: Crie uma Landing Page com a proposta de valor e meça o interesse (cadastros, cliques).",
      "Métricas: Acompanhe o NPS (Net Promoter Score) e a Taxa de Retenção para medir a satisfação e a fidelização."
    ],
    levels: toLevels([
      {
        description: "Solução confusa ou sem relação direta com o problema.",
        evidence: "Descrição vaga da solução."
      },
      {
        description: "Ideia de solução sem alinhamento com a dor validada.",
        evidence: "Não há alinhamento entre problema e solução no Value Proposition Canvas."
      },
      {
        description: "Descrição clara da proposta, mas ainda sem feedback real.",
        evidence: "Landing page com descrição clara."
      },
      {
        description: "Feedback positivo inicial de clientes sobre a solução.",
        evidence: "Depoimentos de early adopters."
      },
      {
        description: "MVP funcional testado com casos reais.",
        evidence: "Relatório de testes de usabilidade."
      },
      {
        description: "Proposta entendida e validada com grupo de usuários.",
        evidence: "Focus group ou pesquisa de clareza da proposta."
      },
      {
        description: "Alta adesão inicial e engajamento com a solução.",
        evidence: "Métricas de engajamento inicial (DAU/MAU)."
      },
      {
        description: "Retenção de usuários, percepção clara de valor.",
        evidence: "Taxa de Retenção inicial."
      },
      {
        description: "Proposta única, difícil de substituir, com alto NPS ou fidelização.",
        evidence: "NPS alto e churn baixo."
      }
    ])
  },
  {
    id: 3,
    key: "produto-tecnologia",
    interpretiveSummary: INTERPRETIVE_SUMMARY_BY_BLOCK_KEY["produto-tecnologia"],
    name: "Produto / Tecnologia",
    shortLabel: "Produto",
    group: "produtoMercado",
    icon: "inventory_2",
    color: "green",
    objective: "Avaliar a maturidade da solução técnica e sua capacidade de entregar a proposta de valor.",
    questions: [
      "O produto/tecnologia é robusto e escalável?",
      "O processo de desenvolvimento é ágil e orientado a feedback?"
    ],
    exampleTips: [
      "Infra: Considere a infraestrutura técnica necessária para escala (Cloud, APIs, Segurança).",
      "Design: Inclua etapas como protótipos navegáveis e testes de usabilidade com usuários reais.",
      "Ferramentas: Utilize ferramentas como Figma (design), Bubble ou Firebase (prototipagem e back-end inicial)."
    ],
    levels: toLevels([
      {
        description: "Ideia sem protótipo.",
        evidence: "Desenhos ou wireframes."
      },
      {
        description: "Protótipo de baixa fidelidade.",
        evidence: "Protótipo em papel ou Figma."
      },
      {
        description: "Protótipo navegável.",
        evidence: "Link do protótipo navegável."
      },
      {
        description: "MVP funcional, mas instável.",
        evidence: "Acesso ao MVP."
      },
      {
        description: "Produto com funcionalidades básicas estáveis.",
        evidence: "Relatórios de bugs e estabilidade."
      },
      {
        description: "Ciclo de feedback e melhorias sendo aplicadas.",
        evidence: "Roadmap de produto e histórico de atualizações."
      },
      {
        description: "Infraestrutura básica e escalabilidade em desenvolvimento.",
        evidence: "Documentação de arquitetura de software."
      },
      {
        description: "Produto estável, com performance adequada e automações.",
        evidence: "Métricas de uptime e performance."
      },
      {
        description: "Produto pronto para escala massiva e integração com parceiros.",
        evidence: "APIs documentadas e acordos de parceria técnica."
      }
    ])
  },
  {
    id: 4,
    key: "clientes-tracao",
    interpretiveSummary: INTERPRETIVE_SUMMARY_BY_BLOCK_KEY["clientes-tracao"],
    name: "Clientes / Tração",
    shortLabel: "Clientes",
    group: "produtoMercado",
    icon: "person_search",
    color: "green",
    objective: "Medir o engajamento com o mercado real, com ênfase na Retenção (complementando o Bloco 9).",
    questions: ["Existem clientes pagantes e satisfeitos?", "A tração é crescente e sustentável?"],
    exampleTips: [
      "Funil: Monitore as taxas de conversão de cada etapa do funil (AARRR: Aquisição, Ativação, Retenção, Receita, Recomendação) [4].",
      "Indicadores: Diferencie claramente Leads (interessados) de Clientes Ativos (usando ou pagando).",
      "Teste: Realize a primeira segmentação de clientes para identificar o ICP (Ideal Customer Profile)."
    ],
    levels: toLevels([
      {
        description: "Nenhum cliente ou usuário.",
        evidence: "N/A"
      },
      {
        description: "Primeiros usuários (não pagantes).",
        evidence: "Lista de usuários beta."
      },
      {
        description: "Primeiros clientes pagantes (early adopters).",
        evidence: "Recibos ou contratos iniciais."
      },
      {
        description: "Recorrência de compra ou uso.",
        evidence: "Dados de recompra ou uso recorrente."
      },
      {
        description: "Base de clientes pequena, mas crescente.",
        evidence: "Gráfico de crescimento de clientes."
      },
      {
        description: "Retenção inicial validada.",
        evidence: "Taxa de Retenção mensal."
      },
      {
        description: "Tração consistente e previsível.",
        evidence: "Projeção de crescimento de receita."
      },
      {
        description: "Crescimento acelerado e sustentável.",
        evidence: "Métricas de crescimento (MoM, YoY)."
      },
      {
        description: "Liderança de nicho ou mercado.",
        evidence: "Market share ou reconhecimento de mercado."
      }
    ])
  },
  {
    id: 5,
    key: "plg",
    interpretiveSummary: INTERPRETIVE_SUMMARY_BY_BLOCK_KEY.plg,
    name: "Product-Led Growth (PLG)",
    shortLabel: "PLG",
    group: "produtoMercado",
    icon: "rocket_launch",
    color: "green",
    objective: "Avaliar a capacidade do produto de gerar crescimento de forma autônoma.",
    questions: [
      "O produto em si é um motor de aquisição e retenção?",
      "Existem mecanismos de viralidade ou recomendação no produto?"
    ],
    exampleTips: [
      "Onboarding: Crie um processo de onboarding que guie o usuário até o “momento aha!” (percepção de valor) o mais rápido possível.",
      "Viralidade: Implemente funcionalidades de compartilhamento ou recompensa por indicação.",
      "Métricas: Acompanhe a Taxa de Ativação, o K-fator e a Taxa de Conversão Freemium-Premium."
    ],
    levels: toLevels([
      {
        description: "Crescimento totalmente dependente de vendas/marketing.",
        evidence: "N/A"
      },
      {
        description: "Ideias iniciais de como o produto pode gerar crescimento.",
        evidence: "Brainstorming sobre PLG."
      },
      {
        description: "Primeiros testes de funcionalidades de PLG.",
        evidence: "Testes A/B de funcionalidades de onboarding."
      },
      {
        description: "Onboarding automatizado e intuitivo.",
        evidence: "Taxa de Ativação."
      },
      {
        description: "Mecanismos de recomendação ou viralidade implementados.",
        evidence: "K-fator ou taxa de recomendação."
      },
      {
        description: "Modelo Freemium ou Trial com conversão validada.",
        evidence: "Taxa de conversão Freemium-Premium."
      },
      {
        description: "Ciclo de feedback do produto automatizado.",
        evidence: "Pesquisas de satisfação in-app."
      },
      {
        description: "Produto como principal canal de aquisição.",
        evidence: "% de clientes adquiridos via PLG."
      },
      {
        description: "PLG como cultura, com otimização contínua.",
        evidence: "OKRs de PLG."
      }
    ])
  },
  {
    id: 6,
    key: "modelo-de-negocio",
    interpretiveSummary: INTERPRETIVE_SUMMARY_BY_BLOCK_KEY["modelo-de-negocio"],
    name: "Modelo de Negócio",
    shortLabel: "Modelo",
    group: "escala",
    icon: "monetization_on",
    color: "orange",
    objective: "Validar a forma como a startup captura valor e gera receita.",
    questions: [
      "O modelo de receita é claro e validado?",
      "Os unit economics (LTV/CAC) são saudáveis?"
    ],
    exampleTips: [
      "Precificação: Teste diferentes modelos de precificação (assinatura, transacional, freemium) para encontrar o ideal.",
      "Unit Economics: Calcule o LTV (Lifetime Value) e o CAC (Custo de Aquisição de Clientes) e garanta que o LTV seja pelo menos 3x maior que o CAC.",
      "Escala: Analise a escalabilidade do modelo de negócio e identifique possíveis gargalos."
    ],
    levels: toLevels([
      {
        description: "Modelo de negócio indefinido.",
        evidence: "N/A"
      },
      {
        description: "Ideias de como gerar receita.",
        evidence: "Brainstorming sobre modelos de receita."
      },
      {
        description: "Modelo de receita definido, mas não testado.",
        evidence: "Descrição do modelo de receita no pitch."
      },
      {
        description: "Primeiros testes de precificação.",
        evidence: "Testes A/B de preços."
      },
      {
        description: "Receita recorrente inicial.",
        evidence: "Primeiros contratos de assinatura."
      },
      {
        description: "Unit economics (LTV/CAC) calculados.",
        evidence: "Planilha de cálculo de LTV e CAC."
      },
      {
        description: "LTV > 3x CAC.",
        evidence: "Relatório de unit economics."
      },
      {
        description: "Modelo de receita escalável e otimizado.",
        evidence: "Projeção de receita com base em dados."
      },
      {
        description: "Múltiplas fontes de receita ou modelo de negócio inovador.",
        evidence: "Diversificação de fontes de receita."
      }
    ])
  },
  {
    id: 7,
    key: "equipe",
    interpretiveSummary: INTERPRETIVE_SUMMARY_BY_BLOCK_KEY.equipe,
    name: "Equipe",
    shortLabel: "Equipe",
    group: "fundacao",
    icon: "groups",
    color: "blue",
    objective: "Avaliar a capacidade da equipe de executar a visão da startup.",
    questions: [
      "A equipe é complementar e possui as habilidades necessárias?",
      "A cultura da equipe é forte e alinhada com a visão?"
    ],
    exampleTips: [
      "Complementaridade: Mapeie as habilidades da equipe e identifique as lacunas a serem preenchidas.",
      "Cultura: Defina os valores da empresa e pratique-os no dia a dia.",
      "Gestão: Implemente processos de gestão de pessoas, como OKRs e feedbacks constantes."
    ],
    levels: toLevels([
      {
        description: "Fundador único, sem equipe.",
        evidence: "N/A"
      },
      {
        description: "Equipe inicial, mas sem complementaridade.",
        evidence: "Currículos dos fundadores."
      },
      {
        description: "Equipe com habilidades complementares.",
        evidence: "Matriz de competências da equipe."
      },
      {
        description: "Dedicação integral dos fundadores.",
        evidence: "Contrato social ou acordo de dedicação."
      },
      {
        description: "Primeiras contratações-chave.",
        evidence: "Contratos de trabalho ou prestação de serviços."
      },
      {
        description: "Cultura organizacional definida e praticada.",
        evidence: "Documento de cultura e valores."
      },
      {
        description: "Processos de gestão de pessoas implementados.",
        evidence: "Descrições de cargos e responsabilidades."
      },
      {
        description: "Equipe de alta performance, com autonomia e responsabilidade.",
        evidence: "OKRs individuais e de equipe."
      },
      {
        description: "Liderança forte, capaz de atrair e reter talentos.",
        evidence: "Baixo turnover e alta satisfação da equipe."
      }
    ])
  },
  {
    id: 8,
    key: "operacoes",
    interpretiveSummary: INTERPRETIVE_SUMMARY_BY_BLOCK_KEY.operacoes,
    name: "Operações / Execução",
    shortLabel: "Operações",
    group: "escala",
    icon: "engineering",
    color: "orange",
    objective: "Avaliar a capacidade da startup de entregar valor de forma consistente e eficiente.",
    questions: [
      "Os processos internos são eficientes e escaláveis?",
      "A execução é ágil e orientada a dados?"
    ],
    exampleTips: [
      "Metodologias: Utilize metodologias ágeis, como Scrum ou Kanban, para gerenciar a execução.",
      "Ferramentas: Use ferramentas de gestão de projetos, como Trello, Jira ou Asana, para organizar as tarefas.",
      "Métricas: Defina e acompanhe KPIs de eficiência operacional para identificar gargalos e oportunidades de melhoria."
    ],
    levels: toLevels([
      {
        description: "Processos informais e caóticos.",
        evidence: "N/A"
      },
      {
        description: "Primeiros processos definidos, mas não seguidos.",
        evidence: "Fluxogramas de processos."
      },
      {
        description: "Processos básicos documentados e seguidos.",
        evidence: "Manuais de processos."
      },
      {
        description: "Uso de ferramentas de gestão de projetos.",
        evidence: "Quadros Kanban ou Scrum."
      },
      {
        description: "Métricas de eficiência operacional definidas.",
        evidence: "KPIs de eficiência (e.g., tempo de ciclo)."
      },
      {
        description: "Processos otimizados e automatizados.",
        evidence: "Relatórios de automação de processos."
      },
      {
        description: "Execução orientada a dados, com ciclos de feedback rápidos.",
        evidence: "Dashboards de métricas operacionais."
      },
      {
        description:
          "Operação escalável, com capacidade de atender a um grande volume de clientes.",
        evidence: "Testes de estresse da operação."
      },
      {
        description: "Excelência operacional, com otimização contínua.",
        evidence: "Certificações de qualidade ou prêmios de eficiência."
      }
    ])
  },
  {
    id: 9,
    key: "marketing-canais",
    interpretiveSummary: INTERPRETIVE_SUMMARY_BY_BLOCK_KEY["marketing-canais"],
    name: "Marketing / Canais",
    shortLabel: "Marketing",
    group: "produtoMercado",
    icon: "campaign",
    color: "green",
    objective: "Avaliar a capacidade da startup de alcançar e adquirir clientes de forma eficaz.",
    questions: [
      "Os canais de marketing são eficientes e escaláveis?",
      "A mensagem de marketing é clara e ressoa com o público-alvo?"
    ],
    exampleTips: [
      "Canais: Teste diferentes canais de marketing (mídia paga, orgânico, referência) para encontrar os mais eficientes.",
      "Mensagem: Crie uma mensagem de marketing clara e que ressoe com o público-alvo.",
      "Métricas: Acompanhe o CAC, o ROI e a Taxa de Conversão de cada canal para otimizar os investimentos."
    ],
    levels: toLevels([
      {
        description: "Nenhuma estratégia de marketing definida.",
        evidence: "N/A"
      },
      {
        description: "Primeiras ações de marketing pontuais.",
        evidence: "Posts em redes sociais ou anúncios esporádicos."
      },
      {
        description: "Estratégia de marketing definida, mas não testada.",
        evidence: "Plano de marketing."
      },
      {
        description: "Primeiros testes de canais de marketing.",
        evidence: "Relatórios de testes A/B de canais."
      },
      {
        description: "Canal principal validado com ROI positivo.",
        evidence: "Dados de CAC por canal."
      },
      {
        description: "Mix de canais com resultados consistentes.",
        evidence: "Taxa de Ativação."
      },
      {
        description: "Marketing orientado a dados, com otimização de CAC.",
        evidence: "Relatórios de desempenho de canais (Google Analytics, Ads)."
      },
      {
        description: "Aquisição previsível com mix de canais.",
        evidence: "Dashboard de métricas A e A do AARRR."
      },
      {
        description: "Marca forte e reconhecida no mercado.",
        evidence: "Pesquisas de reconhecimento de marca."
      }
    ])
  },
  {
    id: 10,
    key: "sustentacao-financeira",
    interpretiveSummary: INTERPRETIVE_SUMMARY_BY_BLOCK_KEY["sustentacao-financeira"],
    name: "Sustentação Financeira",
    shortLabel: "Financeiro",
    group: "escala",
    icon: "account_balance",
    color: "orange",
    objective: "Verificar a capacidade de manter operação com fôlego financeiro.",
    questions: [
      "Você tem um runway previsível?",
      "Os unit economics (LTV e CAC) são analisados e saudáveis?"
    ],
    exampleTips: [
      "Gestão: Mantenha um Controle de Fluxo de Caixa detalhado e mensalmente atualizado.",
      "Projeção: Calcule o Runway (fôlego em meses antes do dinheiro acabar) e o Burn Rate (taxa de queima de caixa).",
      "Valoração: Defina claramente a Estratégia de Captação e os milestones financeiros."
    ],
    levels: toLevels([
      {
        description: "Nenhum controle financeiro.",
        evidence: "N/A"
      },
      {
        description: "Estimativas informais de custos e receitas.",
        evidence: "Orçamento inicial."
      },
      {
        description: "Primeiros registros em planilhas.",
        evidence: "Planilha de fluxo de caixa."
      },
      {
        description: "Controle de fluxo de caixa básico.",
        evidence: "Extratos bancários."
      },
      {
        description: "Análise regular de entradas e saídas.",
        evidence: "DRE (Demonstração do Resultado do Exercício) mensal."
      },
      {
        description: "Planejamento financeiro com previsão de runway.",
        evidence: "Cálculo do Runway (fôlego em meses)."
      },
      {
        description: "Análise de unit economics em uso.",
        evidence: "Cálculo de LTV e CAC."
      },
      {
        description: "Estratégia de sustentabilidade ou captação definida.",
        evidence: "Projeção financeira de 3 anos."
      },
      {
        description: "Modelo financeiro validado, com indicadores saudáveis.",
        evidence: "Auditoria financeira ou due diligence de investidores."
      }
    ])
  },
  {
    id: 11,
    key: "estrategia-visao",
    interpretiveSummary: INTERPRETIVE_SUMMARY_BY_BLOCK_KEY["estrategia-visao"],
    name: "Estratégia / Visão",
    shortLabel: "Estratégia",
    group: "governanca",
    icon: "checklist",
    color: "purple",
    objective: "Avaliar clareza de futuro e diferencial competitivo.",
    questions: [
      "Existe visão clara, executável e inspiradora?",
      "O posicionamento competitivo é claro e diferenciado?"
    ],
    exampleTips: [
      "Visão: Utilize ferramentas como Golden Circle (Simon Sinek) para definir o propósito.",
      "Estratégia: Use OKRs (Objectives and Key Results) para garantir o alinhamento entre a visão e a execução.",
      "Competição: Realize uma Análise SWOT ou Competitive Landscape para definir o diferencial."
    ],
    levels: toLevels([
      {
        description: "Nenhuma visão de longo prazo definida.",
        evidence: "N/A"
      },
      {
        description: "Propósito genérico e pouco claro.",
        evidence: "Declaração de missão/visão."
      },
      {
        description: "Ideia inicial de mercado e impacto.",
        evidence: "Análise de mercado."
      },
      {
        description: "Missão, visão e valores definidos.",
        evidence: "Documento de cultura e valores."
      },
      {
        description: "Roadmap tático de curto prazo existente.",
        evidence: "Roadmap de 6 meses."
      },
      {
        description: "Alinhamento entre operação e estratégia.",
        evidence: "OKRs ou metas trimestrais."
      },
      {
        description: "Métricas e metas alinhadas à visão de longo prazo.",
        evidence: "Dashboard de métricas estratégicas."
      },
      {
        description: "Posicionamento competitivo claro e diferenciado.",
        evidence: "Análise SWOT ou Competitive Landscape."
      },
      {
        description: "Visão inspiradora, executável e com potencial de impacto massivo.",
        evidence: "Pitch deck de captação de Série A."
      }
    ])
  },
  {
    id: 12,
    key: "governanca-compliance",
    interpretiveSummary: INTERPRETIVE_SUMMARY_BY_BLOCK_KEY["governanca-compliance"],
    name: "Governança & Compliance",
    shortLabel: "Governança",
    group: "governanca",
    icon: "gavel",
    color: "purple",
    objective: "Garantir que o negócio está legalmente protegido e tem estrutura para escalar.",
    questions: [
      "O negócio está legalmente protegido (PI, contratos)?",
      "Existe uma estrutura de governança (conselho, vesting) para a escala?"
    ],
    exampleTips: [
      "Legal: Formalize o Acordo de Fundadores e o Vesting o mais cedo possível para evitar problemas futuros.",
      "PI: Priorize o registro de marca e patentes (se aplicável) para proteger a Propriedade Intelectual.",
      "Governança: Considere a formação de um Conselho Consultivo para auxiliar nas decisões estratégicas."
    ],
    levels: toLevels([
      {
        description: "Estrutura legal informal.",
        evidence: "N/A"
      },
      {
        description: "Registro de empresa básico.",
        evidence: "CNPJ ou registro."
      },
      {
        description: "Acordo de fundadores verbal.",
        evidence: "Termo de confidencialidade (NDA)."
      },
      {
        description: "Acordo de fundadores formalizado (sem vesting).",
        evidence: "Contrato social."
      },
      {
        description: "Proteção de PI básica (registro de marca).",
        evidence: "Registro de marca no INPI."
      },
      {
        description: "Estrutura de compliance inicial (LGPD, etc.).",
        evidence: "Política de privacidade."
      },
      {
        description: "Acordo de vesting e stock option formalizado.",
        evidence: "Contrato de vesting."
      },
      {
        description: "Governança corporativa inicial (conselho consultivo).",
        evidence: "Atas de reuniões de conselho."
      },
      {
        description: "Governança robusta, proteção legal completa e compliance auditado.",
        evidence: "Due diligence legal e financeira."
      }
    ])
  }
];

export const SRL_BLOCKS_BY_ID = SRL_BLOCKS.reduce<Record<number, CanvasBlockDefinition>>(
  (acc, block) => {
    acc[block.id] = block;
    return acc;
  },
  {}
);
