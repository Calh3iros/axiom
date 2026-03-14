-- ═══════════════════════════════════════
-- MBLID Core — Phase 1 Migration
-- ═══════════════════════════════════════

-- 1. Evolve knowledge_map with MBLID tracking columns
ALTER TABLE public.knowledge_map
  ADD COLUMN IF NOT EXISTS level integer DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS correct_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS incorrect_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0;

COMMENT ON COLUMN public.knowledge_map.level IS 'Mastery level: 1=beginner, 2=basic, 3=intermediate, 4=advanced, 5=master';
COMMENT ON COLUMN public.knowledge_map.correct_count IS 'Total correct answers on this topic';
COMMENT ON COLUMN public.knowledge_map.incorrect_count IS 'Total incorrect answers on this topic';
COMMENT ON COLUMN public.knowledge_map.current_streak IS 'Consecutive correct answers at current level (3 to level up)';

-- 2. Student profiles (educational data from onboarding)
CREATE TABLE IF NOT EXISTS public.student_profiles (
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own student profile') THEN
    CREATE POLICY "Users read own student profile"
      ON public.student_profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own student profile') THEN
    CREATE POLICY "Users update own student profile"
      ON public.student_profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role student profiles') THEN
    CREATE POLICY "Service role student profiles"
      ON public.student_profiles USING (true);
  END IF;
END $$;

-- 3. Challenge log (records every MBLID challenge attempt)
CREATE TABLE IF NOT EXISTS public.challenge_log (
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own challenges') THEN
    CREATE POLICY "Users read own challenges"
      ON public.challenge_log FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role challenge log') THEN
    CREATE POLICY "Service role challenge log"
      ON public.challenge_log USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_challenge_log_user
  ON public.challenge_log(user_id, created_at DESC);
