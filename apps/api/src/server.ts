import Fastify from "fastify";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3333),
  HOST: z.string().default("0.0.0.0")
});

const env = envSchema.parse(process.env);

const server = Fastify({
  logger: true
});

server.get("/health", async () => ({
  status: "ok",
  service: "@srl/api",
  timestamp: new Date().toISOString()
}));

const start = async (): Promise<void> => {
  try {
    await server.listen({ port: env.PORT, host: env.HOST });
    server.log.info(`API listening on http://${env.HOST}:${env.PORT}`);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

void start();
