import { describe, expect, it } from "vitest";
import { SRL_BLOCKS } from "./srlBlocks";

/**
 * Texto oficial do modelo manual (public/downloads/srl-canvas-modelo-manual.pdf,
 * versão 1.1, outubro de 2026). A plataforma deve exibir exatamente as mesmas
 * perguntas-chave e descrições de nível.
 */
const MODELO_MANUAL: Record<number, { questions: string[]; levels: string[] }> = {
  1: {
    questions: [
      "A dor do cliente é clara e real?",
      'Há validação externa ou dados que comprovem o "trabalho" (JTBD)?'
    ],
    levels: [
      "Ideia vaga, sem definição clara do problema.",
      "Problema descrito genericamente, baseado em suposição.",
      "Identificação qualitativa com observações.",
      "Realização de entrevistas registradas com público-alvo.",
      "Feedback estruturado de potenciais clientes.",
      "Problema documentado com padrões recorrentes.",
      "Validação quantitativa com dados ou pesquisas.",
      "Evidência ampla de que o problema é real e relevante.",
      "Dor bem conhecida, mensurada e reconhecida como significativa."
    ]
  },
  2: {
    questions: [
      "A solução atende diretamente à dor validada?",
      "A proposta de valor é clara e percebida como valiosa?"
    ],
    levels: [
      "Solução confusa ou sem relação direta com o problema.",
      "Ideia de solução sem alinhamento com a dor validada.",
      "Descrição clara da proposta, mas sem feedback real.",
      "Feedback positivo inicial de clientes sobre a solução.",
      "MVP funcional testado com casos reais.",
      "Proposta entendida e validada com grupo de usuários.",
      "Alta adesão inicial e engajamento com a solução.",
      "Retenção de usuários e percepção clara de valor.",
      "Proposta única, difícil de substituir, com alto NPS."
    ]
  },
  3: {
    questions: [
      "O produto/tecnologia é robusto e escalável?",
      "O desenvolvimento é ágil e orientado a feedback?"
    ],
    levels: [
      "Ideia sem protótipo.",
      "Protótipo de baixa fidelidade.",
      "Protótipo navegável.",
      "MVP funcional, mas instável.",
      "Produto com funcionalidades básicas estáveis.",
      "Ciclo de feedback e melhorias sendo aplicadas.",
      "Infraestrutura básica e escalabilidade em desenvolvimento.",
      "Produto estável, com performance adequada e automações.",
      "Pronto para escala massiva e integração com parceiros."
    ]
  },
  4: {
    questions: ["Existem clientes pagantes e satisfeitos?", "A tração é crescente e sustentável?"],
    levels: [
      "Nenhum cliente ou usuário.",
      "Primeiros usuários (não pagantes).",
      "Primeiros clientes pagantes (early adopters).",
      "Recorrência de compra ou uso.",
      "Base de clientes pequena, mas crescente.",
      "Retenção inicial validada.",
      "Tração consistente e previsível.",
      "Crescimento acelerado e sustentável.",
      "Liderança de nicho ou mercado."
    ]
  },
  5: {
    questions: [
      "A equipe é complementar e tem as competências necessárias?",
      "A cultura é forte e alinhada com a visão?"
    ],
    levels: [
      "Fundador único, sem equipe.",
      "Equipe inicial, mas sem complementaridade.",
      "Equipe com habilidades complementares.",
      "Dedicação integral dos fundadores.",
      "Primeiras contratações-chave.",
      "Cultura organizacional definida e praticada.",
      "Processos de gestão de pessoas implementados.",
      "Equipe de alta performance, com autonomia.",
      "Liderança forte, capaz de atrair e reter talentos."
    ]
  },
  6: {
    questions: [
      "Os processos são documentados e otimizados?",
      "A execução é ágil e orientada a dados?"
    ],
    levels: [
      "Processos informais e caóticos.",
      "Primeiros processos definidos, mas não seguidos.",
      "Processos básicos documentados e seguidos.",
      "Uso de ferramentas de gestão de projetos.",
      "Métricas de eficiência operacional definidas.",
      "Processos otimizados e automatizados.",
      "Execução orientada a dados, com feedback rápido.",
      "Operação escalável para grande volume de clientes.",
      "Excelência operacional, com otimização contínua."
    ]
  },
  7: {
    questions: [
      "Há mecanismos claros de adoção, retenção ou recomendação?",
      "O processo de entrada, ativação ou uso inicial é simples, eficiente e replicável?"
    ],
    levels: [
      "Crescimento dependente de esforço manual.",
      "Ideias iniciais de adoção ou crescimento.",
      "Primeiros testes de adoção ou indicação.",
      "Processo de ativação estruturado.",
      "Mecanismos de recorrência ou recomendação implementados.",
      "Adoção ou retenção inicial validada.",
      "Ciclo de feedback e melhoria em uso.",
      "Crescimento orgânico ou expansão relevante.",
      "Crescimento replicável e otimizado."
    ]
  },
  8: {
    questions: [
      "Os canais de marketing são eficientes e escaláveis?",
      "A mensagem é clara e ressoa com o público-alvo?"
    ],
    levels: [
      "Nenhuma estratégia de marketing definida.",
      "Primeiras ações de marketing pontuais.",
      "Estratégia de marketing definida, mas não testada.",
      "Primeiros testes de canais de marketing.",
      "Canal principal validado com ROI positivo.",
      "Mix de canais com resultados consistentes.",
      "Marketing orientado a dados, com otimização de CAC.",
      "Aquisição previsível com mix de canais.",
      "Marca forte e reconhecida no mercado."
    ]
  },
  9: {
    questions: [
      "O modelo de receita é claro e validado?",
      "A precificação reflete o valor percebido pelo cliente?"
    ],
    levels: [
      "Modelo de negócio indefinido.",
      "Ideias de como gerar receita.",
      "Modelo de receita definido, mas não testado.",
      "Primeiros testes de precificação.",
      "Receita recorrente inicial.",
      "Unit economics (LTV/CAC) calculados.",
      "LTV maior que 3x CAC.",
      "Modelo de receita escalável e otimizado.",
      "Múltiplas fontes de receita ou modelo inovador."
    ]
  },
  10: {
    questions: ["Existe um runway previsível?", "Os unit economics (LTV e CAC) são saudáveis?"],
    levels: [
      "Nenhum controle financeiro.",
      "Estimativas informais de custos e receitas.",
      "Primeiros registros em planilhas.",
      "Controle de fluxo de caixa básico.",
      "Análise regular de entradas e saídas.",
      "Planejamento financeiro com previsão de runway.",
      "Análise de unit economics em uso.",
      "Estratégia de sustentabilidade ou captação definida.",
      "Modelo financeiro validado, com indicadores saudáveis."
    ]
  },
  11: {
    questions: [
      "Existe visão clara, executável e inspiradora?",
      "O posicionamento competitivo é claro e diferenciado?"
    ],
    levels: [
      "Nenhuma visão de longo prazo definida.",
      "Propósito genérico e pouco claro.",
      "Ideia inicial de mercado e impacto.",
      "Missão, visão e valores definidos.",
      "Roadmap tático de curto prazo existente.",
      "Alinhamento entre operação e estratégia.",
      "Métricas e metas alinhadas à visão de longo prazo.",
      "Posicionamento competitivo claro e diferenciado.",
      "Visão inspiradora, executável, com impacto massivo."
    ]
  },
  12: {
    questions: [
      "O negócio está legalmente protegido (PI, contratos)?",
      "Há estrutura de governança para escalar (por exemplo, conselho ou vesting)?"
    ],
    levels: [
      "Estrutura legal informal.",
      "Registro de empresa básico.",
      "Acordo de fundadores verbal.",
      "Acordo de fundadores formalizado (sem vesting).",
      "Proteção de PI básica (registro de marca).",
      "Estrutura de compliance inicial (LGPD, etc.).",
      "Acordo de vesting formalizado.",
      "Governança corporativa inicial (conselho consultivo).",
      "Governança robusta, proteção legal e compliance auditado."
    ]
  }
};

describe("SRL_BLOCKS × modelo manual (PDF v1.1)", () => {
  it.each(SRL_BLOCKS.map((block) => [block.number, block] as const))(
    "P%i tem perguntas e níveis idênticos ao PDF",
    (number, block) => {
      const expected = MODELO_MANUAL[number];
      expect(block.questions).toEqual(expected.questions);
      expect(block.levels.map((level) => level.description)).toEqual(expected.levels);
    }
  );
});
