import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

import { PROMPTS } from '@/lib/ai/prompts';
import { getAiRatelimit } from '@/lib/ratelimit';
import { checkUsage, incrementUsage, getUserAndPlan } from '@/lib/usage';
import { humanizeRequestSchema } from '@/lib/validators/humanize';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const result = humanizeRequestSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const { text, mode } = result.data;

    // Check user plan and rate limits
    const { userId, plan } = await getUserAndPlan(req);

    // P0.2 — Rate limiting (by IP for DDoS protection)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'anonymous';
    const { success: rateLimitOk } = await getAiRatelimit(plan).limit(ip);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const usage = await checkUsage(userId, 'humanize', plan);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: 'Daily word limit reached. Upgrade to Pro for unlimited access.' },
        { status: 429 }
      );
    }

    const response = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: `Text to humanize:\n${text}`,
      system: `${PROMPTS.HUMANIZE(mode)}\n\nCRITICAL: You MUST respond EXCLUSIVELY in the same language as the text provided to be humanized. DO NOT mix languages.`,
      maxOutputTokens: 4096,                        // P0.7
      abortSignal: AbortSignal.timeout(30_000), // P0.6
    });

    // Track usage by word count
    await incrementUsage(userId, 'humanize', wordCount);

    return NextResponse.json({
      text: response.text,
      usage: response.usage,
    });
  } catch (error: unknown) {
    console.error('Humanize API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
