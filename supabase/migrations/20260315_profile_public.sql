-- ═══════════════════════════════════════
-- MBLID Phase 3 — Profile + Streak Migration
-- ═══════════════════════════════════════

-- 1. Public profile toggle
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_profile_public boolean DEFAULT false;

-- 2. Streak freeze (1/week for paid plans)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_freeze_available integer DEFAULT 0;

-- 3. Track last interaction date for streak calculation
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_last_interaction_date date;

-- 4. Drop the existing restrictive SELECT policy, replace with public-aware one
-- Note: run individually if policy name differs
DO $$
BEGIN
  -- Try to create a permissive policy for public profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Public profiles readable'
  ) THEN
    CREATE POLICY "Public profiles readable"
      ON public.profiles FOR SELECT
      USING (is_profile_public = true OR auth.uid() = id);
  END IF;
END $$;
