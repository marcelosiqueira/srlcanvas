import { z } from "zod";

// tsx/node nao carregam .env automaticamente; usamos a API nativa do Node 22.
// Em ambientes sem .env (CI, producao), o arquivo pode nao existir — ignoramos.
try {
  process.loadEnvFile(new URL("../.env", import.meta.url).pathname);
} catch {
  // .env ausente: as variaveis devem vir do ambiente.
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must have at least 32 characters"),
  PORT: z.coerce.number().int().positive().default(3333),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

export const env = envSchema.parse(process.env);
