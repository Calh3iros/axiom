import { z } from 'zod';

export const panicRequestSchema = z.object({
  subject: z.string().min(1).max(200),
  chapter: z.string().max(200).optional(),
});

export type PanicRequest = z.infer<typeof panicRequestSchema>;
