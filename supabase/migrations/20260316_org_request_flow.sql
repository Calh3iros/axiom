-- ═══════════════════════════════════════
-- Phase 6.5a — Org Request Flow
-- Status field + request metadata + super_admin
-- ═══════════════════════════════════════

-- 1. Add status to organizations (DEFAULT 'active' so existing orgs keep working)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
  ADD COLUMN IF NOT EXISTS requested_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS requested_by_name text,
  ADD COLUMN IF NOT EXISTS requested_by_email text,
  ADD COLUMN IF NOT EXISTS requested_by_role text,
  ADD COLUMN IF NOT EXISTS requested_by_phone text,
  ADD COLUMN IF NOT EXISTS institution_id text,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS request_message text;

-- 2. Add is_super_admin to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

-- 3. Set super_admin for the admin user
UPDATE public.profiles
SET is_super_admin = true
WHERE email = 'soren2222@gmail.com';

-- 4. Index on status for filtered queries
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);

-- 5. Update RLS: org members can view org ONLY if active (or super_admin)
-- Drop old policy and create new one
DROP POLICY IF EXISTS "Org members can view org" ON public.organizations;

CREATE POLICY "Org members can view org"
  ON public.organizations FOR SELECT
  USING (
    -- Super admin sees everything
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true
    )
    OR (
      -- Regular members see only active orgs they belong to
      status = 'active'
      AND EXISTS (
        SELECT 1 FROM public.org_memberships
        WHERE org_memberships.org_id = organizations.id
          AND org_memberships.user_id = auth.uid()
      )
    )
  );

-- 6. Allow public INSERT for pending org requests (no auth required)
-- Service role handles this, so we add a permissive policy
CREATE POLICY "Service role can insert pending orgs"
  ON public.organizations FOR INSERT
  WITH CHECK (true);
