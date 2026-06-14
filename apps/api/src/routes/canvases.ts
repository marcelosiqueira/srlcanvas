import type { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";

import { AppError } from "../lib/errors.js";
import { publicCanvas } from "../lib/serializers.js";
import { upsertCanvasSchema } from "../schemas/canvases.js";

export async function canvasesRoutes(app: FastifyInstance): Promise<void> {
  app.get("/canvases", { preHandler: app.authenticate }, async (request) => {
    const canvases = await app.prisma.canvas.findMany({
      where: { userId: request.userId },
      orderBy: { updatedAt: "desc" }
    });

    return { canvases: canvases.map(publicCanvas) };
  });

  app.put("/canvases", { preHandler: app.authenticate }, async (request) => {
    const data = upsertCanvasSchema.parse(request.body);
    const meta = data.meta as Prisma.InputJsonValue;
    const blocks = data.blocks as Prisma.InputJsonValue;

    if (!data.id) {
      const canvas = await app.prisma.canvas.create({
        data: {
          userId: request.userId,
          meta,
          blocks,
          // title ausente: deixa o default do schema valer.
          ...(data.title !== undefined ? { title: data.title } : {})
        }
      });
      return { canvas: publicCanvas(canvas) };
    }

    // updateMany com {id, userId} garante que um usuario nunca sobrescreve
    // canvas alheio (equivalente ao RLS antigo): count 0 = nao existe OU nao e dele.
    const result = await app.prisma.canvas.updateMany({
      where: { id: data.id, userId: request.userId },
      data: {
        meta,
        blocks,
        ...(data.title !== undefined ? { title: data.title } : {})
      }
    });

    if (result.count === 0) {
      throw new AppError(404, "canvas_not_found");
    }

    const canvas = await app.prisma.canvas.findUniqueOrThrow({ where: { id: data.id } });
    return { canvas: publicCanvas(canvas) };
  });
}
