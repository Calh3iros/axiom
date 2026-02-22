import { z } from 'zod';

export const humanizeRequestSchema = z.object({
  text: z.string().min(10).max(5000),
  mode: z.enum(['academic', 'casual', 'pro']).default('academic'),
  locale: z.string().optional().default('en'),
});

export type HumanizeRequest = z.infer<typeof humanizeRequestSchema>;
