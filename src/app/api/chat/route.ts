import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToModelMessages } from 'ai';
import { NextResponse } from 'next/server';

import { learnSystemPrompt } from '@/lib/ai/prompts/learn';
import { solveSystemPrompt } from '@/lib/ai/prompts/solve';
import { createClient } from '@/lib/supabase/server';
import { checkUsage, incrementUsage, getUserAndPlan } from '@/lib/usage';


const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

const systemPrompts: Record<string, string> = {
  solve: solveSystemPrompt,
  learn: learnSystemPrompt,
};

export async function POST(req: Request) {
  try {
    const { messages, type = 'solve', chatId: providedChatId, locale: _locale = 'en' } = await req.json();

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

    let systemInstruction = systemPrompts[type] || systemPrompts.solve;
    systemInstruction += `\n\nCRITICAL: You MUST respond EXCLUSIVELY in the same language that the user used in their last message or image text. If the user asks a question in Portuguese, answer in Portuguese. If they speak in Spanish, answer in Spanish. DO NOT default to English unless the user speaks in English.`;

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('messages') as any).insert({
            chat_id: chatId,
            role: 'assistant',
            content: text
          });

          // --- BACKGROUND WORKER: KNOWLEDGE MAP EXTRACTOR ---
          // We intentionally do NOT await this so the response closes quickly.
          (async () => {
            try {
              const { generateObject } = await import('ai');
              const { z } = await import('zod');

              const { object: topicData } = await generateObject({
                model: google('gemini-2.5-flash'),
                schema: z.object({
                  subject: z.string().describe('Broad subject category, e.g. "Mathematics", "Physics", "History"'),
                  topic: z.string().describe('Specific topic being asked about, e.g. "Derivatives", "Kinematics", "World War II"'),
                  understanding_score: z.number().min(0).max(1).describe('Estimated understanding of the user based on the question context. 0.0 = completely lost, 1.0 = highly knowledgeable.')
                }),
                prompt: `Analyze the user's question and the provided answer to extract the topic and estimate the user's initial understanding level.

User Question:
${lastMessage?.content || 'Unknown'}

AI Answer:
${text}
`
              });

              // Upsert logic for knowledge_map
              const { supabaseAdmin } = await import('@/lib/supabase/admin');
              const { data: existingTopic } = await (supabaseAdmin
                .from('knowledge_map')
                .select('id, interactions_count, mastery_score')
                .eq('user_id', userId)
                .eq('subject', topicData.subject)
                .eq('topic', topicData.topic)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .single() as any);

              if (existingTopic) {
                // Gentle moving average: new_score = (old_score * count + new_understanding) / (count + 1)
                const newCount = (existingTopic.interactions_count || 1) + 1;
                const oldScore = existingTopic.mastery_score || 0;
                const newScore = ((oldScore * (existingTopic.interactions_count || 1)) + topicData.understanding_score) / newCount;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabaseAdmin.from('knowledge_map') as any).update({
                  interactions_count: newCount,
                  mastery_score: newScore,
                  last_interaction_at: new Date().toISOString()
                }).eq('id', existingTopic.id);
              } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabaseAdmin.from('knowledge_map') as any).insert({
                  user_id: userId,
                  subject: topicData.subject,
                  topic: topicData.topic,
                  mastery_score: topicData.understanding_score,
                  interactions_count: 1
                });
              }

              console.log(`Knowledge map updated for ${userId}: ${topicData.subject}/${topicData.topic} -> Mastery: ${topicData.understanding_score}`);
            } catch (err) {
              console.error('Background Knowledge Map Extractor Failed:', err);
            }
          })();
          // -------------------------------------------------
        }

      },
    });

    const headers = new Headers();
    if (chatId) {
      headers.set('x-chat-id', chatId);
    }

    return result.toUIMessageStreamResponse({ headers });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

