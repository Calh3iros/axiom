"use server";

import { getUserAndPlan } from "@/lib/usage";

/**
 * Returns the computed plan for the user, 
 * bypassing the need for a Request object, which is useful in client components.
 */
export async function getUserActivePlan(userId?: string) {
  const { plan } = await getUserAndPlan(undefined, userId);
  return plan;
}
