import { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export interface PrismaPluginOptions {
  client?: PrismaClient;
}

export const prismaPlugin = fp(
  async (app: FastifyInstance, opts: PrismaPluginOptions) => {
    const prisma = opts.client ?? new PrismaClient();
    await prisma.$connect();

    app.decorate("prisma", prisma);

    app.addHook("onClose", async () => {
      await prisma.$disconnect();
    });
  },
  { name: "prisma" }
);
