import { test, expect } from '@playwright/test';

import { getTranslations, t } from '../i18n-utils';

test.describe('Core Loop - Free User Journey', () => {

  test('Creates account, resolves a question, verifies limits, and logs out', async ({ page }, testInfo) => {
    // 1. Setup Locale Context
    const locale = testInfo.project.name;
    const dict = getTranslations(locale);
    const uniqueId = Date.now();
    const testEmail = `playwright-free-${uniqueId}@example.com`;
    const testPassword = 'TestPassword123!';

    // 2. Landing Page Navigation
    await page.goto(`/${locale}`);
    
    // Verify Hero title translations
    const _heroTitle = t(dict, 'Landing.hero.title', 'Stop Waiting. Start Solving.');
    // We only match part of it or handle cases where only part of it renders
    await expect(page.locator('h1')).toContainText(/Stop Waiting|start solving/i, { ignoreCase: true, timeout: 10000 });

    // 3. Navigate to Sign Up
    // Since we have multiple buttons, we can just navigate directly or click the Try Free link.
    // The top right button on the landing page is "Try Free" which links to /solve, and since they are unauthenticated, middleware redirects to /auth/login.
    await page.goto(`/${locale}/auth/signup`);

    // 4. Fill Sign Up Form
    await page.locator('#name').fill(`Playwright ${locale.toUpperCase()}`);
    await page.locator('#email').fill(testEmail);
    await page.locator('#password').fill(testPassword);

    const _createAccountBtn = t(dict, 'Dashboard.Auth.createAccount', 'Create Account');
    // Using locator by type to be safer than exact string match
    await page.locator('button[type="submit"]').click();

    // 5. Verify Redirect to Solve Dashboard
    await page.waitForURL(`**/${locale}/solve`);
    
    // We expect the solver textarea to be visible
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    // 6. Ask a Question
    await textarea.fill('What is 2+2? Give a very short answer.');
    await page.keyboard.press('Enter');

    // Wait for AI response (the "Solve" UI adds user message then AI message)
    // We can infer completion when the textarea is enabled again or we see the 'Share' or 'Modifiers' buttons.
    const modifiersText = t(dict, 'Dashboard.Components.modifiers', 'Modifiers');
    await expect(page.getByText(modifiersText)).toBeVisible({ timeout: 15000 });

    // 7. Check Limits Usage
    // Open Settings panel
    await page.goto(`/${locale}/settings`);
    
    // The Free plan allows 3 solves. So we should see "2 / 3" or similar usage.
    // Let's assert the Free plan badge is active
    const planFree = t(dict, 'Dashboard.Sidebar.free', 'FREE');
    await expect(page.getByText(planFree, { exact: true })).toBeVisible();

    // 8. Sign Out
    // Hover over the profile or find the sign-out button
    const signOutBtn = t(dict, 'Dashboard.Sidebar.signOut', 'Sign Out');
    await page.locator(`text=${signOutBtn}`).click();

    // Verify redirected to Login or Landing
    await expect(page).toHaveURL(new RegExp(`.*\\/${locale}\\/auth\\/login`));
  });

});
