import type { Prisma, ResearchSurveyResponse } from "@prisma/client";
import type { FastifyInstance } from "fastify";

import { createConsentSchema, createSurveyResponseSchema } from "../schemas/research.js";

function serializeSurveyResponse(response: ResearchSurveyResponse) {
  return {
    id: response.id,
    createdAt: response.createdAt.toISOString(),
    consentAccepted: response.consentAccepted,
    consentVersion: response.consentVersion,
    age18OrMore: response.age18OrMore,
    actedInEcosystem12m: response.actedInEcosystem12m,
    viewedSrlMaterial: response.viewedSrlMaterial,
    isEligible: response.isEligible,
    profile: response.profile,
    dimensionAnswers: response.dimensionAnswers,
    scaleFeedback: response.scaleFeedback,
    susAnswers: response.susAnswers,
    adoptionFeedback: response.adoptionFeedback,
    followUp: response.followUp,
    metadata: response.metadata
  };
}

// Campos graváveis de uma resposta (sem tocar userId nem createdAt).
// Tipo inferido para servir tanto a create quanto a update.
function surveyResponseData(data: ReturnType<typeof createSurveyResponseSchema.parse>) {
  return {
    consentAccepted: data.consentAccepted,
    consentVersion: data.consentVersion,
    age18OrMore: data.age18OrMore,
    actedInEcosystem12m: data.actedInEcosystem12m,
    viewedSrlMaterial: data.viewedSrlMaterial,
    isEligible: data.isEligible,
    profile: data.profile as Prisma.InputJsonValue,
    dimensionAnswers: data.dimensionAnswers as Prisma.InputJsonValue,
    scaleFeedback: data.scaleFeedback as Prisma.InputJsonValue,
    susAnswers: data.susAnswers as Prisma.InputJsonValue,
    adoptionFeedback: data.adoptionFeedback as Prisma.InputJsonValue,
    followUp: data.followUp as Prisma.InputJsonValue,
    metadata: data.metadata as Prisma.InputJsonValue
  };
}

export async function researchRoutes(app: FastifyInstance): Promise<void> {
  app.get("/research/consent", { preHandler: app.authenticate }, async (request) => {
    const consent = await app.prisma.researchConsent.findFirst({
      where: { userId: request.userId, accepted: true, revokedAt: null },
      orderBy: { createdAt: "desc" }
    });

    if (!consent) {
      return { accepted: false, acceptedAt: null, consentId: null };
    }

    return {
      accepted: true,
      acceptedAt: consent.createdAt.toISOString(),
      consentId: consent.id
    };
  });

  app.post("/research/consent", { preHandler: app.authenticate }, async (request, reply) => {
    const data = createConsentSchema.parse(request.body);

    const consent = await app.prisma.researchConsent.create({
      data: {
        userId: request.userId,
        // accepted e sempre true no servidor: revogacao e via /revoke.
        accepted: true,
        consentVersion: data.consentVersion,
        surveyVersion: data.surveyVersion,
        metadata: data.metadata as Prisma.InputJsonValue
      }
    });

    return reply.code(201).send({ id: consent.id });
  });

  app.post("/research/consent/revoke", { preHandler: app.authenticate }, async (request, reply) => {
    const active = await app.prisma.researchConsent.findFirst({
      where: { userId: request.userId, accepted: true, revokedAt: null },
      orderBy: { createdAt: "desc" }
    });

    // Idempotente: sem consent ativo tambem responde 204.
    if (active) {
      await app.prisma.researchConsent.update({
        where: { id: active.id },
        data: { revokedAt: new Date() }
      });
    }

    return reply.code(204).send();
  });

  // Resposta da pesquisa: auth OPCIONAL — aceita respostas anônimas (de quem
  // não usa a aplicação). Logado => associa ao userId; anônimo => userId null.
  app.post("/research/survey-responses", async (request, reply) => {
    let userId: string | null = null;
    try {
      await request.jwtVerify();
      userId = (request.user as { sub: string }).sub;
    } catch {
      userId = null;
    }

    const data = createSurveyResponseSchema.parse(request.body);

    const response = await app.prisma.researchSurveyResponse.create({
      data: {
        userId,
        ...surveyResponseData(data)
      }
    });

    return reply.code(201).send({ id: response.id });
  });

  // Resposta mais recente do usuario logado (para reabrir/editar).
  app.get(
    "/research/survey-responses/mine",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const response = await app.prisma.researchSurveyResponse.findFirst({
        where: { userId: request.userId },
        orderBy: { createdAt: "desc" }
      });

      if (!response) {
        return reply.code(404).send({ error: "not_found" });
      }

      return serializeSurveyResponse(response);
    }
  );

  // Resposta ANONIMA pelo id (o UUID funciona como token de capacidade).
  // Respostas identificadas nao sao expostas aqui — o dono usa /mine.
  app.get("/research/survey-responses/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const response = await app.prisma.researchSurveyResponse.findUnique({ where: { id } });
    if (!response || response.userId !== null) {
      return reply.code(404).send({ error: "not_found" });
    }

    return serializeSurveyResponse(response);
  });

  // Atualiza uma resposta existente (mantem um registro por participante).
  // Identificada => so o dono autenticado; anonima => o id basta.
  app.put("/research/survey-responses/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    let userId: string | null = null;
    try {
      await request.jwtVerify();
      userId = (request.user as { sub: string }).sub;
    } catch {
      userId = null;
    }

    const existing = await app.prisma.researchSurveyResponse.findUnique({ where: { id } });
    if (!existing) {
      return reply.code(404).send({ error: "not_found" });
    }
    if (existing.userId !== null && existing.userId !== userId) {
      return reply.code(403).send({ error: "forbidden" });
    }

    const data = createSurveyResponseSchema.parse(request.body);
    const response = await app.prisma.researchSurveyResponse.update({
      where: { id },
      data: surveyResponseData(data)
    });

    return reply.send({ id: response.id });
  });
}
