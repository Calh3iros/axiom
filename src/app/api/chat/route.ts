import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, convertToModelMessages } from "ai";
import { NextResponse } from "next/server";

import { buildSolveMblidPrompt, buildLearnMblidPrompt, buildSocraticPrompt, buildVerifyPrompt } from "@/lib/ai/prompts";
import { getAiRatelimit } from "@/lib/ratelimit";
import { createClient } from "@/lib/supabase/server";
import { checkUsage, incrementUsage, getUserAndPlan } from "@/lib/usage";
import { chatRequestSchema } from "@/lib/validators/chat";

const google = createGoogleGenerativeAI({
  apiKey:
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    "",
});

export async function POST(req: Request) {
  try {
    // P0.3 — Input validation
    const json = await req.json();
    const parsed = chatRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }
    const {
      messages,
      type,
      mode,
      chatId: providedChatId,
      locale: _locale,
    } = parsed.data;

    // Get authenticated user and their plan from Supabase
    const { userId, plan } = await getUserAndPlan(req);

    // P0.2 — Rate limiting (by IP for DDoS protection)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anonymous";
    const { success: rateLimitOk } = await getAiRatelimit(plan).limit(ip);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const usageType =
      type === "learn" ? ("learn" as const) : ("solve" as const);
    const usage = await checkUsage(userId, usageType, plan);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: `Daily limit reached. Upgrade to Pro for unlimited access.` },
        { status: 429 }
      );
    }

    // --- MBLID: Fetch student context for adaptive prompts ---
    const supabase = await createClient();
    const isAuthenticUser = !userId.startsWith("anon:");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let studentProfile: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let topicHistory: any = null;

    if (isAuthenticUser) {
      try {
        // Get student educational profile (from onboarding)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: sp } = await (supabase.from("student_profiles") as any)
          .select("school_year, learning_goal")
          .eq("id", userId)
          .single();
        studentProfile = sp;

        // Get most recent topic history for adaptive context
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: topics } = await (supabase.from("knowledge_map") as any)
          .select("topic, level, correct_count, incorrect_count")
          .eq("user_id", userId)
          .order("last_interaction_at", { ascending: false })
          .limit(3);
        topicHistory = topics?.[0] || null;
      } catch (err) {
        // Gracefully continue without MBLID context if queries fail
        console.warn("MBLID context fetch failed (non-fatal):", err);
      }
    }

    // Build adaptive MBLID prompt with student context
    const mblidCtx = { studentProfile, topicHistory };
    let systemInstruction: string;
    if (type === "learn") {
      systemInstruction = buildLearnMblidPrompt(mblidCtx);
    } else if (mode === "socratic") {
      systemInstruction = buildSocraticPrompt(mblidCtx);
    } else if (mode === "verify") {
      systemInstruction = buildVerifyPrompt(mblidCtx);
    } else {
      systemInstruction = buildSolveMblidPrompt(mblidCtx);
    }

    systemInstruction += `\n\nCRITICAL: You MUST respond EXCLUSIVELY in the same language that the user used in their last message or image text. If the user asks a question in Portuguese, answer in Portuguese. If they speak in Spanish, answer in Spanish. DO NOT default to English unless the user speaks in English.`;

    const modelMessages = await convertToModelMessages(messages);

    // Grab the latest user message
    const lastMessage = messages[messages.length - 1];

    // Setup DB for saving messages
    let chatId = providedChatId;

    if (isAuthenticUser) {
      if (!chatId) {
        // Create a new chat
        const title = lastMessage?.content?.substring(0, 50) || "New Chat";
        const { data: chatData, error: chatError } =
          await // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from("chats") as any)
            .insert({ user_id: userId, title })
            .select("id")
            .single();

        if (!chatError && chatData) {
          chatId = chatData.id;
        }
      }

      if (chatId && lastMessage) {
        // Save the user's incoming message
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("messages") as any).insert({
          chat_id: chatId,
          role: "user",
          content: lastMessage.content,
        });
      }
    }

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemInstruction,
      messages: modelMessages,
      maxOutputTokens: 4096, // P0.7
      abortSignal: AbortSignal.timeout(30_000), // P0.6
      onFinish: async ({ text }) => {
        await incrementUsage(userId, usageType);

        // --- Parse and strip [ASSESSMENT:xxx] tag ---
        const assessmentRegex = /\[ASSESSMENT:\s*(UNDERSTOOD|PROCEDURAL|NOT_UNDERSTOOD)\s*\]/i;
        const assessmentMatch = text.match(assessmentRegex);
        const assessment = assessmentMatch
          ? (assessmentMatch[1].toUpperCase() as "UNDERSTOOD" | "PROCEDURAL" | "NOT_UNDERSTOOD")
          : "PROCEDURAL"; // Default: benefit of the doubt but no streak
        const cleanText = text.replace(assessmentRegex, "").trimEnd();

        // Save assistant response to DB (stripped of assessment tag)
        if (isAuthenticUser && chatId && cleanText) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("messages") as any).insert({
            chat_id: chatId,
            role: "assistant",
            content: cleanText,
          });

          // --- BACKGROUND WORKER: MBLID KNOWLEDGE MAP + CHALLENGE EVALUATOR ---
          // We intentionally do NOT await this so the response closes quickly.
          (async () => {
            try {
              const { generateObject } = await import("ai");
              const { z } = await import("zod");

              const { object: analysisData } = await generateObject({
                model: google("gemini-2.5-flash"),
                schema: z.object({
                  subject: z
                    .string()
                    .describe(
                      'Broad subject category, e.g. "Mathematics", "Physics", "History"'
                    ),
                  topic: z
                    .string()
                    .describe(
                      'Specific topic, e.g. "Derivatives", "Kinematics", "World War II"'
                    ),
                  understanding_score: z
                    .number()
                    .min(0)
                    .max(1)
                    .describe(
                      "Estimated understanding (0.0 = lost, 1.0 = expert)"
                    ),
                  is_student_answering_challenge: z
                    .boolean()
                    .describe(
                      "Is the user message an answer/attempt at a practice problem that was previously given by the AI?"
                    ),
                  student_answer_correct: z
                    .boolean()
                    .nullable()
                    .describe(
                      "If answering a challenge, was the answer correct? null if not a challenge answer"
                    ),
                }),
                prompt: `Analyze this conversation exchange to extract the topic and evaluate if the student is answering a practice challenge.

User Message:
${lastMessage?.content || "Unknown"}

AI Response:
${text}
`,
              });

              const { supabaseAdmin } = await import("@/lib/supabase/admin");

              if (
                analysisData.is_student_answering_challenge &&
                analysisData.student_answer_correct !== null
              ) {
                // --- MBLID: Student answered a challenge ---
                const { data: existing } = await (supabaseAdmin
                  .from("knowledge_map")
                  .select(
                    "id, level, correct_count, incorrect_count, current_streak, mastery_score, interactions_count"
                  )
                  .eq("user_id", userId)
                  .eq("subject", analysisData.subject)
                  .eq("topic", analysisData.topic)
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  .single() as any);

                const isCorrect = analysisData.student_answer_correct;

                // --- Assessment-aware knowledge map update ---
                // UNDERSTOOD: correct++ streak++ (normal)
                // PROCEDURAL: correct++ streak frozen (no increment, no reset)
                // NOT_UNDERSTOOD: no correct increment, streak resets to 0
                const countsAsCorrect = assessment !== "NOT_UNDERSTOOD" && isCorrect;
                const countsAsIncorrect = !countsAsCorrect;

                if (existing) {
                  const newCorrect =
                    (existing.correct_count || 0) + (countsAsCorrect ? 1 : 0);
                  const newIncorrect =
                    (existing.incorrect_count || 0) + (countsAsIncorrect ? 1 : 0);

                  // Streak logic: UNDERSTOOD=increment, PROCEDURAL=freeze, NOT_UNDERSTOOD=reset
                  let newStreak = existing.current_streak || 0;
                  if (assessment === "UNDERSTOOD" && isCorrect) {
                    newStreak += 1;
                  } else if (assessment === "NOT_UNDERSTOOD" || !isCorrect) {
                    newStreak = 0;
                  }
                  // PROCEDURAL: streak stays unchanged

                  // Level up: 3 consecutive correct at current level
                  let newLevel = existing.level || 1;
                  let resetStreak = newStreak;
                  if (newStreak >= 3 && newLevel < 5) {
                    newLevel += 1;
                    resetStreak = 0; // Reset after level up
                  }

                  // Mastery: accuracy * 0.6 + (level/5) * 0.4
                  const accuracy =
                    newCorrect / Math.max(1, newCorrect + newIncorrect);
                  const newMastery = accuracy * 0.6 + (newLevel / 5) * 0.4;

                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await (supabaseAdmin.from("knowledge_map") as any)
                    .update({
                      correct_count: newCorrect,
                      incorrect_count: newIncorrect,
                      current_streak: resetStreak,
                      level: newLevel,
                      mastery_score: newMastery,
                      interactions_count:
                        (existing.interactions_count || 0) + 1,
                      last_interaction_at: new Date().toISOString(),
                    })
                    .eq("id", existing.id);
                } else {
                  // First interaction on this topic — create entry
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await (supabaseAdmin.from("knowledge_map") as any).insert({
                    user_id: userId,
                    subject: analysisData.subject,
                    topic: analysisData.topic,
                    mastery_score: countsAsCorrect ? 0.2 : 0.05,
                    interactions_count: 1,
                    level: 1,
                    correct_count: countsAsCorrect ? 1 : 0,
                    incorrect_count: countsAsCorrect ? 0 : 1,
                    current_streak: assessment === "UNDERSTOOD" && isCorrect ? 1 : 0,
                  });
                }

                // Log the challenge attempt
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { error: clErr } = await (supabaseAdmin.from("challenge_log") as any).insert({
                  user_id: userId,
                  subject: analysisData.subject,
                  topic: analysisData.topic,
                  success: isCorrect,
                });
                if (clErr) console.error("challenge_log insert error:", clErr);

                // Upsert student_profiles stats
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: sp } = await (supabaseAdmin.from("student_profiles") as any)
                  .select("total_problems_solved, total_correct")
                  .eq("id", userId)
                  .single();

                if (sp) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await (supabaseAdmin.from("student_profiles") as any)
                    .update({
                      total_problems_solved: (sp.total_problems_solved || 0) + 1,
                      total_correct: (sp.total_correct || 0) + (isCorrect ? 1 : 0),
                      updated_at: new Date().toISOString(),
                    })
                    .eq("id", userId);
                } else {
                  // Row doesn't exist — create it
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await (supabaseAdmin.from("student_profiles") as any).insert({
                    id: userId,
                    total_problems_solved: 1,
                    total_correct: isCorrect ? 1 : 0,
                  });
                }

                console.warn(
                  `MBLID Challenge: ${userId} — ${analysisData.subject}/${analysisData.topic} — ${isCorrect ? "✅ CORRECT" : "❌ INCORRECT"}`
                );
              } else {
                // --- Normal interaction: existing knowledge map upsert ---
                const { data: existingTopic } = await (supabaseAdmin
                  .from("knowledge_map")
                  .select("id, interactions_count, mastery_score")
                  .eq("user_id", userId)
                  .eq("subject", analysisData.subject)
                  .eq("topic", analysisData.topic)
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  .single() as any);

                if (existingTopic) {
                  const newCount = (existingTopic.interactions_count || 1) + 1;
                  const oldScore = existingTopic.mastery_score || 0;
                  const newScore =
                    (oldScore * (existingTopic.interactions_count || 1) +
                      analysisData.understanding_score) /
                    newCount;

                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await (supabaseAdmin.from("knowledge_map") as any)
                    .update({
                      interactions_count: newCount,
                      mastery_score: newScore,
                      last_interaction_at: new Date().toISOString(),
                    })
                    .eq("id", existingTopic.id);
                } else {
                  // First interaction on this topic — create KM entry
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const { error: kmErr } = await (supabaseAdmin.from("knowledge_map") as any).insert({
                    user_id: userId,
                    subject: analysisData.subject,
                    topic: analysisData.topic,
                    mastery_score: analysisData.understanding_score,
                    interactions_count: 1,
                    level: 1,
                    correct_count: 0,
                    incorrect_count: 0,
                    current_streak: 0,
                  });
                  if (kmErr) console.error("knowledge_map insert error:", kmErr);
                }

                // Log the interaction to challenge_log (for heatmap & stats)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { error: clErr2 } = await (supabaseAdmin.from("challenge_log") as any).insert({
                  user_id: userId,
                  subject: analysisData.subject,
                  topic: analysisData.topic,
                  success: true, // Non-challenge interactions count as engagement
                });
                if (clErr2) console.error("challenge_log insert error (normal):", clErr2);

                // Upsert student_profiles stats for non-challenge interactions
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: sp2 } = await (supabaseAdmin.from("student_profiles") as any)
                  .select("total_problems_solved, total_correct")
                  .eq("id", userId)
                  .single();

                if (sp2) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await (supabaseAdmin.from("student_profiles") as any)
                    .update({
                      total_problems_solved: (sp2.total_problems_solved || 0) + 1,
                      total_correct: (sp2.total_correct || 0) + 1,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("id", userId);
                } else {
                  // Row doesn't exist — create it
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await (supabaseAdmin.from("student_profiles") as any).insert({
                    id: userId,
                    total_problems_solved: 1,
                    total_correct: 1,
                  });
                }

                console.warn(
                  `Knowledge map updated for ${userId}: ${analysisData.subject}/${analysisData.topic} -> Mastery: ${analysisData.understanding_score}`
                );
              }

              // --- BADGE ENGINE: Check and unlock badges after data update ---
              try {
                const { checkAndUnlockBadges } = await import(
                  "@/lib/badges"
                );
                const newBadges = await checkAndUnlockBadges(userId);
                if (newBadges.length > 0) {
                  console.warn(
                    `🏆 Badges unlocked for ${userId}: ${newBadges.join(", ")}`
                  );
                }
              } catch (badgeErr) {
                console.error("Badge engine error (non-fatal):", badgeErr);
              }
            } catch (err) {
              console.error("MBLID Background Worker Error:", err);
            }
          })();
          // -------------------------------------------------
        }
      },
    });

    const headers = new Headers();
    if (chatId) {
      headers.set("x-chat-id", chatId);
    }

    return result.toUIMessageStreamResponse({ headers });
  } catch (error: unknown) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    ); // P0.4
  }
}
