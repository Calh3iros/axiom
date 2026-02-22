import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { PROMPTS } from '@/lib/ai/prompts';
import { humanizeRequestSchema } from '@/lib/validators/humanize';
import { checkUsage, incrementUsage, getUserAndPlan } from '@/lib/usage';

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
    const { userId, isPro } = await getUserAndPlan(req);
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const usage = await checkUsage(userId, 'humanize', isPro);
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
    });

    // Track usage by word count
    await incrementUsage(userId, 'humanize', wordCount);

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
