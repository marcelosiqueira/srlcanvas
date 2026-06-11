import { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";

import { AppError } from "../lib/errors.js";
import { updateProfileSchema } from "../schemas/auth.js";

export async function meRoutes(app: FastifyInstance): Promise<void> {
  app.get("/me", { preHandler: app.authenticate }, async (request) => {
    const user = await app.prisma.user.findUnique({ where: { id: request.userId } });
    // Token valido de user deletado: trata como nao autenticado.
    if (!user) {
      throw new AppError(401, "unauthorized");
    }

    return { user: { id: user.id, email: user.email, name: user.name } };
  });

  app.patch("/me", { preHandler: app.authenticate }, async (request) => {
    const data = updateProfileSchema.parse(request.body);

    try {
      const user = await app.prisma.user.update({
        where: { id: request.userId },
        data: { name: data.name }
      });
      return { user: { id: user.id, email: user.email, name: user.name } };
    } catch (error) {
      // P2025: registro nao encontrado (user deletado apos emissao do token).
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError(401, "unauthorized");
      }
      throw error;
    }
  });
}
