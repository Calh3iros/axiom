import { z } from 'zod';

export const writeRequestSchema = z.object({
  action: z.enum(['outline', 'expand', 'cite', 'humanize', 'conclude']),
  content: z.string().min(1).max(10240),
  context: z.string().max(5000).optional(),
});

export type WriteRequest = z.infer<typeof writeRequestSchema>;
