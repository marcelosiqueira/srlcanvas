import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildTestApp, resetDatabase } from "./helpers.js";

// /api/auth/* tem rate limit por IP (10/min); cada registro usa um IP proprio
// para os testes nao esbarrarem no limite (mesma estrategia de auth.test.ts).
let ipCounter = 1000;

async function registerUser(app: FastifyInstance, email: string): Promise<string> {
  ipCounter += 1;
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    remoteAddress: `10.1.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`,
    payload: { name: "Usuario Teste", email, password: "supersecret123" }
  });
  expect(response.statusCode).toBe(201);
  return response.json().token as string;
}

function authHeaders(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

describe("canvases", () => {
  let app: FastifyInstance;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(app.prisma);
    tokenA = await registerUser(app, "user-a@example.com");
    tokenB = await registerUser(app, "user-b@example.com");
  });

  it("retorna 401 sem token no GET e no PUT", async () => {
    const get = await app.inject({ method: "GET", url: "/api/canvases" });
    expect(get.statusCode).toBe(401);

    const put = await app.inject({
      method: "PUT",
      url: "/api/canvases",
      payload: { meta: {}, blocks: {} }
    });
    expect(put.statusCode).toBe(401);
  });

  it("GET retorna lista vazia para usuario sem canvases", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/canvases",
      headers: authHeaders(tokenA)
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ canvases: [] });
  });

  it("PUT sem id cria canvas com title default", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/api/canvases",
      headers: authHeaders(tokenA),
      payload: { meta: { foo: "bar" }, blocks: { b1: { text: "x" } } }
    });

    expect(response.statusCode).toBe(200);
    const { canvas } = response.json();
    expect(canvas).toEqual({
      id: expect.any(String),
      title: "Meu Canvas Estrategico",
      meta: { foo: "bar" },
      blocks: { b1: { text: "x" } },
      updated_at: expect.any(String)
    });
    // updated_at e uma data ISO valida
    expect(Number.isNaN(Date.parse(canvas.updated_at))).toBe(false);
  });

  it("PUT sem id cria canvas com title customizado", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/api/canvases",
      headers: authHeaders(tokenA),
      payload: { title: "Meu Plano 2026", meta: {}, blocks: {} }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().canvas.title).toBe("Meu Plano 2026");
  });

  it("PUT com id atualiza title/meta/blocks do proprio canvas e atualiza updated_at", async () => {
    const created = await app.inject({
      method: "PUT",
      url: "/api/canvases",
      headers: authHeaders(tokenA),
      payload: { meta: { v: 1 }, blocks: { a: 1 } }
    });
    const original = created.json().canvas;

    // Garante diferenca observavel no timestamp (precisao de ms no MySQL).
    await new Promise((resolve) => setTimeout(resolve, 20));

    const updated = await app.inject({
      method: "PUT",
      url: "/api/canvases",
      headers: authHeaders(tokenA),
      payload: {
        id: original.id,
        title: "Atualizado",
        meta: { v: 2 },
        blocks: { a: 2, b: 3 }
      }
    });

    expect(updated.statusCode).toBe(200);
    const { canvas } = updated.json();
    expect(canvas.id).toBe(original.id);
    expect(canvas.title).toBe("Atualizado");
    expect(canvas.meta).toEqual({ v: 2 });
    expect(canvas.blocks).toEqual({ a: 2, b: 3 });
    expect(Date.parse(canvas.updated_at)).toBeGreaterThan(Date.parse(original.updated_at));
  });

  it("PUT com id de canvas de outro usuario retorna 404 e nao altera o canvas", async () => {
    const created = await app.inject({
      method: "PUT",
      url: "/api/canvases",
      headers: authHeaders(tokenB),
      payload: { title: "Canvas do B", meta: { dono: "B" }, blocks: {} }
    });
    const canvasB = created.json().canvas;

    const attack = await app.inject({
      method: "PUT",
      url: "/api/canvases",
      headers: authHeaders(tokenA),
      payload: { id: canvasB.id, title: "Hackeado", meta: { dono: "A" }, blocks: { x: 1 } }
    });

    expect(attack.statusCode).toBe(404);
    expect(attack.json()).toEqual({ error: "canvas_not_found" });

    const intact = await app.prisma.canvas.findUnique({ where: { id: canvasB.id } });
    expect(intact?.title).toBe("Canvas do B");
    expect(intact?.meta).toEqual({ dono: "B" });
    expect(intact?.blocks).toEqual({});
  });

  it("GET de A nao lista canvases de B", async () => {
    await app.inject({
      method: "PUT",
      url: "/api/canvases",
      headers: authHeaders(tokenA),
      payload: { title: "Canvas do A", meta: {}, blocks: {} }
    });
    await app.inject({
      method: "PUT",
      url: "/api/canvases",
      headers: authHeaders(tokenB),
      payload: { title: "Canvas do B", meta: {}, blocks: {} }
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/canvases",
      headers: authHeaders(tokenA)
    });

    expect(response.statusCode).toBe(200);
    const { canvases } = response.json();
    expect(canvases).toHaveLength(1);
    expect(canvases[0].title).toBe("Canvas do A");
  });

  it("GET ordena por updated_at desc (canvas atualizado vem primeiro)", async () => {
    const first = await app.inject({
      method: "PUT",
      url: "/api/canvases",
      headers: authHeaders(tokenA),
      payload: { title: "Primeiro", meta: {}, blocks: {} }
    });
    const firstId = first.json().canvas.id;

    await new Promise((resolve) => setTimeout(resolve, 20));

    await app.inject({
      method: "PUT",
      url: "/api/canvases",
      headers: authHeaders(tokenA),
      payload: { title: "Segundo", meta: {}, blocks: {} }
    });

    await new Promise((resolve) => setTimeout(resolve, 20));

    // Atualiza o primeiro: ele deve voltar para o topo.
    await app.inject({
      method: "PUT",
      url: "/api/canvases",
      headers: authHeaders(tokenA),
      payload: { id: firstId, meta: { tocado: true }, blocks: {} }
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/canvases",
      headers: authHeaders(tokenA)
    });

    const titles = response.json().canvases.map((c: { title: string }) => c.title);
    expect(titles).toEqual(["Primeiro", "Segundo"]);
  });

  it("PUT com body invalido (meta nao-objeto) retorna 400 validation_error", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/api/canvases",
      headers: authHeaders(tokenA),
      payload: { meta: "nao-sou-objeto", blocks: {} }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("validation_error");
  });
});
