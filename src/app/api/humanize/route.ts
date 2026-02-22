import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { PROMPTS } from '@/lib/ai/prompts';
import { humanizeRequestSchema } from '@/lib/validators/humanize';
// TODO: integrate Supabase rate limit & auth checks

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

    // TODO: rate limits & anonymous token consumption
    // 1. IP rate limiting / check usage limits for anonymous vs pro users

    const response = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: `Text to humanize:\n${text}`,
      system: PROMPTS.HUMANIZE(mode),
    });

    // TODO: Insert entry into queries DB Table for tracking usage

    return NextResponse.json({
      text: response.text,
      usage: response.usage,
    });
  } catch (error: any) {
    console.error('Humanize API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
