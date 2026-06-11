import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildTestApp } from "./helpers.js";

describe("health & ping", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health responde 200 com status ok", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("@srl/api");
    expect(typeof body.timestamp).toBe("string");
  });

  it("GET /api/ping responde 200 com pong", async () => {
    const response = await app.inject({ method: "GET", url: "/api/ping" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ pong: true });
  });
});
