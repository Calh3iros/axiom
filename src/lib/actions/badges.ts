"use server";

import { createClient } from "@/lib/supabase/server";

export type UserBadge = {
  badge_id: string;
  unlocked_at: string;
  icon: string;
  name_key: string;
  description_key: string;
  category: string;
  criteria_type: string;
  criteria_value: number;
  sort_order: number;
};

export type BadgeCatalogItem = {
  id: string;
  icon: string;
  name_key: string;
  description_key: string;
  category: string;
  criteria_type: string;
  criteria_value: number;
  sort_order: number;
};

/**
 * Get all badges (catalog + user's unlocked status)
 */
export async function getUserBadges(): Promise<{
  catalog: BadgeCatalogItem[];
  unlocked: UserBadge[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { catalog: [], unlocked: [] };

  // Fetch catalog and user badges in parallel
  const [catalogRes, unlockedRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase
      .from("badges_catalog")
      .select("id, icon, name_key, description_key, category, criteria_type, criteria_value, sort_order")
      .order("sort_order") as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase
      .from("user_badges")
      .select("badge_id, unlocked_at")
      .eq("user_id", user.id) as any),
  ]);

  const catalog: BadgeCatalogItem[] = catalogRes?.data || [];

  // Merge badge metadata into unlocked results
  const unlockedMap = new Map(
    (unlockedRes?.data || []).map((u: { badge_id: string; unlocked_at: string }) => [
      u.badge_id,
      u.unlocked_at,
    ])
  );

  const unlocked: UserBadge[] = catalog
    .filter((b) => unlockedMap.has(b.id))
    .map((b) => ({
      badge_id: b.id,
      unlocked_at: unlockedMap.get(b.id) as string,
      icon: b.icon,
      name_key: b.name_key,
      description_key: b.description_key,
      category: b.category,
      criteria_type: b.criteria_type,
      criteria_value: b.criteria_value,
      sort_order: b.sort_order,
    }));

  return { catalog, unlocked };
}
