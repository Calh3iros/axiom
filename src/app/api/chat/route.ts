import { streamText, convertToModelMessages } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { solveSystemPrompt } from '@/lib/ai/prompts/solve';
import { learnSystemPrompt } from '@/lib/ai/prompts/learn';
import { checkUsage, incrementUsage, getUserAndPlan } from '@/lib/usage';
import { NextResponse } from 'next/server';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

const systemPrompts: Record<string, string> = {
  solve: solveSystemPrompt,
  learn: learnSystemPrompt,
};

export async function POST(req: Request) {
  try {
    const { messages, type = 'solve' } = await req.json();

    // Get authenticated user and their plan from Supabase
    const { userId, isPro } = await getUserAndPlan(req);
    const usageType = type === 'learn' ? 'learn' as const : 'solve' as const;
    const usage = await checkUsage(userId, usageType, isPro);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: `Daily limit reached. Upgrade to Pro for unlimited access.` },
        { status: 429 }
      );
    }

    const systemInstruction = systemPrompts[type] || systemPrompts.solve;

    // Convert UIMessage[] from DefaultChatTransport to ModelMessage[] for streamText
    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: systemInstruction,
      messages: modelMessages,
      onFinish: async () => {
        await incrementUsage(userId, usageType);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

