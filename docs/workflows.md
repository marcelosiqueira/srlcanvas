# Workflows

## 1. Workflow: Avaliar Canvas (Usuario Final)

1. Preencher `Startup`, `Avaliador`, `Data`.
2. Abrir bloco desejado.
3. Registrar notas do bloco.
4. Definir nivel 1-9.
5. Registrar evidencias.
6. Salvar.
7. Repetir ate os 12 blocos.
8. Abrir `Ver Resultados`.
9. Exportar PNG/PDF (opcional).

## 1.1 Workflow: Entrada no App (Publico -> Auth)

1. Acessar `/` (landing page publica).
2. Clicar em `Entrar` ou `Criar conta` quando auth estiver habilitado.
3. Concluir autenticacao.
4. Seguir para `/dashboard` e iniciar fluxo de avaliacao.

## 2. Workflow: Mudanca de Produto (Time)

1. Atualizar `PRD.md` com requisito/ajuste.
2. Atualizar `workflows.md` se fluxo mudou.
3. Implementar codigo em menor incremento possivel.
4. Rodar `pnpm build`.
5. Validar fluxo manual afetado.
6. Atualizar `output-patterns.md` se o padrao de resposta da IA mudou.

## 3. Workflow: Correcao de Formula de Score

1. Confirmar regra no `PRD.md`.
2. Alterar `apps/web/src/utils/score.ts`.
3. Verificar consumo em `apps/web/src/App.tsx` e `apps/web/src/components/ResultsModal.tsx`.
4. Validar com cenarios de teste rapido (notas baixas, mistas, altas).
5. Rodar `pnpm build`.

## 4. Workflow: Evolucao de UX (Modais)

1. Definir problema de UX e criterio de sucesso.
2. Ajustar componente alvo (`BlockEditModal` ou `ResultsModal`).
3. Testar mobile e desktop.
4. Confirmar acessibilidade minima (escape, foco, labels).
5. Rodar `pnpm build`.

## 5. Regras Condicionais

- Se mudar modelo de dados persistido:
  - criar estrategia de migracao no store.
  - validar compatibilidade de estado antigo.
  - validar isolamento por conta autenticada no mesmo navegador (troca de usuario nao pode reaproveitar dados de outro).
- Se mudar bloco/niveis SRL:
  - atualizar `apps/web/src/data/srlBlocks.ts`.
  - validar impacto no radar e score.
- Se adicionar nova tela:
  - registrar fluxo correspondente neste arquivo.
- Se alterar roteamento publico/auth:
  - validar redirecionamentos de `/`, `/auth/*` e fallback `*`.

## 6. Workflow: Qualidade e CI

1. Rodar `pnpm lint`.
2. Rodar `pnpm test`.
3. Rodar `pnpm build`.
4. Em mudancas de fluxo critico, rodar `pnpm test:e2e`.
5. Garantir que o pipeline de CI (`.github/workflows/ci.yml`) permaneceu verde.
