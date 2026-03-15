-- ═══════════════════════════════════════
-- MBLID Phase 5A — Institutional Layer
-- 4 tables: organizations, org_memberships, classes, class_memberships
-- ═══════════════════════════════════════

-- 1. Organizations (school / network / state with hierarchy)
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('school', 'network', 'state')),
  parent_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Members can see their own org
CREATE POLICY "Org members can view org"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships
      WHERE org_memberships.org_id = organizations.id
        AND org_memberships.user_id = auth.uid()
    )
  );

-- Any authenticated user can create an org
CREATE POLICY "Authenticated users can create org"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- 2. Organization memberships (roles)
CREATE TABLE IF NOT EXISTS public.org_memberships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'teacher', 'admin', 'director', 'secretary')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(user_id, org_id)
);

ALTER TABLE public.org_memberships ENABLE ROW LEVEL SECURITY;

-- Members see other members of same org
CREATE POLICY "Org members can view memberships"
  ON public.org_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = org_memberships.org_id
        AND om.user_id = auth.uid()
    )
  );

-- Admin/director/secretary can add members
CREATE POLICY "Admins can add members"
  ON public.org_memberships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = org_memberships.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'director', 'secretary')
    )
    OR auth.uid() = user_id  -- user can join themselves (via invite)
  );

-- Admin/director can remove members
CREATE POLICY "Admins can remove members"
  ON public.org_memberships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = org_memberships.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'director')
    )
  );

-- 3. Classes (within an organization)
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  invite_code text UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  teacher_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Teacher of class, students in class, or director/admin of org can see
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
        AND om.role IN ('admin', 'director', 'secretary')
    )
  );

-- Teacher/admin of org can create classes
CREATE POLICY "Teachers can create classes"
  ON public.classes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = classes.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('teacher', 'admin', 'director')
    )
  );

-- 4. Class memberships (students in a class)
CREATE TABLE IF NOT EXISTS public.class_memberships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(user_id, class_id)
);

ALTER TABLE public.class_memberships ENABLE ROW LEVEL SECURITY;

-- Teacher of class or director can see students
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
        AND om.role IN ('admin', 'director', 'secretary')
    )
  );

-- Students can join via invite (server action inserts)
CREATE POLICY "Students can join classes"
  ON public.class_memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════
-- Indexes for performance
-- ═══════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON public.org_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org ON public.org_memberships(org_id);
CREATE INDEX IF NOT EXISTS idx_classes_org ON public.classes(org_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_invite ON public.classes(invite_code);
CREATE INDEX IF NOT EXISTS idx_class_memberships_class ON public.class_memberships(class_id);
CREATE INDEX IF NOT EXISTS idx_class_memberships_user ON public.class_memberships(user_id);
