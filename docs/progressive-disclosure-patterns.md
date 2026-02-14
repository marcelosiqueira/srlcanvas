# Progressive Disclosure Patterns

Padroes para organizar conteudo complexo sem sobrecarregar usuario ou IA.

## 1. Camadas de Informacao (UI)

1. Camada 1 - Resumo rapido:
   - lista de blocos + status de nota.
   - total e progresso.
2. Camada 2 - Detalhe acionavel:
   - modal do bloco com objetivo, perguntas-chave e nivel.
3. Camada 3 - Analise aprofundada:
   - radar, scorecard e exportacao.

## 2. Camadas de Informacao (Documentacao)

1. `SKILL.md`: regras operacionais e mapa rapido.
2. `PRD.md`: requisitos e regras de negocio.
3. `workflows.md`: sequencias de execucao.
4. `output-patterns.md`: como a IA deve responder.

## 3. Regras Praticas

- Mostrar primeiro o que o usuario precisa decidir agora.
- Esconder detalhes tecnicos ate haver intencao explicita.
- Em modais, manter campos essenciais acima da dobra.
- Usar textos curtos com exemplos concretos.

## 4. Padrao para Novas Funcionalidades

1. Exibir novo indicador apenas no resumo.
2. Abrir detalhes sob clique/expansao.
3. Incluir explicacao metodologica apenas no contexto detalhado.
4. Evitar introduzir mais de uma nova decisao por etapa de fluxo.

## 5. Checklist de Aplicacao

- O usuario entende o status sem abrir modais?
- A acao principal da tela esta evidente?
- O detalhe esta disponivel sem poluir a tela?
- O fluxo completo ainda fecha em poucos passos?
