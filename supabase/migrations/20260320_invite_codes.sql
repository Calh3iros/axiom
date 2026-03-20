-- ═══════════════════════════════════════
-- Phase 9 — Invite Codes System
-- Table: invite_codes
-- Columns: subjects on org_memberships, shift/grade on classes
-- ═══════════════════════════════════════

-- 1. Invite codes table
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('secretary', 'gre', 'director', 'teacher')),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_org ON public.invite_codes(org_id);

-- 2. RLS
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all invite codes" ON public.invite_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true)
  );

CREATE POLICY "Org managers manage their codes" ON public.invite_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships
      WHERE org_memberships.user_id = auth.uid()
      AND org_memberships.org_id = invite_codes.org_id
      AND org_memberships.role IN ('director', 'secretary', 'admin')
    )
  );

-- 3. Add subjects to org_memberships
ALTER TABLE public.org_memberships
  ADD COLUMN IF NOT EXISTS subjects TEXT[] DEFAULT '{}';

-- 4. Add shift and grade to classes
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS shift TEXT,
  ADD COLUMN IF NOT EXISTS grade TEXT;
