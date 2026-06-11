import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildTestApp, resetDatabase } from "./helpers.js";

// Arquivo separado para isolar o contador do rate limit: cada arquivo cria
// um app novo via buildTestApp, e o contador vive na instancia do app.
describe("rate limit nas rotas de auth", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
    await resetDatabase(app.prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it("11 logins seguidos: o 11o responde 429", async () => {
    const payload = { email: "rate@example.com", password: "senha-qualquer" };

    for (let i = 0; i < 10; i++) {
      const response = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload
      });
      expect(response.statusCode).toBe(401);
    }

    const eleventh = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload
    });
    expect(eleventh.statusCode).toBe(429);
  });
});
