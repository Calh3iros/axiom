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
 * Roles that can access dashboards, manage classes, and invite codes.
 * Includes coordinator for pedagogical dashboard access.
 */
export const MANAGER_ROLES: readonly string[] = [
  "coordinator",
  "admin",
  "director",
  "owner",
  "secretary",
];

/**
 * Roles that can add/remove org members (professors, coordinators).
 * Coordinator is excluded — pedagogical focus, not HR.
 */
export const MEMBER_MANAGER_ROLES: readonly string[] = [
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

/** True if role can access dashboards and manage classes/codes. */
export function isManager(role: string): boolean {
  return MANAGER_ROLES.includes(role);
}

/** True if role can add/remove org members (professors, coordinators). */
export function canManageMembers(role: string): boolean {
  return MEMBER_MANAGER_ROLES.includes(role);
}

/** True if role can manage org settings (create schools, contracts). */
export function canManageOrg(role: string): boolean {
  return ["admin", "owner", "secretary"].includes(role);
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
