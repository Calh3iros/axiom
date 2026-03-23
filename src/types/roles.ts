// ─── Role & Org Type definitions ─────────────────────────────────────────────
// Canonical source of truth for roles and organization types.
// Import from here instead of hardcoding strings.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Org Roles ───────────────────────────────────────────────────────────────

/** Numeric hierarchy — higher = more authority. */
export const ROLE_HIERARCHY: Record<string, number> = {
  student: 0,
  teacher: 1,
  coordinator: 2,
  admin: 3,
  director: 4,
  owner: 5,
  secretary: 5, // same level as owner (different scope, not subordinate)
};

/**
 * All roles above student that can see performance metrics
 * and access management features.
 */
export const ELEVATED_ROLES: readonly string[] = [
  "teacher",
  "coordinator",
  "admin",
  "director",
  "owner",
  "secretary",
];

/**
 * Roles that can manage org members, classes, and invite codes.
 * (admin/director/owner/secretary — not teacher/coordinator)
 */
export const MANAGER_ROLES: readonly string[] = [
  "admin",
  "director",
  "owner",
  "secretary",
];

/**
 * Roles that can create classes within an org.
 * (teacher + all managers + coordinator)
 */
export const CLASS_CREATOR_ROLES: readonly string[] = [
  "teacher",
  "coordinator",
  "admin",
  "director",
  "owner",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** True if role is elevated (teacher or above). */
export function isElevated(role: string): boolean {
  return ELEVATED_ROLES.includes(role);
}

/** True if role can manage org members and codes. */
export function isManager(role: string): boolean {
  return MANAGER_ROLES.includes(role);
}

/** True if role can create classes. */
export function canCreateClass(role: string): boolean {
  return CLASS_CREATOR_ROLES.includes(role);
}

/** True if `actor` has at least `minRole` authority. */
export function hasMinRole(actor: string, minRole: string): boolean {
  const actorLevel = ROLE_HIERARCHY[actor];
  const minLevel = ROLE_HIERARCHY[minRole];
  if (actorLevel === undefined || minLevel === undefined) return false;
  return actorLevel >= minLevel;
}

// ─── Org Types ───────────────────────────────────────────────────────────────

/** All valid org types for validation. */
export const ALL_ORG_TYPES: readonly string[] = [
  "school",
  "network",
  "state",
  "private_school",
  "private_network",
  "public_municipal",
  "public_state",
];

export function isValidOrgType(type: string): boolean {
  return ALL_ORG_TYPES.includes(type);
}
