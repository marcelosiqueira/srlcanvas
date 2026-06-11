import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildTestApp, resetDatabase } from "./helpers.js";

const validUser = {
  name: "Maria Silva",
  email: "maria@example.com",
  password: "supersecret123"
};

// As rotas /api/auth/* tem rate limit por IP (10/min). Para os testes deste
// arquivo nao esbarrarem no limite, cada teste usa um remoteAddress proprio.
// O caso do rate limit em si vive em test/rate-limit.test.ts.
let ipCounter = 0;
let currentIp = "10.0.0.1";

async function registerUser(
  app: FastifyInstance,
  payload: Record<string, unknown> = validUser
): Promise<{ statusCode: number; body: any }> {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    remoteAddress: currentIp,
    payload
  });
  return { statusCode: response.statusCode, body: response.json() };
}

describe("auth", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    ipCounter += 1;
    currentIp = `10.0.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`;
    await resetDatabase(app.prisma);
  });

  describe("POST /api/auth/register", () => {
    it("registra usuario e retorna 201 com token e user, sem expor senha", async () => {
      const { statusCode, body } = await registerUser(app);

      expect(statusCode).toBe(201);
      expect(typeof body.token).toBe("string");
      expect(body.token.length).toBeGreaterThan(0);
      expect(body.user).toEqual({
        id: expect.any(String),
        email: validUser.email,
        name: validUser.name
      });

      const raw = JSON.stringify(body);
      expect(raw).not.toContain(validUser.password);
      expect(raw).not.toContain("passwordHash");
      expect(raw).not.toContain("password_hash");
    });

    it("normaliza email para lowercase", async () => {
      const { statusCode, body } = await registerUser(app, {
        ...validUser,
        email: "MARIA@Example.COM"
      });

      expect(statusCode).toBe(201);
      expect(body.user.email).toBe("maria@example.com");
    });

    it("retorna 409 para email duplicado", async () => {
      await registerUser(app);
      const { statusCode, body } = await registerUser(app);

      expect(statusCode).toBe(409);
      expect(body).toEqual({ error: "email_already_registered" });
    });

    it("retorna 400 validation_error para senha curta", async () => {
      const { statusCode, body } = await registerUser(app, {
        ...validUser,
        password: "curta"
      });

      expect(statusCode).toBe(400);
      expect(body.error).toBe("validation_error");
      expect(Array.isArray(body.issues)).toBe(true);
    });

    it("retorna 400 validation_error para email invalido", async () => {
      const { statusCode, body } = await registerUser(app, {
        ...validUser,
        email: "nao-e-email"
      });

      expect(statusCode).toBe(400);
      expect(body.error).toBe("validation_error");
    });
  });

  describe("POST /api/auth/login", () => {
    it("loga com credenciais corretas e retorna 200 com token e user", async () => {
      await registerUser(app);

      const response = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        remoteAddress: currentIp,
        payload: { email: validUser.email, password: validUser.password }
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(typeof body.token).toBe("string");
      expect(body.user).toEqual({
        id: expect.any(String),
        email: validUser.email,
        name: validUser.name
      });
    });

    it("retorna 401 invalid_credentials para senha errada", async () => {
      await registerUser(app);

      const response = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        remoteAddress: currentIp,
        payload: { email: validUser.email, password: "senha-errada-123" }
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({ error: "invalid_credentials" });
    });

    it("retorna 401 com a MESMA mensagem para email inexistente", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        remoteAddress: currentIp,
        payload: { email: "ninguem@example.com", password: "qualquercoisa" }
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({ error: "invalid_credentials" });
    });
  });

  describe("GET /api/me", () => {
    it("retorna 401 sem token", async () => {
      const response = await app.inject({ method: "GET", url: "/api/me" });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({ error: "unauthorized" });
    });

    it("retorna 200 com o user correto quando autenticado", async () => {
      const { body: registered } = await registerUser(app);

      const response = await app.inject({
        method: "GET",
        url: "/api/me",
        headers: { authorization: `Bearer ${registered.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        user: {
          id: registered.user.id,
          email: validUser.email,
          name: validUser.name
        }
      });
    });

    it("retorna 401 com token de user deletado", async () => {
      const { body: registered } = await registerUser(app);
      await app.prisma.user.delete({ where: { id: registered.user.id } });

      const response = await app.inject({
        method: "GET",
        url: "/api/me",
        headers: { authorization: `Bearer ${registered.token}` }
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({ error: "unauthorized" });
    });

    it("retorna 401 com token corrompido (assinatura invalida)", async () => {
      const { body: registered } = await registerUser(app);
      const [header, payload, signature] = registered.token.split(".");
      // Troca um caractere do payload para invalidar a assinatura.
      const tamperedChar = payload[0] === "A" ? "B" : "A";
      const tampered = `${header}.${tamperedChar}${payload.slice(1)}.${signature}`;

      const response = await app.inject({
        method: "GET",
        url: "/api/me",
        headers: { authorization: `Bearer ${tampered}` }
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({ error: "unauthorized" });
    });
  });

  describe("PATCH /api/me", () => {
    it("atualiza o nome e GET /me reflete a mudanca", async () => {
      const { body: registered } = await registerUser(app);

      const patch = await app.inject({
        method: "PATCH",
        url: "/api/me",
        headers: { authorization: `Bearer ${registered.token}` },
        payload: { name: "Maria Atualizada" }
      });

      expect(patch.statusCode).toBe(200);
      expect(patch.json()).toEqual({
        user: {
          id: registered.user.id,
          email: validUser.email,
          name: "Maria Atualizada"
        }
      });

      const me = await app.inject({
        method: "GET",
        url: "/api/me",
        headers: { authorization: `Bearer ${registered.token}` }
      });
      expect(me.json().user.name).toBe("Maria Atualizada");
    });

    it("retorna 401 sem token", async () => {
      const response = await app.inject({
        method: "PATCH",
        url: "/api/me",
        payload: { name: "Novo Nome" }
      });

      expect(response.statusCode).toBe(401);
    });

    it("retorna 400 para name vazio", async () => {
      const { body: registered } = await registerUser(app);

      const response = await app.inject({
        method: "PATCH",
        url: "/api/me",
        headers: { authorization: `Bearer ${registered.token}` },
        payload: { name: "" }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe("validation_error");
    });
  });
});
