import { describe, it, expect, vi } from "vitest";

// Mock Supabase modules before importing usage
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      insert: vi.fn().mockResolvedValue({ data: null }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    })),
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    })),
  }),
}));

import { PLANS, isPaidPlan, getUserIdFromRequest } from "./usage";
import type { PlanType, UsageType } from "./usage";

// ---------------------------------------------------------------------------
// PLANS config
// ---------------------------------------------------------------------------

describe("PLANS config", () => {
  it("should have free, pro, and elite plans", () => {
    expect(Object.keys(PLANS)).toEqual(["free", "pro", "elite"]);
  });

  it("free plan should have correct daily limits", () => {
    expect(PLANS.free.daily.solves).toBe(3);
    expect(PLANS.free.daily.writes).toBe(1);
    expect(PLANS.free.daily.humanize_words).toBe(500);
    expect(PLANS.free.daily.learns).toBe(2);
  });

  it("pro plan should have higher daily limits", () => {
    expect(PLANS.pro.daily.solves).toBe(50);
    expect(PLANS.pro.daily.writes).toBe(20);
    expect(PLANS.pro.daily.humanize_words).toBe(5_000);
    expect(PLANS.pro.daily.learns).toBe(20);
  });

  it("elite plan should have highest limits", () => {
    expect(PLANS.elite.daily.solves).toBe(150);
    expect(PLANS.elite.daily.writes).toBe(50);
    expect(PLANS.elite.daily.humanize_words).toBe(Infinity);
    expect(PLANS.elite.daily.learns).toBe(50);
  });

  it("free plan should have no monthly caps", () => {
    expect(PLANS.free.monthly.solves).toBeNull();
    expect(PLANS.free.monthly.writes).toBeNull();
    expect(PLANS.free.monthly.learns).toBeNull();
  });

  it("pro plan should have monthly caps", () => {
    expect(PLANS.pro.monthly.solves).toBe(1_500);
    expect(PLANS.pro.monthly.writes).toBe(600);
    expect(PLANS.pro.monthly.learns).toBe(600);
  });

  it("elite plan should have higher monthly caps", () => {
    expect(PLANS.elite.monthly.solves).toBe(4_500);
    expect(PLANS.elite.monthly.writes).toBe(1_500);
    expect(PLANS.elite.monthly.learns).toBe(1_500);
  });

  it("elite daily limits should always be >= pro daily limits", () => {
    const types: (keyof typeof PLANS.pro.daily)[] = [
      "solves",
      "writes",
      "humanize_words",
      "learns",
    ];
    for (const type of types) {
      expect(PLANS.elite.daily[type]).toBeGreaterThanOrEqual(
        PLANS.pro.daily[type]
      );
    }
  });

  it("pro daily limits should always be >= free daily limits", () => {
    const types: (keyof typeof PLANS.free.daily)[] = [
      "solves",
      "writes",
      "humanize_words",
      "learns",
    ];
    for (const type of types) {
      expect(PLANS.pro.daily[type]).toBeGreaterThanOrEqual(
        PLANS.free.daily[type]
      );
    }
  });
});

// ---------------------------------------------------------------------------
// isPaidPlan
// ---------------------------------------------------------------------------

describe("isPaidPlan", () => {
  it("should return false for free plan", () => {
    expect(isPaidPlan("free")).toBe(false);
  });

  it("should return true for pro plan", () => {
    expect(isPaidPlan("pro")).toBe(true);
  });

  it("should return true for elite plan", () => {
    expect(isPaidPlan("elite")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getUserIdFromRequest
// ---------------------------------------------------------------------------

describe("getUserIdFromRequest", () => {
  it("should extract IP from x-forwarded-for header", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    expect(getUserIdFromRequest(req)).toBe("anon:1.2.3.4");
  });

  it("should take first IP from comma-separated list", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8, 9.10.11.12" },
    });
    expect(getUserIdFromRequest(req)).toBe("anon:1.2.3.4");
  });

  it("should return anon:anonymous when no forwarded header", () => {
    const req = new Request("https://example.com");
    expect(getUserIdFromRequest(req)).toBe("anon:anonymous");
  });
});

// ---------------------------------------------------------------------------
// Type safety checks
// ---------------------------------------------------------------------------

describe("Type safety", () => {
  it("PlanType should only accept valid plans", () => {
    const validPlans: PlanType[] = ["free", "pro", "elite"];
    for (const plan of validPlans) {
      expect(PLANS[plan]).toBeDefined();
    }
  });

  it("UsageType should map to valid fields", () => {
    const validTypes: UsageType[] = ["solve", "humanize", "write", "learn"];
    expect(validTypes).toHaveLength(4);
  });
});
