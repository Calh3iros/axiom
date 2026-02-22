import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextResponse } from 'next/server';
import { z } from 'zod';

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
    const { subject, chapter } = await req.json();

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: panicSchema,
      prompt: `Subject: ${subject}${chapter ? `, Chapter/Topic: ${chapter}` : ''}.
Generate a complete exam preparation package. Make it thorough but concise.
Focus on the most important concepts and likely exam questions.
Write in the same language as the subject name.`,
    });

    return NextResponse.json(object);
  } catch (error: any) {
    console.error('Panic Mode Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate study package' }, { status: 500 });
  }
}
