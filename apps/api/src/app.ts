import Fastify, { type FastifyInstance } from "fastify";

import { registerErrorHandler } from "./lib/errors.js";
import { corsPlugin } from "./plugins/cors.js";
import { prismaPlugin } from "./plugins/prisma.js";
import { healthRoutes } from "./routes/health.js";

async function apiRoutes(app: FastifyInstance): Promise<void> {
  // Placeholder: as rotas reais (auth, canvases, research) chegam nas fases 1b/1c.
  app.get("/ping", async () => ({ pong: true }));
}

export interface BuildAppOptions {
  logger?: boolean;
}

export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true });

  registerErrorHandler(app);

  await app.register(corsPlugin);
  await app.register(prismaPlugin);
  await app.register(healthRoutes);
  await app.register(apiRoutes, { prefix: "/api" });

  return app;
}
