import { z } from "zod";

export const upsertCanvasSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().min(1).optional(),
  meta: z.record(z.string(), z.unknown()),
  blocks: z.record(z.string(), z.unknown())
});

export type UpsertCanvasInput = z.infer<typeof upsertCanvasSchema>;
