import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';

import { getAiRatelimit } from '@/lib/ratelimit';
import { checkUsage, incrementUsage, getUserAndPlan } from '@/lib/usage';
import { writeRequestSchema } from '@/lib/validators/write';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

const prompts: Record<string, (content: string, context?: string) => string> = {
  outline: (content) =>
    `Generate a detailed essay outline for: "${content}". Include thesis statement, 3-5 body sections with key points and supporting evidence ideas, and a conclusion. Format with clear headings.`,
  expand: (content) =>
    `Expand this paragraph into 2-3 well-developed paragraphs: "${content}". Maintain academic tone. Add supporting evidence and smooth transitions.`,
  cite: (content) =>
    `Add an appropriate academic citation (APA 7th edition) to support this claim: "${content}". Use a plausible, realistic source. Format the in-text citation and full reference.`,
  humanize: (content) =>
    `Rewrite the following text to sound more naturally human-written while keeping academic quality. Vary sentence structure, add natural transitions, and avoid AI-typical phrasing:\n\n"${content}"`,
  conclude: (content, context) =>
    `Write a strong conclusion for this essay. Topic: "${content}". Context of the essay: ${context || 'not provided'}. Summarize key points and end with broader implications.`,
};

export async function POST(req: Request) {
  try {
    // P0.3 — Input validation
    const json = await req.json();
    const parsed = writeRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }
    const { action, content, context } = parsed.data;

    const promptFn = prompts[action];
    if (!promptFn) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

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

    const usage = await checkUsage(userId, 'write', plan);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: 'Daily write limit reached. Upgrade to Pro for unlimited access.' },
        { status: 429 }
      );
    }

    const result = streamText({
      model: google('gemini-2.5-flash'),
      prompt: `${promptFn(content, context)}\n\nCRITICAL: You MUST respond EXCLUSIVELY in the same language as the text provided by the user. DO NOT mix languages.`,
      maxOutputTokens: 2048,                        // P0.7
      abortSignal: AbortSignal.timeout(30_000), // P0.6
      onFinish: async () => {
        await incrementUsage(userId, 'write');
      },
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    console.error('Write API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }); // P0.4
  }
}
