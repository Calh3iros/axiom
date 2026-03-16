-- ═══════════════════════════════════════
-- Phase 5C — Hierarchical Propagation
-- SQL function: get_org_subtree(root_id)
-- Returns all descendant org IDs via recursive CTE
-- ═══════════════════════════════════════

-- Function to get all org IDs in a subtree (root + all descendants)
CREATE OR REPLACE FUNCTION public.get_org_subtree(root_id uuid)
RETURNS TABLE(org_id uuid, depth int) AS $$
  WITH RECURSIVE org_tree AS (
    -- Base case: the root org
    SELECT id AS org_id, 0 AS depth
    FROM public.organizations
    WHERE id = root_id

    UNION ALL

    -- Recursive case: children of current level
    SELECT o.id AS org_id, t.depth + 1
    FROM public.organizations o
    JOIN org_tree t ON o.parent_id = t.org_id
    WHERE t.depth < 10  -- max depth safety (prevents infinite loops)
  )
  SELECT org_id, depth FROM org_tree
  LIMIT 500;  -- safety limit to prevent runaway queries
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to get all ancestor org IDs (from child up to root)
CREATE OR REPLACE FUNCTION public.get_org_ancestors(child_id uuid)
RETURNS TABLE(org_id uuid, depth int) AS $$
  WITH RECURSIVE ancestors AS (
    SELECT id AS org_id, 0 AS depth
    FROM public.organizations
    WHERE id = child_id

    UNION ALL

    SELECT o.id AS org_id, a.depth + 1
    FROM public.organizations o
    JOIN ancestors a ON o.id = (
      SELECT parent_id FROM public.organizations WHERE id = a.org_id
    )
    WHERE a.depth < 10
  )
  SELECT org_id, depth FROM ancestors
  LIMIT 50;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Index on parent_id for fast tree traversal
CREATE INDEX IF NOT EXISTS idx_organizations_parent ON public.organizations(parent_id);
