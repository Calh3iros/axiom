import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { aiRatelimit } from '@/lib/ratelimit';
import { checkUsage, incrementUsage, getUserAndPlan } from '@/lib/usage';
import { panicRequestSchema } from '@/lib/validators/panic';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

const panicSchema = z.object({
  summary: z.string().describe('1-page summary of key concepts for the topic'),
  questions: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).describe('10 most likely exam questions with detailed answers'),
  flashcards: z.array(z.object({
    front: z.string(),
    back: z.string(),
  })).describe('Quick memorization flashcards for key terms and concepts'),
  study_plan: z.string().describe('A focused 2-hour guided study plan'),
});

export async function POST(req: Request) {
  try {
    // P0.3 — Input validation
    const json = await req.json();
    const parsed = panicRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }
    const { subject, chapter } = parsed.data;

    // Check user plan and rate limits
    const { userId, plan } = await getUserAndPlan(req);

    // P0.2 — Rate limiting (by IP for DDoS protection)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'anonymous';
    const { success: rateLimitOk } = await aiRatelimit.limit(ip);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const usage = await checkUsage(userId, 'learn', plan);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: 'Daily Panic Mode limit reached. Upgrade to Pro for unlimited access.' },
        { status: 429 }
      );
    }

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: panicSchema,
      prompt: `Subject: ${subject}${chapter ? `, Chapter/Topic: ${chapter}` : ''}.
Generate a complete exam preparation package. Make it thorough but concise.
Focus on the most important concepts and likely exam questions.
CRITICAL: You MUST respond and fill all JSON fields EXCLUSIVELY in the same language as the 'Subject' provided by the user. DO NOT mix languages.`,
      maxOutputTokens: 8192,                        // P0.7
      abortSignal: AbortSignal.timeout(30_000), // P0.6
    });

    await incrementUsage(userId, 'learn');

    return NextResponse.json(object);
  } catch (error: unknown) {
    console.error('Panic Mode Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }); // P0.4
  }
}
