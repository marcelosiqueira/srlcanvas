import type { Canvas, User } from "@prisma/client";

export function publicUser(user: User): { id: string; email: string; name: string } {
  return { id: user.id, email: user.email, name: user.name };
}

// O frontend (RemoteCanvas) espera `updated_at` em snake_case como string ISO.
export function publicCanvas(canvas: Canvas): {
  id: string;
  title: string;
  meta: unknown;
  blocks: unknown;
  updated_at: string;
} {
  return {
    id: canvas.id,
    title: canvas.title,
    meta: canvas.meta,
    blocks: canvas.blocks,
    updated_at: canvas.updatedAt.toISOString()
  };
}
