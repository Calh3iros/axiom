-- ═══════════════════════════════════════
-- Phase F1 — Role & Org Type Expansion
-- ADDITIVE ONLY: expand CHECK constraints + RLS policies
-- Zero data changes. Existing rows unaffected.
-- ═══════════════════════════════════════

-- ─── 1. Expand org_memberships.role CHECK ────────────────────────────────
-- Old: student, teacher, admin, director, secretary
-- New: + coordinator, owner

ALTER TABLE public.org_memberships
  DROP CONSTRAINT IF EXISTS org_memberships_role_check;

ALTER TABLE public.org_memberships
  ADD CONSTRAINT org_memberships_role_check
  CHECK (role IN ('student', 'teacher', 'coordinator', 'admin', 'director', 'owner', 'secretary'));

-- ─── 2. Expand organizations.type CHECK ──────────────────────────────────
-- Old: school, network, state
-- New: + private_school, private_network, public_municipal, public_state

ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_type_check;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_type_check
  CHECK (type IN ('school', 'network', 'state', 'private_school', 'private_network', 'public_municipal', 'public_state'));

-- ─── 3. Expand invite_codes.type CHECK ───────────────────────────────────
-- Old: secretary, gre, director, teacher
-- New: + owner

ALTER TABLE public.invite_codes
  DROP CONSTRAINT IF EXISTS invite_codes_type_check;

ALTER TABLE public.invite_codes
  ADD CONSTRAINT invite_codes_type_check
  CHECK (type IN ('secretary', 'gre', 'director', 'teacher', 'owner'));

-- ─── 4. Expand RLS policies on org_memberships ──────────────────────────

-- 4a. "Admins can add members" — add owner, coordinator
DROP POLICY IF EXISTS "Admins can add members" ON public.org_memberships;
CREATE POLICY "Admins can add members"
  ON public.org_memberships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = org_memberships.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'director', 'owner', 'secretary', 'coordinator')
    )
    OR auth.uid() = user_id  -- user can join themselves (via invite)
  );

-- 4b. "Admins can remove members" — add owner
DROP POLICY IF EXISTS "Admins can remove members" ON public.org_memberships;
CREATE POLICY "Admins can remove members"
  ON public.org_memberships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = org_memberships.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'director', 'owner')
    )
  );

-- ─── 5. Expand RLS policies on classes ──────────────────────────────────

-- 5a. "Class visible to members" — add owner, coordinator
DROP POLICY IF EXISTS "Class visible to members" ON public.classes;
CREATE POLICY "Class visible to members"
  ON public.classes FOR SELECT
  USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.class_memberships cm
      WHERE cm.class_id = classes.id AND cm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = classes.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'director', 'owner', 'secretary', 'coordinator')
    )
  );

-- 5b. "Teachers can create classes" — add coordinator, owner
DROP POLICY IF EXISTS "Teachers can create classes" ON public.classes;
CREATE POLICY "Teachers can create classes"
  ON public.classes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = classes.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('teacher', 'admin', 'director', 'owner', 'coordinator')
    )
  );

-- ─── 6. Expand RLS on class_memberships ─────────────────────────────────

-- "Class members visible to teacher and admins" — add owner, coordinator
DROP POLICY IF EXISTS "Class members visible to teacher and admins" ON public.class_memberships;
CREATE POLICY "Class members visible to teacher and admins"
  ON public.class_memberships FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_memberships.class_id AND c.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.org_memberships om ON om.org_id = c.org_id
      WHERE c.id = class_memberships.class_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'director', 'owner', 'secretary', 'coordinator')
    )
  );

-- ─── 7. Expand RLS on invite_codes ──────────────────────────────────────

-- "Org managers manage their codes" — add owner
DROP POLICY IF EXISTS "Org managers manage their codes" ON public.invite_codes;
CREATE POLICY "Org managers manage their codes"
  ON public.invite_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships
      WHERE org_memberships.user_id = auth.uid()
      AND org_memberships.org_id = invite_codes.org_id
      AND org_memberships.role IN ('director', 'secretary', 'admin', 'owner')
    )
  );
