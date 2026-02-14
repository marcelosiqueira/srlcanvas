# LGPD Playbook - SRL Canvas (Pesquisa Academica)

Ultima atualizacao: 2026-02-13

Este documento define os controles de privacidade e protecao de dados para o projeto SRL Canvas,
com foco no questionario quantitativo usado na dissertacao de mestrado.

> Importante: este material organiza a governanca de dados do projeto, mas nao substitui assessoria juridica.

## 1. Escopo

Aplica-se a:

- aplicacao web (`apps/web`)
- armazenamento no Supabase
- coleta de dados do survey de pesquisa
- exportacoes e analises da dissertacao

Nao cobre dados de terceiros inseridos indevidamente pelo participante (devem ser evitados).

## 2. Papéis e responsabilidades

- Controlador: responsavel pelo estudo (pesquisador/autor da dissertacao).
- Operador: infraestrutura de nuvem contratada (Supabase e provedores subjacentes).
- Encarregado (DPO): definir contato institucional para titulares (e-mail oficial do projeto).

## 3. Base legal e principios

Bases legais aplicadas no projeto:

- Consentimento do titular (art. 7, I): aceite explicito para participacao e tratamento dos dados.
- Estudos por orgao de pesquisa, com preferencia por anonimizar/pseudonimizar quando possivel (art. 7, IV).

Principios aplicados (art. 6):

- finalidade especifica (pesquisa academica sobre SRL Canvas)
- adequacao (dados coerentes com o objetivo)
- necessidade (minimizacao)
- transparencia (explicacao clara de uso dos dados)
- seguranca e prevencao
- nao discriminacao
- responsabilizacao e prestacao de contas

## 4. Inventario de dados coletados

### 4.1 Dados de conta (app)

- `auth.users.id` (UUID)
- e-mail de autenticacao (Supabase Auth)

### 4.2 Dados do survey

Tabela `public.research_survey_responses`:

- triagem e elegibilidade (18+, atuacao no ecossistema, visualizacao de material)
- perfil profissional (papel, experiencia, setor, estagio, localidade, tamanho de equipe)
- respostas de avaliacao do SRL Canvas (Likert 1-5)
- respostas SUS (usabilidade)
- adocao (contexto de uso, NPS, barreiras, melhorias)
- follow-up opcional (contato e permissao de citacao anonimizada)
- metadados tecnicos minimos (versao do questionario, timestamp, rota)

### 4.3 Dados sensiveis

O formulario nao solicita dados pessoais sensiveis por padrao.
Participantes sao instruidos a nao inserir dados sensiveis ou segredos empresariais.

## 5. Minimizacao e pseudonimizacao

- Evitar campos de identificacao direta desnecessarios.
- Manter contato apenas como opcional.
- Usar `user_id` tecnico no banco para vinculo de propriedade.
- Para analise da dissertacao, trabalhar com dados agregados e/ou pseudonimizados.
- Em publicacoes, usar apenas citacoes nao identificadas (quando autorizado).

## 6. Fluxo de consentimento

No app, antes do envio do survey:

1. Exibir objetivo da pesquisa, voluntariedade e tempo estimado.
2. Exibir aviso de nao envio de dados sigilosos/sensiveis.
3. Exigir checkbox de aceite antes de enviar.
4. Registrar no banco:
   - `consent_accepted = true`
   - `consent_version`
   - timestamp de submissao

Sem aceite, a submissao e bloqueada.

## 7. Direitos do titular (operacao)

Canal de atendimento: definir e divulgar e-mail oficial no app/README.

Fluxo recomendado:

1. Receber solicitacao (acesso, correcao, eliminacao, revogacao de consentimento).
2. Confirmar identidade minima do solicitante.
3. Mapear registros por `user_id` e/ou contato informado.
4. Executar acao solicitada.
5. Responder em prazo razoavel e registrar evidencias da acao.

## 8. Retencao e descarte

Politica sugerida para o estudo:

- Base ativa de pesquisa: durante o periodo da dissertacao.
- Base arquivada: somente dados necessarios para auditoria/metodologia.
- Contato para follow-up: remover apos conclusao das entrevistas ou pedido do titular.

Implementacao tecnica recomendada:

- job periodico para anonimizar/remover campos de contato apos prazo definido.
- processo documentado de exclusao sob demanda.

## 9. Controles tecnicos e organizacionais

### 9.1 Banco e acesso

- RLS habilitado nas tabelas (`research_survey_responses`, `canvases`, etc.).
- Politicas por proprietario (`auth.uid() = user_id`).
- sem uso de chave `service_role` no frontend.

### 9.2 Aplicacao

- validacao de campos obrigatorios no cliente
- bloqueio de envio sem consentimento
- logs sem payload sensivel
- isolamento de rascunhos no `localStorage` por usuario autenticado (sem compartilhamento entre contas no mesmo navegador)

### 9.3 Infra

- preferir regiao de dados no Brasil (Supabase `sa-east-1`) para reduzir riscos de transferencia.
- manter DPA do fornecedor aceito e arquivado.
- MFA em contas administrativas.

## 10. Incidentes de seguranca

Plano minimo:

1. Detectar e conter rapidamente.
2. Preservar evidencias e escopo do incidente.
3. Avaliar risco aos titulares.
4. Notificar partes aplicaveis (incluindo ANPD quando exigido).
5. Implementar acao corretiva e atualizar playbook.

## 11. Open source sem exposicao de dados

- Nunca versionar `.env` com segredos.
- Nunca commitar dumps reais de banco.
- Seeds e fixtures devem ser sinteticos.
- Remover PII de logs de erro e analytics.

## 12. Checklist operacional LGPD

Antes de publicar nova versao:

- [ ] termo de consentimento atualizado e versionado
- [ ] RLS validado para todas as tabelas de dados pessoais
- [ ] politica de retencao revisada
- [ ] fluxo de atendimento ao titular testado
- [ ] sem chaves/segredos no repositorio
- [ ] documentacao (`README`, `docs/supabase-setup.md`) atualizada

Antes de usar dados na dissertacao:

- [ ] extracao em formato pseudonimizado
- [ ] remocao de identificadores diretos
- [ ] uso de resultados agregados sempre que possivel
- [ ] respeito a autorizacoes de citacao textual
