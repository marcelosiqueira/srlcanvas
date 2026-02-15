# PRD - SRL Canvas App

## 1. Visao do Produto

Aplicacao web para diagnostico de maturidade de startups com base no framework SRL Canvas,
transformando avaliacao qualitativa em painel visual com evidencias, risco e priorizacao de acao.

## 2. Problema

Fundadores e avaliadores tendem a superestimar maturidade por opiniao.
Falta uma ferramenta simples e estruturada que force evidencias e destaque desequilibrios entre dimensoes.

## 3. Usuarios-alvo

- Fundadores de startups.
- Aceleradoras e incubadoras.
- Investidores e analistas de deal flow.
- Pesquisadores e avaliadores academicos.

## 4. Segmentos de Experiencia

- Iniciante: precisa de fluxo guiado, linguagem clara e apoio de decisao.
- Intermediario/experiente: precisa de velocidade operacional e comparabilidade.
- Academia/avaliacao: precisa de rastreabilidade metodologica, confiabilidade e evidencias.

## 5. Objetivos

- Padronizar avaliacao dos 12 blocos SRL.
- Tornar visiveis gargalos via radar.
- Quantificar risco via scorecard.
- Permitir registro de evidencias por bloco.
- Evitar perda de dados com persistencia local.
- Suportar pesquisa academica com consentimento, questionario e trilha auditavel.

## 6. Nao-objetivos

- Nao substituir CRM, ERP ou BI.
- Nao realizar due diligence automatizada.
- Nao emitir recomendacao de investimento automatica.

## 7. Requisitos Funcionais (MVP atual)

1. Editar metadados: startup, avaliador, data.
2. Avaliar 12 blocos com nota de 1 a 9.
3. Registrar notas descritivas por bloco.
4. Registrar evidencias por bloco.
5. Exibir status por bloco (`Pendente` ou `Nota: x/9`).
6. Calcular total (0 a 108) em tempo real.
7. Exibir radar com as 12 dimensoes.
8. Exibir scorecard: total, media, desvio-padrao, CV, score final.
9. Exportar resultados em PNG e PDF.
10. Resetar canvas atual sob confirmacao.
11. Persistir dados no `localStorage` com isolamento por escopo (`guest` e por `user_id` autenticado).
12. Suportar tema claro/escuro, com preferencia inicial baseada em `prefers-color-scheme` do navegador/sistema.
13. Exibir landing page publica em `/` com CTA para login/cadastro (ou entrada direta quando auth estiver desabilitado), incluindo blocos de "Sobre o Projeto" e "Material de Apoio".
14. Disponibilizar logout rapido no header das telas autenticadas, com redirecionamento para `/`.
15. Exigir TCLE antes do questionario academico e permitir revogacao de consentimento.
16. Salvar resposta de pesquisa em Supabase (quando habilitado) ou localStorage (modo local).
17. Organizar o questionario academico em etapas navegaveis com indicador de progresso e rascunho persistente da etapa atual.
18. Permitir governanca do questionario academico via configuracao (`enabled` e `activeVersion`) sem alterar o instrumento aprovado.
19. Disponibilizar modo avancado opcional no canvas com atalhos e acoes rapidas para reduzir cliques em avaliacoes recorrentes.
20. Para usuario autenticado com Supabase habilitado, sincronizar canvas remoto automaticamente durante a edicao, sem etapa manual de confirmacao na dashboard.
21. Exibir historico remoto de aplicacoes na dashboard e permitir comparativo temporal basico da avaliacao mais recente contra uma avaliacao anterior (delta de total, scorecard, CV e blocos preenchidos).
22. Instrumentar eventos essenciais de produto (inicio, conclusao e abandono por etapa) sem dados sensiveis, com relatorio agregado minimo disponivel para iteracao.

## 8. Requisitos Nao Funcionais

- Performance: interacoes sem travamentos perceptiveis em navegadores modernos.
- Performance de carregamento: usar code splitting por rotas para reduzir bundle inicial.
- Responsividade: uso em mobile e desktop.
- Confiabilidade: formulas consistentes e estaveis.
- Usabilidade: fluxo intuitivo com baixa curva de aprendizado.
- SEO: landing publica com metadados essenciais (title, description, Open Graph, robots e sitemap).
- Rastreabilidade: capacidade de justificar resultados por evidencia e historico de alteracoes.

## 9. Regras de Negocio

- Nota por bloco: inteiro de 1 a 9.
- Data de avaliacao: formato canonico `yyyy-mm-dd` no armazenamento e apresentacao localizada na interface.
- Total maximo: 108.
- Scorecard: `Total * (1 - CV)`.
- CV: `Desvio-padrao / Media`; quando media = 0, CV = 0.
- Recomendacao metodologica: notas > 3 devem ter evidencia minima registrada.
- Ao autenticar com Supabase, rascunho local legado (pre-auth) deve ser associado ao primeiro usuario logado e removido do escopo `guest`.
- Fluxo da survey academica deve permitir continuidade por etapa sem perda de resposta ja preenchida.
- Perguntas do instrumento aprovado no comite de etica devem permanecer congeladas ate nova aprovacao formal.

## 10. Fluxos Principais

1. Preencher metadados.
2. Avaliar bloco a bloco.
3. Revisar radar e scorecard.
4. Exportar resultado.
5. Reaplicar periodicamente para acompanhar evolucao.

Fluxo de entrada:

1. Abrir landing page publica em `/`.
2. Seguir para login/cadastro quando auth estiver habilitado.
3. Acessar dashboard/canvas apos autenticacao.

## 11. Criterios de Aceite (MVP)

- Usuario consegue concluir avaliacao completa dos 12 blocos sem erro.
- Scorecard reage imediatamente a alteracoes de nota.
- Refresh da pagina mantem estado salvo.
- Exportacoes geram arquivos validos.

## 12. Evolucao Planejada (Live Code)

1. Onboarding guiado para iniciantes (entrada orientada por etapas).
2. Modo avancado para usuarios experientes (atalhos e menor friccao).
3. Persistencia remota completa do canvas em operacao normal.
4. Historico de multiplos canvases e comparativo temporal.
5. Melhorias de acessibilidade de modais e navegacao por teclado.
6. Instrumentacao de uso para medicao de sucesso (sem vazar dados sensiveis).
7. Pacote metodologico para avaliacao academica (metricas, protocolo e trilha de evidencia).

## 13. Metricas de Sucesso (vNext)

- Taxa de conclusao da avaliacao completa (12 blocos).
- Tempo medio para completar a primeira avaliacao.
- Percentual de blocos com evidencia quando nota > 3.
- Taxa de conclusao do questionario academico apos TCLE.
- Taxa de abandono da survey por etapa.
- SUS medio e NPS medio em janelas de avaliacao definidas.

## 14. Arquitetura de Repositorio

- Monorepo com pnpm workspaces.
- Frontend em `apps/web`.
- Backend em `apps/api`.
- Modulos compartilhados em `packages/*`.
