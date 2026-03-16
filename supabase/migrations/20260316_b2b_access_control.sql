-- ═══════════════════════════════════════
-- Phase 8B — B2B Access Control Fields
-- max_students, access_expires_at, contract_notes
-- ═══════════════════════════════════════

-- 1. Add access control columns to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS max_students integer,
  ADD COLUMN IF NOT EXISTS access_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS contract_notes text;

-- Note: All columns are nullable by default.
-- null max_students = unlimited students
-- null access_expires_at = no expiration
-- null contract_notes = no notes
