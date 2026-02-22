import { streamText, convertToModelMessages } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { solveSystemPrompt } from '@/lib/ai/prompts/solve';
import { learnSystemPrompt } from '@/lib/ai/prompts/learn';
import { checkUsage, incrementUsage, getUserAndPlan } from '@/lib/usage';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

const systemPrompts: Record<string, string> = {
  solve: solveSystemPrompt,
  learn: learnSystemPrompt,
};

export async function POST(req: Request) {
  try {
    const { messages, type = 'solve', chatId: providedChatId } = await req.json();

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
    const modelMessages = await convertToModelMessages(messages);

    // Grab the latest user message
    const lastMessage = messages[messages.length - 1];

    // Setup DB client to save messages
    const supabase = await createClient();
    let chatId = providedChatId;

    // We only save to DB if the user is authenticated (not anon:ip)
    const isAuthenticUser = !userId.startsWith('anon:');

    if (isAuthenticUser) {
      if (!chatId) {
        // Create a new chat
        const title = lastMessage?.content?.substring(0, 50) || 'New Chat';
        const { data: chatData, error: chatError } = await (supabase.from('chats') as any)
          .insert({ user_id: userId, title })
          .select('id')
          .single();

        if (!chatError && chatData) {
          chatId = chatData.id;
        }
      }

      if (chatId && lastMessage) {
        // Save the user's incoming message
        await (supabase.from('messages') as any).insert({
          chat_id: chatId,
          role: 'user',
          content: lastMessage.content
        });
      }
    }

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: systemInstruction,
      messages: modelMessages,
      onFinish: async ({ text }) => {
        await incrementUsage(userId, usageType);

        // Save assistant response to DB
        if (isAuthenticUser && chatId && text) {
          await (supabase.from('messages') as any).insert({
            chat_id: chatId,
            role: 'assistant',
            content: text
          });
        }
      },
    });

    const headers = new Headers();
    if (chatId) {
      headers.set('x-chat-id', chatId);
    }

    return result.toUIMessageStreamResponse({ headers });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

