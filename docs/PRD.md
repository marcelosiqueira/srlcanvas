# PRD - SRL Canvas App

## 1. Visao do Produto

Aplicacao web para diagnostico de maturidade de startups com base no framework SRL Canvas, transformando avaliacao qualitativa em um painel visual com evidencias e risco.

## 2. Problema

Fundadores e avaliadores tendem a superestimar maturidade por opiniao. Falta uma ferramenta simples e estruturada que force evidencias e destaque desequilibrios entre dimensoes.

## 3. Usuarios-alvo

- Fundadores de startups.
- Aceleradoras e incubadoras.
- Investidores e analistas de deal flow.

## 4. Objetivos

- Padronizar avaliacao dos 12 blocos SRL.
- Tornar visiveis gargalos via radar.
- Quantificar risco via scorecard.
- Permitir registro de evidencias por bloco.
- Evitar perda de dados com persistencia local.

## 5. Nao-objetivos

- Nao substituir CRM, ERP ou BI.
- Nao realizar due diligence automatizada.
- Nao emitir recomendacao de investimento automatica.

## 6. Requisitos Funcionais

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
12. Suportar tema claro/escuro.
13. Exibir landing page publica em `/` com CTA para login/cadastro (ou entrada direta no app quando auth estiver desabilitado), incluindo blocos de "Sobre o Projeto" e "Material de Apoio (Uso Offline)".
14. Disponibilizar logout rapido no header das telas autenticadas, com redirecionamento para a landing page (`/`).

## 7. Requisitos Nao Funcionais

- Performance: interacoes sem travamentos perceptiveis em navegadores modernos.
- Responsividade: uso em mobile e desktop.
- Confiabilidade: formulas consistentes e estaveis.
- Usabilidade: fluxo intuitivo com baixa curva de aprendizado.
- SEO: landing publica com metadados essenciais (title, description, Open Graph, robots e sitemap).

## 8. Regras de Negocio

- Nota por bloco: inteiro de 1 a 9.
- Total maximo: 108.
- Scorecard: `Total * (1 - CV)`.
- CV: `Desvio-padrao / Media`; quando media = 0, CV = 0.
- Recomendacao metodologica: notas > 3 devem ter evidencia minima registrada.
- Ao autenticar com Supabase, rascunho local legado (pre-auth) deve ser associado ao primeiro usuario logado e removido do escopo `guest`.

## 9. Fluxos Principais

1. Preencher metadados.
2. Avaliar bloco a bloco.
3. Revisar radar e scorecard.
4. Exportar resultado.
5. Reaplicar periodicamente para acompanhar evolucao.

Fluxo de entrada:

1. Abrir landing page publica em `/`.
2. Seguir para login/cadastro quando auth estiver habilitado.
3. Acessar dashboard/canvas apos autenticacao.

## 10. Criterios de Aceite (MVP)

- Usuario consegue concluir avaliacao completa dos 12 blocos sem erro.
- Scorecard reage imediatamente a alteracoes de nota.
- Refresh da pagina mantem estado salvo.
- Exportacoes geram arquivos validos.

## 11. Evolucao Planejada

- Historico de multiplos canvases.
- Comparativo temporal (velocidade de maturidade).
- Compartilhamento por link/token.
- Perfis e controle de acesso.

## 12. Arquitetura de Repositorio

- Monorepo com pnpm workspaces.
- Frontend em `apps/web`.
- Backend em `apps/api`.
- Modulos compartilhados em `packages/*`.
