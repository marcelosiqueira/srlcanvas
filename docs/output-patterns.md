# Output Patterns (IA)

Padroes de resposta para manter comunicacao objetiva e util durante evolucao do projeto.

## 1. Implementacao de Codigo

Formato padrao:

1. Resultado direto (o que foi entregue).
2. Arquivos alterados.
3. Validacao executada.
4. Pendencias/riscos.

Exemplo curto:

- Resultado: modal de resultados atualizado com nova metrica.
- Arquivos: `src/components/ResultsModal.tsx`, `src/utils/score.ts`.
- Validacao: `pnpm build`.
- Risco: sem testes automatizados de regressao visual.

## 2. Analise Sem Alterar Codigo

Formato padrao:

1. Achados (ordenados por severidade).
2. Evidencia com referencia de arquivo.
3. Recomendacao objetiva.

## 3. Revisao de Bug

Formato padrao:

1. Causa raiz.
2. Correcao aplicada.
3. Como reproduzir antes/depois.
4. Validacao.

## 4. Planejamento

Formato padrao:

1. Escopo.
2. Passos curtos e verificaveis.
3. Critério de pronto.

## 5. Convencoes Gerais

- Evitar texto excessivo.
- Sempre citar caminhos de arquivo quando houver mudanca.
- Sempre informar se build/testes nao foram executados.
- Quando houver trade-off, declarar em uma frase objetiva.
