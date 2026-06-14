import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildTestApp, resetDatabase } from "./helpers.js";

// /api/auth/* tem rate limit por IP (10/min); cada registro usa um IP proprio
// para os testes nao esbarrarem no limite (mesma estrategia de auth.test.ts).
let ipCounter = 2000;

async function registerUser(
  app: FastifyInstance,
  email: string
): Promise<{ token: string; userId: string }> {
  ipCounter += 1;
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    remoteAddress: `10.2.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`,
    payload: { name: "Usuario Teste", email, password: "supersecret123" }
  });
  expect(response.statusCode).toBe(201);
  const body = response.json();
  return { token: body.token as string, userId: body.user.id as string };
}

function authHeaders(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

const validConsent = {
  consentVersion: "v1",
  surveyVersion: "v1",
  metadata: { source: "test" }
};

const validSurveyResponse = {
  consentAccepted: true,
  consentVersion: "v1",
  age18OrMore: true,
  actedInEcosystem12m: true,
  viewedSrlMaterial: false,
  isEligible: true,
  profile: { role: "founder" },
  dimensionAnswers: { d1: 5 },
  scaleFeedback: { clear: true },
  susAnswers: { q1: 4 },
  adoptionFeedback: { wouldUse: true },
  followUp: { email: false },
  metadata: { durationMs: 1234 }
};

describe("research", () => {
  let app: FastifyInstance;
  let userA: { token: string; userId: string };
  let userB: { token: string; userId: string };

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(app.prisma);
    userA = await registerUser(app, "research-a@example.com");
    userB = await registerUser(app, "research-b@example.com");
  });

  describe("consent", () => {
    it("retorna 401 sem token", async () => {
      const get = await app.inject({ method: "GET", url: "/api/research/consent" });
      expect(get.statusCode).toBe(401);

      const post = await app.inject({
        method: "POST",
        url: "/api/research/consent",
        payload: validConsent
      });
      expect(post.statusCode).toBe(401);

      const revoke = await app.inject({ method: "POST", url: "/api/research/consent/revoke" });
      expect(revoke.statusCode).toBe(401);
    });

    it("GET inicial retorna accepted false", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/research/consent",
        headers: authHeaders(userA.token)
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ accepted: false, acceptedAt: null, consentId: null });
    });

    it("POST cria consent (201) e GET passa a retornar accepted true", async () => {
      const post = await app.inject({
        method: "POST",
        url: "/api/research/consent",
        headers: authHeaders(userA.token),
        payload: validConsent
      });

      expect(post.statusCode).toBe(201);
      const { id } = post.json();
      expect(typeof id).toBe("string");

      const get = await app.inject({
        method: "GET",
        url: "/api/research/consent",
        headers: authHeaders(userA.token)
      });

      expect(get.statusCode).toBe(200);
      const body = get.json();
      expect(body.accepted).toBe(true);
      expect(body.consentId).toBe(id);
      expect(Number.isNaN(Date.parse(body.acceptedAt))).toBe(false);
    });

    it("POST retorna 400 para body invalido (consentVersion vazio)", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/research/consent",
        headers: authHeaders(userA.token),
        payload: { ...validConsent, consentVersion: "" }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe("validation_error");
    });

    it("revoke retorna 204, GET volta a accepted false e revoke repetido segue 204", async () => {
      await app.inject({
        method: "POST",
        url: "/api/research/consent",
        headers: authHeaders(userA.token),
        payload: validConsent
      });

      const revoke = await app.inject({
        method: "POST",
        url: "/api/research/consent/revoke",
        headers: authHeaders(userA.token)
      });
      expect(revoke.statusCode).toBe(204);
      expect(revoke.body).toBe("");

      const get = await app.inject({
        method: "GET",
        url: "/api/research/consent",
        headers: authHeaders(userA.token)
      });
      expect(get.json()).toEqual({ accepted: false, acceptedAt: null, consentId: null });

      // Idempotente: revogar sem consent ativo tambem responde 204.
      const again = await app.inject({
        method: "POST",
        url: "/api/research/consent/revoke",
        headers: authHeaders(userA.token)
      });
      expect(again.statusCode).toBe(204);
    });

    it("consent de A e invisivel para B (GET de B segue accepted false)", async () => {
      await app.inject({
        method: "POST",
        url: "/api/research/consent",
        headers: authHeaders(userA.token),
        payload: validConsent
      });

      const getB = await app.inject({
        method: "GET",
        url: "/api/research/consent",
        headers: authHeaders(userB.token)
      });
      expect(getB.json()).toEqual({ accepted: false, acceptedAt: null, consentId: null });

      // E o revoke de B nao toca o consent de A.
      await app.inject({
        method: "POST",
        url: "/api/research/consent/revoke",
        headers: authHeaders(userB.token)
      });
      const getA = await app.inject({
        method: "GET",
        url: "/api/research/consent",
        headers: authHeaders(userA.token)
      });
      expect(getA.json().accepted).toBe(true);
    });
  });

  describe("POST /api/research/survey-responses", () => {
    it("retorna 401 sem token", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/research/survey-responses",
        payload: validSurveyResponse
      });
      expect(response.statusCode).toBe(401);
    });

    it("cria resposta (201) com userId do token, ignorando userId do body", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/research/survey-responses",
        headers: authHeaders(userA.token),
        // userId no body deve ser IGNORADO: o dono vem do JWT.
        payload: { ...validSurveyResponse, userId: userB.userId }
      });

      expect(response.statusCode).toBe(201);
      const { id } = response.json();
      expect(typeof id).toBe("string");

      const stored = await app.prisma.researchSurveyResponse.findUnique({ where: { id } });
      expect(stored?.userId).toBe(userA.userId);
      expect(stored?.consentAccepted).toBe(true);
      expect(stored?.profile).toEqual(validSurveyResponse.profile);
    });

    it("retorna 400 quando consentAccepted e false", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/research/survey-responses",
        headers: authHeaders(userA.token),
        payload: { ...validSurveyResponse, consentAccepted: false }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe("validation_error");
    });

    it("retorna 400 quando faltam campos obrigatorios", async () => {
      const semProfile: Record<string, unknown> = { ...validSurveyResponse };
      delete semProfile.profile;
      const response = await app.inject({
        method: "POST",
        url: "/api/research/survey-responses",
        headers: authHeaders(userA.token),
        payload: semProfile
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe("validation_error");
    });
  });
});
