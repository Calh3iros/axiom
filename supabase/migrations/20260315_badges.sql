-- ═══════════════════════════════════════
-- MBLID Phase 2 — Badge System Migration
-- ═══════════════════════════════════════

-- 1. Badge catalog (static definitions)
CREATE TABLE IF NOT EXISTS public.badges_catalog (
  id text PRIMARY KEY,
  name_key text NOT NULL,
  description_key text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL CHECK (category IN ('mastery','consistency','volume','milestone')),
  criteria_type text NOT NULL,
  criteria_value integer NOT NULL DEFAULT 1,
  sort_order integer DEFAULT 0
);

ALTER TABLE public.badges_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read badges catalog"
  ON public.badges_catalog FOR SELECT USING (true);

-- 2. User badges (unlocked per user)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id text REFERENCES public.badges_catalog(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own badges"
  ON public.user_badges FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role manage user badges"
  ON public.user_badges USING (true);

CREATE INDEX IF NOT EXISTS idx_user_badges_user
  ON public.user_badges(user_id);

-- 3. Seed 12 badges
INSERT INTO public.badges_catalog (id, name_key, description_key, icon, category, criteria_type, criteria_value, sort_order)
VALUES
  ('first_solve',       'Badges.firstSolve.name',       'Badges.firstSolve.desc',       '🎯', 'milestone',   'solves_total',    1,   1),
  ('10_solves',         'Badges.solves10.name',         'Badges.solves10.desc',         '📚', 'volume',      'solves_total',    10,  2),
  ('50_solves',         'Badges.solves50.name',         'Badges.solves50.desc',         '🏅', 'volume',      'solves_total',    50,  3),
  ('100_solves',        'Badges.solves100.name',        'Badges.solves100.desc',        '🏆', 'volume',      'solves_total',    100, 4),
  ('first_correct',     'Badges.firstCorrect.name',     'Badges.firstCorrect.desc',     '✅', 'milestone',   'correct_total',   1,   5),
  ('10_streak_correct', 'Badges.streak10Correct.name',  'Badges.streak10Correct.desc',  '🔥', 'consistency', 'correct_streak',  10,  6),
  ('3_day_streak',      'Badges.streak3Day.name',       'Badges.streak3Day.desc',       '⚡', 'consistency', 'streak_days',     3,   7),
  ('7_day_streak',      'Badges.streak7Day.name',       'Badges.streak7Day.desc',       '💪', 'consistency', 'streak_days',     7,   8),
  ('30_day_streak',     'Badges.streak30Day.name',      'Badges.streak30Day.desc',      '👑', 'consistency', 'streak_days',     30,  9),
  ('first_mastery',     'Badges.firstMastery.name',     'Badges.firstMastery.desc',     '⭐', 'mastery',     'topic_level_5',   1,   10),
  ('5_topics_mastered', 'Badges.mastery5Topics.name',   'Badges.mastery5Topics.desc',   '🌟', 'mastery',     'topic_level_5',   5,   11),
  ('multi_subject',     'Badges.multiSubject.name',     'Badges.multiSubject.desc',     '🧠', 'mastery',     'subjects_count',  3,   12)
ON CONFLICT (id) DO NOTHING;
