import { z } from 'zod';

export const chatRequestSchema = z.object({
  messages: z.array(z.any()).min(1).max(100),
  type: z.enum(['solve', 'learn']).default('solve'),
  chatId: z.string().uuid().optional(),
  locale: z.string().max(5).default('en'),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
