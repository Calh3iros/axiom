import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, convertToModelMessages } from "ai";
import { NextResponse } from "next/server";

import {
  buildSolveMblidPrompt,
  buildLearnMblidPrompt,
  buildSocraticPrompt,
  buildVerifyPrompt,
} from "@/lib/ai/prompts";
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
        const assessmentRegex =
          /\[ASSESSMENT:\s*(UNDERSTOOD|PROCEDURAL|NOT_UNDERSTOOD)\s*\]/i;
        const assessmentMatch = text.match(assessmentRegex);
        const assessment = assessmentMatch
          ? (assessmentMatch[1].toUpperCase() as
              | "UNDERSTOOD"
              | "PROCEDURAL"
              | "NOT_UNDERSTOOD")
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
                      'The fundamental concept name, 2-4 words max, noun form, not verb form. Use the most basic/canonical name. Examples: "linear equations" not "solving linear equations", "derivatives" not "finding derivatives", "french revolution" not "causes of the french revolution". Always lowercase.'
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

TOPIC NAMING RULE: Use the most fundamental, canonical concept name (2-4 words, lowercase, noun form). Strip action verbs like "solving", "calculating", "understanding", "finding". Example: a question about "Solve 2x+5=15" → topic: "linear equations", NOT "solving linear equations" or "algebraic equations".

User Message:
${lastMessage?.content || "Unknown"}

AI Response:
${text}
`,
              });

              const { supabaseAdmin } = await import("@/lib/supabase/admin");

              // --- STEP 1: Normalize subject/topic to prevent duplicates ---
              const normalizeStr = (s: string) => s?.toLowerCase().trim() || "";
              const normSubject =
                normalizeStr(analysisData.subject) || "general";
              const normTopic = normalizeStr(analysisData.topic) || "general";
              const understandingScore =
                analysisData.understanding_score ?? 0.5;

              // --- STEP 1b: Semantic topic matching against existing user topics ---
              const stopWords = new Set([
                // EN
                "of",
                "the",
                "a",
                "an",
                "in",
                "on",
                "for",
                "and",
                "to",
                "with",
                "by",
                "from",
                "is",
                "are",
                "was",
                "were",
                "be",
                "solving",
                "finding",
                "calculating",
                "understanding",
                "computing",
                "evaluating",
                "determining",
                "analyzing",
                // PT
                "de",
                "do",
                "da",
                "dos",
                "das",
                "no",
                "na",
                "nos",
                "nas",
                "em",
                "o",
                "os",
                "um",
                "uma",
                "e",
                "para",
                "com",
                "por",
                "resolvendo",
                "calculando",
                "encontrando",
                "entendendo",
                "determinando",
                "analisando",
                "avaliando",
                // ES
                "del",
                "el",
                "la",
                "los",
                "las",
                "en",
                "un",
                "una",
                "y",
                "con",
                "resolviendo",
                "entendiendo",
                "evaluando",
                "analizando",
                // FR
                "le",
                "les",
                "des",
                "du",
                "au",
                "aux",
                "et",
                "en",
                "dans",
                "sur",
                "avec",
                "résoudre",
                "calculer",
                "trouver",
                "comprendre",
                "déterminer",
                "analyser",
                "évaluer",
                // DE
                "der",
                "die",
                "das",
                "den",
                "dem",
                "ein",
                "eine",
                "und",
                "in",
                "mit",
                "von",
                "zu",
                "für",
                "lösen",
                "berechnen",
                "finden",
                "verstehen",
                "bestimmen",
                "analysieren",
                "bewerten",
              ]);

              const stemSimple = (s: string) =>
                s
                  .replace(
                    /(ação|ções|ation|tion|ing|ment|ive|ives|ity|ous|al|es|ed|s)$/g,
                    ""
                  )
                  .replace(/\s+/g, " ")
                  .trim();

              const findMatchingTopic = (
                newTopic: string,
                existingTopics: string[]
              ): string | null => {
                if (existingTopics.includes(newTopic)) return newTopic;

                // Stem match
                const newStem = stemSimple(newTopic);
                for (const existing of existingTopics) {
                  if (stemSimple(existing) === newStem) return existing;
                }

                // Word overlap >= 60% (after removing stopwords)
                const newFiltered = newTopic
                  .split(/\s+/)
                  .filter((w) => !stopWords.has(w) && w.length > 1);

                for (const existing of existingTopics) {
                  const existFiltered = existing
                    .split(/\s+/)
                    .filter((w) => !stopWords.has(w) && w.length > 1);

                  const smaller =
                    newFiltered.length <= existFiltered.length
                      ? newFiltered
                      : existFiltered;
                  const largerSet = new Set(
                    newFiltered.length <= existFiltered.length
                      ? existFiltered
                      : newFiltered
                  );

                  if (smaller.length === 0) continue;
                  const overlap = smaller.filter((w) =>
                    largerSet.has(w)
                  ).length;
                  if (overlap / smaller.length >= 0.6) return existing;
                }

                return null;
              };

              // Fetch existing topics for this user+subject

              const { data: existingTopicRows } = await (supabaseAdmin
                .from("knowledge_map")
                .select("topic")
                .eq("user_id", userId)
                .eq("subject", normSubject) as any);

              const existingTopics = (existingTopicRows || []).map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (r: any) => r.topic as string
              );
              const matchedTopic = findMatchingTopic(normTopic, existingTopics);
              const finalTopic = matchedTopic || normTopic;

              if (matchedTopic && matchedTopic !== normTopic) {
                console.warn(
                  `Topic normalized: "${normTopic}" → "${matchedTopic}"`
                );
              }

              // --- STEP 2: Determine outcome (challenge vs normal) ---
              const isChallenge =
                analysisData.is_student_answering_challenge &&
                analysisData.student_answer_correct !== null;

              let countsAsCorrect = false;
              let countsAsIncorrect = false;
              let isNeutral = false;
              let streakAction: "increment" | "freeze" | "reset" = "freeze";
              let successFlag = false; // for challenge_log

              if (isChallenge) {
                // Challenge path: binary correct/incorrect from generateObject
                const isCorrect = analysisData.student_answer_correct!;
                countsAsCorrect = assessment !== "NOT_UNDERSTOOD" && isCorrect;
                countsAsIncorrect = !countsAsCorrect;
                successFlag = isCorrect;

                // Streak: UNDERSTOOD+correct=increment, PROCEDURAL=freeze, NOT_UNDERSTOOD/wrong=reset
                if (assessment === "UNDERSTOOD" && isCorrect) {
                  streakAction = "increment";
                } else if (assessment === "NOT_UNDERSTOOD" || !isCorrect) {
                  streakAction = "reset";
                }
                // PROCEDURAL: streakAction stays "freeze"
              } else {
                // Normal path: use understanding_score thresholds
                if (understandingScore >= 0.7) {
                  countsAsCorrect = true;
                  successFlag = true;
                  // Only increment streak if assessment is UNDERSTOOD
                  streakAction =
                    assessment === "UNDERSTOOD" ? "increment" : "freeze";
                } else if (understandingScore < 0.4) {
                  countsAsIncorrect = true;
                  streakAction = "reset";
                } else {
                  // Neutral (0.4-0.69): no correct/incorrect change, streak frozen
                  isNeutral = true;
                  streakAction = "freeze";
                }
              }

              // --- STEP 3: Fetch or create KM entry ---

              const { data: existing } = await (supabaseAdmin
                .from("knowledge_map")
                .select(
                  "id, level, correct_count, incorrect_count, current_streak, mastery_score, interactions_count"
                )
                .eq("user_id", userId)
                .eq("subject", normSubject)
                .eq("topic", finalTopic)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .single() as any);

              if (existing) {
                // --- STEP 4: Update counts ---
                const newCorrect =
                  (existing.correct_count || 0) + (countsAsCorrect ? 1 : 0);
                const newIncorrect =
                  (existing.incorrect_count || 0) + (countsAsIncorrect ? 1 : 0);

                // --- STEP 5: Streak logic ---
                let newStreak = existing.current_streak || 0;
                if (streakAction === "increment") {
                  newStreak += 1;
                } else if (streakAction === "reset") {
                  newStreak = 0;
                }
                // "freeze": newStreak stays unchanged

                // --- STEP 6: Level up (3 consecutive correct → next level) ---
                let newLevel = existing.level || 1;
                let finalStreak = newStreak;
                if (finalStreak >= 3 && newLevel < 5) {
                  newLevel += 1;
                  finalStreak = 0; // Reset after level up
                }

                // --- STEP 7: Unified mastery formula ---
                const accuracy =
                  newCorrect / Math.max(1, newCorrect + newIncorrect);
                const newMastery = accuracy * 0.6 + (newLevel / 5) * 0.4;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabaseAdmin.from("knowledge_map") as any)
                  .update({
                    correct_count: newCorrect,
                    incorrect_count: newIncorrect,
                    current_streak: finalStreak,
                    level: newLevel,
                    mastery_score: newMastery,
                    interactions_count: (existing.interactions_count || 0) + 1,
                    last_interaction_at: new Date().toISOString(),
                  })
                  .eq("id", existing.id);

                const leveledUp = newLevel > (existing.level || 1);
                console.warn(
                  `MBLID ${isChallenge ? "Challenge" : "Normal"}: ${userId} — ${normSubject}/${finalTopic} — ` +
                    `streak:${finalStreak} lvl:${newLevel}${leveledUp ? " ⬆️ LEVEL UP" : ""} mastery:${newMastery.toFixed(2)}`
                );
              } else {
                // First interaction on this topic — create entry
                const initialCorrect = countsAsCorrect ? 1 : 0;
                const initialIncorrect = countsAsIncorrect ? 1 : 0;
                const initialStreak = streakAction === "increment" ? 1 : 0;
                const initialAccuracy =
                  initialCorrect /
                  Math.max(1, initialCorrect + initialIncorrect);
                const initialMastery = initialAccuracy * 0.6 + (1 / 5) * 0.4;

                const { error: kmErr } = await (
                  supabaseAdmin.from("knowledge_map") as any
                ).insert({
                  user_id: userId,
                  subject: normSubject,
                  topic: finalTopic,
                  mastery_score: isNeutral
                    ? understandingScore * 0.6 + 0.08
                    : initialMastery,
                  interactions_count: 1,
                  level: 1,
                  correct_count: initialCorrect,
                  incorrect_count: initialIncorrect,
                  current_streak: initialStreak,
                });
                if (kmErr) console.error("knowledge_map insert error:", kmErr);

                console.warn(
                  `MBLID New Entry: ${userId} — ${normSubject}/${finalTopic} — ` +
                    `correct:${initialCorrect} streak:${initialStreak}`
                );
              }

              // --- STEP 8: Log to challenge_log (for heatmap & stats) ---

              const { error: clErr } = await (
                supabaseAdmin.from("challenge_log") as any
              ).insert({
                user_id: userId,
                subject: normSubject,
                topic: finalTopic,
                success: successFlag,
              });
              if (clErr) console.error("challenge_log insert error:", clErr);

              // --- STEP 9: Upsert student_profiles ---

              const { data: sp } = await (
                supabaseAdmin.from("student_profiles") as any
              )
                .select("total_problems_solved, total_correct")
                .eq("id", userId)
                .single();

              if (sp) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabaseAdmin.from("student_profiles") as any)
                  .update({
                    total_problems_solved: (sp.total_problems_solved || 0) + 1,
                    total_correct:
                      (sp.total_correct || 0) + (successFlag ? 1 : 0),
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", userId);
              } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabaseAdmin.from("student_profiles") as any).insert({
                  id: userId,
                  total_problems_solved: 1,
                  total_correct: successFlag ? 1 : 0,
                });
              }

              // --- BADGE ENGINE: Check and unlock badges after data update ---
              try {
                const { checkAndUnlockBadges } = await import("@/lib/badges");
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
