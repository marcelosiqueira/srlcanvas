# Survey: editar resposta existente ao reabrir

**Data:** 2026-06-30
**Rota afetada:** `/survey` (`ResearchSurveyPage`)

## Problema

Ao finalizar a pesquisa, o rascunho (`draft`) é apagado do localStorage. Ao reabrir
`/survey`, o formulário volta zerado, como se nunca tivesse sido respondido — a resposta
enviada continua salva (backend ou localStorage `...responses-v1`), mas nada a detecta na
reabertura. Isso confunde quem já participou.

## Objetivo

Ao reabrir `/survey`, se já existe uma resposta enviada por aquele participante (mesmo
browser), mostrar uma **tela intermediária** em vez do formulário vazio, com dois caminhos:

- **Editar minhas respostas** — formulário pré-preenchido com a resposta anterior.
- **Responder do zero** — formulário em branco.

Ambos, ao enviar, **atualizam o mesmo registro** (`PUT`). Mantém-se **um registro por
participante**, sempre a versão mais recente.

## Escopo de detecção

- **Logado:** busca no backend pelo `userId`.
- **Anônimo (mesmo browser):** guarda o `id` da resposta no localStorage ao enviar e usa
  para reabrir/editar. Não cobre cross-device para anônimos (aceitável — pesquisa aberta).

## Backend (`apps/api`)

Hoje só existe `POST /research/survey-responses`. Adicionar:

- `GET /research/survey-responses/mine` — logado: resposta mais recente do `userId` (ou 404).
- `GET /research/survey-responses/:id` — anônimo: busca pelo `id` guardado no localStorage.
- `PUT /research/survey-responses/:id` — atualiza o registro. Validação Zod igual ao POST.
  - **Regra de acesso:** se o registro tem `userId`, exige o mesmo usuário autenticado
    (403 caso contrário). Se anônimo (`userId = null`), o próprio `id` (UUID) funciona como
    token de capacidade.

## Frontend (`apps/web`)

### `researchSurveyApi.ts`

- No envio bem-sucedido, guardar `{ id, submittedAt }` no localStorage:
  `srl-research-survey-submission-v1:{userId|guest}`.
- `loadSubmittedResearchResponse(userId)` → `{ id, submittedAt, values } | null`:
  - Logado+API → `GET /mine`.
  - Anônimo+API → lê id local e `GET /:id`.
  - Sem API → lê do `...responses-v1` no localStorage.
- `mapPayloadToFormValues()` — inverso do `buildPayload`, reidrata o form do JSON salvo
  (snake_case → form values).
- `updateResearchSurveyResponse(id, payload)` → `PUT`.

### `ResearchSurveyPage.tsx`

- Novo estado: `existingSubmission` e `mode` (`checking` → `interstitial` →
  `editing`/`fresh`, ou `new` quando não há resposta).
- No mount, após o check de consentimento: `loadSubmittedResearchResponse`. Achou → tela
  intermediária. Não achou → fluxo atual de rascunho (resposta nova).
- Tela intermediária: _"Você já respondeu em ‹data›."_ + **[Editar minhas respostas]** /
  **[Responder do zero]**.
  - Editar → `setValues(existingSubmission.values)`, mode `editing`.
  - Do zero → `makeInitialResearchSurveyValues()`, mode `fresh` (com `confirm` antes, pois
    descarta as respostas anteriores na próxima submissão).
- Envio: se `existingSubmission` existe → `updateResearchSurveyResponse(id, payload)`;
  senão → `POST` (create).

## Edge cases

- **Anônimo com id local mas registro ausente no backend (404):** tratar como resposta nova,
  limpar o id guardado.
- **Rascunho obsoleto:** ao escolher editar/do zero, redefinir o draft para o estado inicial
  escolhido (evita o autosave antigo sobrescrever).
- **Consentimento revogado:** gating atual já bloqueia o acesso; sem mudança.

## Testes

- **Backend:** `PUT` atualiza o registro; logado não atualiza resposta de outro (403);
  anônimo atualiza pelo id; `GET /mine` e `GET /:id` retornam o esperado.
- **Frontend:** round-trip `buildPayload → mapPayloadToFormValues` preserva os valores;
  intermediária aparece quando há submissão; editar pré-preenche; do zero esvazia; envio
  chama `PUT` (não `POST`) quando há `existingSubmission`.
