import Fastify, { type FastifyInstance } from "fastify";

import { registerErrorHandler } from "./lib/errors.js";
import { authPlugin } from "./plugins/auth.js";
import { corsPlugin } from "./plugins/cors.js";
import { prismaPlugin } from "./plugins/prisma.js";
import { authRoutes } from "./routes/auth.js";
import { canvasesRoutes } from "./routes/canvases.js";
import { healthRoutes } from "./routes/health.js";
import { meRoutes } from "./routes/me.js";
import { researchRoutes } from "./routes/research.js";

async function apiRoutes(app: FastifyInstance): Promise<void> {
  // authRoutes e um plugin encapsulado: o rate limit registrado dentro dele
  // nao afeta as demais rotas da API.
  await app.register(authRoutes);
  await app.register(meRoutes);
  await app.register(canvasesRoutes);
  await app.register(researchRoutes);
}

export interface BuildAppOptions {
  logger?: boolean;
}

export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true });

  registerErrorHandler(app);

  await app.register(corsPlugin);
  await app.register(prismaPlugin);
  await app.register(authPlugin);
  await app.register(healthRoutes);
  await app.register(apiRoutes, { prefix: "/api" });

  return app;
}
