import rateLimit from "@fastify/rate-limit";
import { Prisma, type User } from "@prisma/client";
import type { FastifyInstance } from "fastify";

import { AppError } from "../lib/errors.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { loginSchema, registerSchema } from "../schemas/auth.js";

function publicUser(user: User): { id: string; email: string; name: string } {
  return { id: user.id, email: user.email, name: user.name };
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Escopado a este plugin: limita apenas as rotas de auth, nao a API toda.
  await app.register(rateLimit, { max: 10, timeWindow: "1 minute" });

  app.post("/auth/register", async (request, reply) => {
    const data = registerSchema.parse(request.body);

    const existing = await app.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError(409, "email_already_registered");
    }

    const passwordHash = await hashPassword(data.password);

    let user: User;
    try {
      user = await app.prisma.user.create({
        data: { name: data.name, email: data.email, passwordHash }
      });
    } catch (error) {
      // Corrida entre o findUnique e o create: unique constraint no email.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(409, "email_already_registered");
      }
      throw error;
    }

    const token = app.jwt.sign({ sub: user.id, email: user.email });
    return reply.code(201).send({ token, user: publicUser(user) });
  });

  app.post("/auth/login", async (request) => {
    const data = loginSchema.parse(request.body);

    const user = await app.prisma.user.findUnique({ where: { email: data.email } });
    // Mensagem unica para email inexistente e senha errada (nao vaza qual falhou).
    if (!user) {
      throw new AppError(401, "invalid_credentials");
    }

    const valid = await verifyPassword(user.passwordHash, data.password);
    if (!valid) {
      throw new AppError(401, "invalid_credentials");
    }

    const token = app.jwt.sign({ sub: user.id, email: user.email });
    return { token, user: publicUser(user) };
  });
}
