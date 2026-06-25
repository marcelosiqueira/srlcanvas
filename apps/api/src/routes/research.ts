import type { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";

import { createConsentSchema, createSurveyResponseSchema } from "../schemas/research.js";

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
      }
    });

    return reply.code(201).send({ id: response.id });
  });
}
