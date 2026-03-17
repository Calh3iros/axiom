import { test, expect } from '@playwright/test';

/**
 * E2E Smoke Tests — Minimal, reliable, no-auth tests for CI.
 *
 * These tests verify that:
 * 1. Public pages load correctly
 * 2. i18n renders translated strings (no raw keys)
 * 3. Auth middleware redirects unauthenticated users
 *
 * They do NOT require a real Supabase connection or user accounts.
 * They run against the built Next.js app via `pnpm start`.
 */

test.describe('Public Pages Load', () => {
  test('landing page returns 200 and has content', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    // Landing page should have a visible h1
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 10000 });
  });

  test('login page returns 200 and has form', async ({ page }) => {
    const response = await page.goto('/en/auth/login');
    expect(response?.status()).toBe(200);

    // Login page should have email input and submit button
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('signup page returns 200', async ({ page }) => {
    const response = await page.goto('/en/auth/signup');
    expect(response?.status()).toBe(200);

    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('i18n — No Raw Keys Visible', () => {
  // Regex patterns that match raw i18n key formats like:
  // "Dashboard.Sidebar.solve", "Landing.hero.title", "DASHBOARD.MAP.STATS"
  const RAW_KEY_PATTERNS = [
    /\b[A-Z][a-z]+\.[A-Z][a-z]+\.[a-z][a-zA-Z]+\b/,  // Dashboard.Sidebar.solve
    /\b[A-Z][a-z]+\.[A-Z][a-z]+\.[A-Z][a-z]+\b/,      // Dashboard.Map.Title
  ];

  test('English login page has no raw i18n keys', async ({ page }) => {
    await page.goto('/en/auth/login');
    await page.waitForLoadState('domcontentloaded');

    const bodyText = await page.locator('body').innerText();

    for (const pattern of RAW_KEY_PATTERNS) {
      const match = bodyText.match(pattern);
      // Filter out known false positives (brand names, URLs, etc.)
      if (match) {
        const falsePositives = ['Axiom Pro', 'Axiom Elite', 'Google OAuth'];
        const isFalsePositive = falsePositives.some(fp => match[0].includes(fp));
        if (!isFalsePositive) {
          expect(match, `Raw i18n key found: "${match[0]}"`).toBeNull();
        }
      }
    }
  });

  test('Portuguese login page has no raw i18n keys', async ({ page }) => {
    await page.goto('/pt/auth/login');
    await page.waitForLoadState('domcontentloaded');

    const bodyText = await page.locator('body').innerText();

    for (const pattern of RAW_KEY_PATTERNS) {
      const match = bodyText.match(pattern);
      if (match) {
        const falsePositives = ['Axiom Pro', 'Axiom Elite', 'Google OAuth'];
        const isFalsePositive = falsePositives.some(fp => match[0].includes(fp));
        if (!isFalsePositive) {
          expect(match, `Raw i18n key found: "${match[0]}"`).toBeNull();
        }
      }
    }
  });
});

test.describe('Auth Redirects', () => {
  test('/map without auth redirects to login', async ({ page }) => {
    await page.goto('/en/map');
    // After redirect chain, should end up on login page
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test('/solve without auth redirects to login', async ({ page }) => {
    await page.goto('/en/solve');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test('/admin without auth redirects to login', async ({ page }) => {
    await page.goto('/en/admin');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test('/settings without auth redirects to login', async ({ page }) => {
    await page.goto('/en/settings');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });
});
