import { streamText, convertToModelMessages } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextResponse } from 'next/server';
import { checkUsage, incrementUsage, getUserAndPlan } from '@/lib/usage';

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
    const { action, content, context } = await req.json();

    const promptFn = prompts[action];
    if (!promptFn) {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Check user plan and rate limits
    const { userId, isPro } = await getUserAndPlan(req);
    const usage = await checkUsage(userId, 'write', isPro);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: 'Daily write limit reached. Upgrade to Pro for unlimited access.' },
        { status: 429 }
      );
    }

    const result = streamText({
      model: google('gemini-2.5-flash'),
      prompt: promptFn(content, context),
      onFinish: async () => {
        await incrementUsage(userId, 'write');
      },
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Write API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
