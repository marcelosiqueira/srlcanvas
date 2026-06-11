import { buildApp } from "./app.js";
import { env } from "./env.js";

const start = async (): Promise<void> => {
  const app = await buildApp({ logger: true });

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`API listening on http://${env.HOST}:${env.PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
