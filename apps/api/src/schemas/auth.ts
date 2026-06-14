import { z } from "zod";

// trim/lowercase ANTES da validacao de formato, para aceitar
// " MARIA@Example.COM " e persistir sempre normalizado.
const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: emailSchema,
  password: z.string().min(8)
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1)
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
