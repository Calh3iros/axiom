# SPEC: MBLID Core — Mastery-Based Learning com IA Dinâmica

> Fase 1 | SG > TESTE > RETENÇÃO TOTAL
> Status: PENDENTE APROVAÇÃO

---

## Objetivo

Transformar os módulos Solve e Learn do Axiom em **Mblidzers** — IAs que **ensinam** através de um loop adaptativo de resolução, desafio, correção e progressão de nível.

**O que muda:** os prompts e o backend. A IA passa a resolver E gerar desafio na mesma resposta. Quando o aluno responde, a IA avalia, corrige, e decide se sobe de nível ou repete.

**O que NÃO muda:** UI (botões, layout, follow-up actions), Write, Humanize, Panic, pricing, tiers, Stripe, auth, i18n.

---

## Estado Atual → Ponto de Chegada

| Componente       | Hoje                                                                          | Depois                                                         |
| ---------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Prompt Solve     | "Resolve step-by-step"                                                        | "Resolve + desafia + corrige + sobe nível"                     |
| Prompt Learn     | "Ensina com hints"                                                            | "Ensina + desafia + corrige + sobe nível + usa perfil"         |
| `chat/route.ts`  | Background worker extrai subject/topic/mastery                                | + busca perfil antes da chamada + avalia respostas de desafios |
| `knowledge_map`  | subject, topic, mastery_score, interactions_count                             | + level, correct_count, incorrect_count, current_streak        |
| Onboarding       | 4 slides genéricos                                                            | + slide 5 educacional (ano, objetivo, matérias)                |
| `/map` page      | Barras de % estimadas                                                         | Barras de % reais + indicador de level                         |
| Botões follow-up | "Explain simpler", "Another method", "Practice questions", "Theory behind it" | **INTOCADOS**                                                  |
| `chat.tsx` UI    | Layout atual                                                                  | **INTOCADO**                                                   |

---

## Arquitetura do Loop MBLID

```
Estudante faz pergunta no chat
       ↓
Backend busca perfil (student_profiles + knowledge_map)
       ↓
Prompt adaptativo injetado: resolve COM desafio no final
       ↓
Resposta da IA: "Solução step-by-step. 🎯 Agora tente esta: [problema similar]"
       ↓
Estudante responde no chat (mensagem normal, sem UI especial)
       ↓
Backend detecta que é resposta a um desafio (via background worker)
       ↓
IA avalia e responde:
   ✅ Acertou → celebra + gera problema de nível mais alto
   ❌ Errou → explica erro + gera outro do mesmo nível
       ↓
Background worker registra: correct/incorrect, streak, level up
       ↓
Loop continua naturalmente no chat
```

> O MBLID vive **na interação IA ↔ usuário**, não na UI. A conversa de chat é o veículo. Nenhum componente React muda exceto onboarding e /map.

---

## Alterações no Banco de Dados

### 1. Evoluir tabela `knowledge_map` (existente)

```sql
ALTER TABLE public.knowledge_map
  ADD COLUMN IF NOT EXISTS level integer DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS correct_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS incorrect_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0;
```

### 2. Criar tabela `student_profiles`

```sql
CREATE TABLE public.student_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_year text,
  subjects_of_interest text[] DEFAULT '{}',
  learning_goal text,
  preferred_difficulty text DEFAULT 'adaptive'
    CHECK (preferred_difficulty IN ('easy','medium','hard','adaptive')),
  total_problems_solved integer DEFAULT 0,
  total_correct integer DEFAULT 0,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own" ON public.student_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own" ON public.student_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role full" ON public.student_profiles USING (true);
```

### 3. Criar tabela `challenge_log`

```sql
CREATE TABLE public.challenge_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id text,
  subject text NOT NULL,
  topic text NOT NULL,
  level integer NOT NULL CHECK (level BETWEEN 1 AND 5),
  challenge_text text,
  student_answer text,
  is_correct boolean,
  feedback text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.challenge_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own" ON public.challenge_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full" ON public.challenge_log USING (true);
CREATE INDEX idx_challenge_log_user ON public.challenge_log(user_id, created_at DESC);
```

---

## Prompts Adaptativos

### `src/lib/ai/prompts/solve.ts` — de constante para função

```typescript
export function buildSolveMblidPrompt(context: {
  studentProfile?: { school_year?: string; learning_goal?: string };
  topicHistory?: {
    topic: string;
    level: number;
    correct_count: number;
    incorrect_count: number;
  };
}): string {
  const base = `You are Axiom, an AI homework solver and adaptive tutor.

When given a question (text or image):
1. Identify the subject and topic
2. Solve step-by-step with clear numbered steps
3. Show your work (formulas, calculations)
4. Give the FINAL ANSWER clearly marked with ✅
5. Keep tone casual, friendly, encouraging — like a smart friend on Discord.

Format rules:
- Use **bold** for key terms
- Use \`code blocks\` for math expressions
- Number each step: **Step 1:**, **Step 2:**, etc.
- Final answer on its own line: ✅ **Answer:** ...

MBLID PROTOCOL — CRITICAL:
After solving the problem, ALWAYS generate ONE practice problem of SIMILAR difficulty.
Format:
---
🎯 **Your turn!** Try this similar problem:
[problem here]
Send me your answer and I'll check it! 💪
---

When the student sends an answer to a practice problem:
- CORRECT: Celebrate briefly, then generate a SLIGHTLY HARDER problem
- INCORRECT: Explain the mistake, show correct approach, generate ANOTHER problem at SAME difficulty
- Always be encouraging — mistakes are learning

You speak the same language as the question.`;

  let ctx = "";
  if (context.studentProfile?.school_year) {
    ctx += `\n\nSTUDENT: ${context.studentProfile.school_year}`;
    if (context.studentProfile.learning_goal)
      ctx += `, goal: ${context.studentProfile.learning_goal}`;
  }
  if (context.topicHistory) {
    const h = context.topicHistory;
    ctx += `\n\nTOPIC "${h.topic}": Level ${h.level}/5, ${h.correct_count} correct, ${h.incorrect_count} incorrect.`;
    ctx +=
      h.incorrect_count > h.correct_count
        ? "\nStudent struggles here — simpler language, more hints."
        : "\nStudent progressing well — challenge appropriately.";
  }
  return base + ctx;
}

// Keep backward compat — export static for any code that imports it
export const solveSystemPrompt = buildSolveMblidPrompt({});
```

### `src/lib/ai/prompts/learn.ts` — mesma lógica

```typescript
export function buildLearnMblidPrompt(context: {
  studentProfile?: { school_year?: string; learning_goal?: string };
  topicHistory?: {
    topic: string;
    level: number;
    correct_count: number;
    incorrect_count: number;
  };
}): string {
  const base = `You are Axiom Learn, an AI tutor and study companion.
Your role is to TEACH, not just answer.

When a student asks anything:
1. Explain simply — big picture first, details after
2. Use analogies and real-world examples
3. Break complex topics into small parts
4. After explaining, generate ONE practice problem to test understanding

MBLID PROTOCOL — CRITICAL:
After explaining, ALWAYS add:
---
🎯 **Let's test your understanding!** Try this:
[problem here]
Send me your answer! 🧠
---

When the student answers:
- CORRECT: "Nice! 🎉" Then teach next concept OR harder problem
- INCORRECT: "Almost!" Re-explain differently, give another problem at same level
- Never give the answer without the student trying first

Tone: Friendly, encouraging, like texting a smart friend at midnight before an exam.
You speak the same language as the student.`;

  let ctx = "";
  if (context.studentProfile?.school_year) {
    ctx += `\n\nSTUDENT: ${context.studentProfile.school_year}`;
    if (context.studentProfile.learning_goal)
      ctx += `, goal: ${context.studentProfile.learning_goal}`;
  }
  if (context.topicHistory) {
    const h = context.topicHistory;
    ctx += `\n\nTOPIC "${h.topic}": Level ${h.level}/5, ${h.correct_count}✓ ${h.incorrect_count}✗`;
  }
  return base + ctx;
}

export const learnSystemPrompt = buildLearnMblidPrompt({});
```

---

## Alterações no Backend

### `src/app/api/chat/route.ts`

Duas modificações:

**1. Antes de chamar o modelo — buscar contexto MBLID:**

```typescript
// --- MBLID: Fetch student context ---
let studentProfile = null;
let topicHistory = null;

if (isAuthenticUser) {
  const { data: sp } = await supabase
    .from("student_profiles")
    .select("school_year, learning_goal")
    .eq("id", userId)
    .single();
  studentProfile = sp;

  const { data: topics } = await supabase
    .from("knowledge_map")
    .select("topic, level, correct_count, incorrect_count")
    .eq("user_id", userId)
    .order("last_interaction_at", { ascending: false })
    .limit(3);
  topicHistory = topics?.[0] || null;
}

// Build adaptive prompt instead of static
const systemInstruction =
  (type === "learn"
    ? buildLearnMblidPrompt({ studentProfile, topicHistory })
    : buildSolveMblidPrompt({ studentProfile, topicHistory })) +
  `\n\nCRITICAL: Respond in the same language as the user.`;
```

**2. Evoluir o background worker — avaliar respostas de desafios:**

O worker existente já extrai subject/topic/understanding_score. Adicionamos campos ao schema de `generateObject`:

```typescript
// New fields in the extraction schema
is_student_answering_challenge: z.boolean()
  .describe('Is the user message an answer to a practice problem?'),
student_answer_correct: z.boolean().nullable()
  .describe('If answering a challenge, was it correct? null if not a challenge answer'),
```

Após extração, se `is_student_answering_challenge === true`:

- Incrementa `correct_count` ou `incorrect_count` no `knowledge_map`
- Reseta ou incrementa `current_streak`
- Se `current_streak >= 3` → `level += 1`, reseta streak
- Recalcula `mastery_score`
- Insere registro em `challenge_log`
- Incrementa contadores em `student_profiles`

Se `is_student_answering_challenge === false`:

- Mantém lógica existente de upsert (não muda)

---

## Alterações no Frontend

### `src/components/shared/onboarding-modal.tsx`

Adicionar **slide 5** ao final do onboarding (slides 1-4 intocados):

- Campo: ano escolar (select)
- Campo: objetivo de aprendizado (select)
- Campo: matérias de interesse (multi-select ou checkboxes)
- Ao completar → salvar em `student_profiles` via Supabase

### `src/app/[locale]/(app)/map/page.tsx`

Evolução mínima:

- Mostrar **level** (1-5) ao lado de cada tópico (estrelas ou número)
- Mostrar **correct/incorrect** count em texto pequeno
- As barras de % continuam iguais — mas agora alimentadas por `mastery_score` real

### Nenhuma mudança em:

- `src/components/solve/chat.tsx` — **INTOCADO** (botões, layout, tudo igual)
- `src/components/write/editor.tsx`
- `src/components/humanize/`
- `src/components/learn/`

---

## Regras de Progressão

| Regra                           | Valor                              |
| ------------------------------- | ---------------------------------- |
| Acertos consecutivos para subir | 3                                  |
| Erro reseta streak para         | 0                                  |
| Níveis                          | 1 → 5                              |
| Mastery score                   | `accuracy * 0.6 + (level/5) * 0.4` |
| Barra de % no /map              | `mastery_score * 100`              |

---

## Arquivos Afetados

| Arquivo                                      | Tipo   | O que muda                                                           |
| -------------------------------------------- | ------ | -------------------------------------------------------------------- |
| `src/lib/ai/prompts/solve.ts`                | MODIFY | + `buildSolveMblidPrompt()`, mantém export `solveSystemPrompt`       |
| `src/lib/ai/prompts/learn.ts`                | MODIFY | + `buildLearnMblidPrompt()`, mantém export `learnSystemPrompt`       |
| `src/app/api/chat/route.ts`                  | MODIFY | Busca perfil + prompt dinâmico + worker evoluído                     |
| `src/components/shared/onboarding-modal.tsx` | MODIFY | + slide 5 educacional                                                |
| `src/app/[locale]/(app)/map/page.tsx`        | MODIFY | + level + contadores                                                 |
| `supabase/migrations/XXXX_mblid_core.sql`    | NEW    | ALTER knowledge_map + CREATE student_profiles + CREATE challenge_log |

### Intocados

- `src/components/solve/chat.tsx` ← **NÃO TOCA**
- `src/app/api/write/route.ts`
- `src/app/api/humanize/route.ts`
- `src/app/api/learn/panic/route.ts`
- Stripe, auth, i18n, middleware, todos os botões follow-up

---

## Verificação (SG > TESTE)

### Testes Automatizados

```bash
# 1. Testes existentes devem continuar passando
npm run test
# Esperado: 22/22 ✅

# 2. Build sem erros
npm run build
# Esperado: 0 erros
```

Novos testes a criar em `src/lib/ai/prompts/solve.test.ts`:

- `buildSolveMblidPrompt({})` retorna prompt base com MBLID protocol
- `buildSolveMblidPrompt({ studentProfile, topicHistory })` inclui contexto
- `buildLearnMblidPrompt({})` retorna prompt base
- Backward compat: `solveSystemPrompt` exportado como string

### Testes Manuais no Browser

1. Abrir `/solve` logado → enviar questão de matemática → **verificar que resposta inclui "🎯 Your turn!"**
2. Responder a questão gerada corretamente → **verificar celebração + problema mais difícil**
3. Responder errado → **verificar correção + problema do mesmo nível**
4. Ir para `/map` → **verificar que tópico mostra level e contadores corretos**
5. Testar `/write`, `/humanize`, `/learn` (panic) → **confirmar que funcionam normalmente**
6. Criar conta nova → **verificar slide 5 do onboarding aparece**

---

## Retenção (SG > RETER)

1. Documentar no `CLAUDE.md`
2. Commit: `feat(mblid): implement mastery-based learning core — Phase 1`
3. Push → Vercel deploy
4. Verificar em produção
