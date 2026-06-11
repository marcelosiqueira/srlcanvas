import type { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";

// Abordagem do database de teste:
// - O script "test" do package.json roda `prisma migrate deploy` contra
//   TEST_DATABASE_URL (default: srlcanvas_test na instancia Docker local)
//   antes do vitest, garantindo que as tabelas existem.
// - O database precisa existir antes (veja .env.example):
//   docker exec srl-mysql mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS srlcanvas_test"
// - Aqui setamos as envs ANTES do import dinamico de src/app.ts, pois src/env.ts
//   parseia process.env no momento do import. process.loadEnvFile (usado em env.ts)
//   NAO sobrescreve variaveis ja definidas, entao estes valores prevalecem.
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "mysql://root:root@127.0.0.1:3307/srlcanvas_test";

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = "test-secret-0123456789abcdef-0123456789abcdef";
process.env.NODE_ENV = "test";

export async function buildTestApp(): Promise<FastifyInstance> {
  const { buildApp } = await import("../src/app.js");
  const app = await buildApp({ logger: false });
  await app.ready();
  return app;
}

export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  // Filhas primeiro (FKs com onDelete: Cascade existem, mas DELETE direto
  // na ordem certa evita depender disso).
  await prisma.researchSurveyResponse.deleteMany();
  await prisma.researchConsent.deleteMany();
  await prisma.canvas.deleteMany();
  await prisma.user.deleteMany();
}
