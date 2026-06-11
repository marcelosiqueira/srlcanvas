import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { env } from "../env.js";

export const corsPlugin = fp(
  async (app: FastifyInstance) => {
    if (env.NODE_ENV !== "production") {
      await app.register(cors, { origin: true });
    }
  },
  { name: "cors" }
);
