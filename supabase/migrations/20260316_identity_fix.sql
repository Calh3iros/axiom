-- ═══════════════════════════════════════
-- Phase 5.5 — Identity Fix: RLS + Backfill
-- ═══════════════════════════════════════

-- 1. Allow any authenticated user to read full_name + avatar_url from profiles
-- (needed for member lists, rankings, public profiles)
-- Current RLS: "Users read own profile" (auth.uid() = id) — too restrictive
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Authenticated read name and avatar'
  ) THEN
    CREATE POLICY "Authenticated read name and avatar"
      ON public.profiles FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 2. Backfill full_name for existing profiles that have it NULL
-- Priority: auth.users.raw_user_meta_data->>'full_name' → email before @ → 'User'
UPDATE public.profiles p
SET full_name = COALESCE(
  NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
  NULLIF(TRIM(u.raw_user_meta_data->>'name'), ''),
  SPLIT_PART(p.email, '@', 1),
  'User'
)
FROM auth.users u
WHERE p.id = u.id
  AND (p.full_name IS NULL OR TRIM(p.full_name) = '');

-- 3. Backfill avatar_url for profiles that have it NULL but auth has one
UPDATE public.profiles p
SET avatar_url = u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
WHERE p.id = u.id
  AND p.avatar_url IS NULL
  AND u.raw_user_meta_data->>'avatar_url' IS NOT NULL;

-- 4. Set NOT NULL with default on full_name to prevent future empties
ALTER TABLE public.profiles ALTER COLUMN full_name SET DEFAULT '';
