import type { FastifyError, FastifyInstance } from "fastify";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError | Error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: "validation_error",
        issues: error.issues
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.message });
    }

    // Erros com statusCode definido (ex.: rate limit, body too large) sao repassados.
    if ("statusCode" in error && typeof error.statusCode === "number" && error.statusCode < 500) {
      return reply.status(error.statusCode).send({ error: error.message });
    }

    app.log.error(error);
    return reply.status(500).send({ error: "internal_server_error" });
  });
}
