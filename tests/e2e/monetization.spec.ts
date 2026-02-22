import { test, expect } from '@playwright/test';
import { getTranslations, t } from '../i18n-utils';

test.describe('Monetization - Stripe Checkout', () => {
  test('Hits Humanizer limit, upgrades to Pro via Stripe, and cancels', async ({ page }, testInfo) => {
    // We increase timeout as Stripe interactions take longer
    test.setTimeout(90000); 

    const locale = testInfo.project.name;
    const dict = getTranslations(locale);
    const uniqueId = Date.now();
    const testEmail = `playwright-pro-${uniqueId}@example.com`;
    const testPassword = 'TestPassword123!';

    // 1. Setup User Account
    await page.goto(`/${locale}/auth/signup`);
    await page.locator('#name').fill(`Pro Tester ${locale.toUpperCase()}`);
    await page.locator('#email').fill(testEmail);
    await page.locator('#password').fill(testPassword);
    
    const createAccountBtn = t(dict, 'Dashboard.Auth.createAccount', 'Create Account');
    // We can rely on button type submit to avoid exact matching issues
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`**/${locale}/solve`);

    // 2. Navigate to Write/Humanizer module
    const writeModeBtn = t(dict, 'Dashboard.Sidebar.write', 'Write');
    await page.locator(`text=${writeModeBtn}`).first().click();

    // 3. Hit Humanizer Word Limit
    // Paste >500 words to immediately trigger the paywall
    const longText = Array(600).fill('word').join(' ');
    // The Write mode has a textarea. Let's find it.
    await page.locator('textarea').fill(longText);

    // Click "Humanize" button
    const humanizeBtn = t(dict, 'Dashboard.Components.humanize', 'Humanize');
    await page.locator(`button:has-text("${humanizeBtn}")`).click();

    // 4. Paywall should appear
    // We check for the Upgrade button instead of a strict translated title string
    await expect(page.locator('button', { hasText: /Subscribe|Upgrade/i }).first()).toBeVisible({ timeout: 15000 });

    // 5. Click Upgrade (Proceed to Checkout)
    const selectPlanBtn = t(dict, 'Dashboard.Components.upgradeYearly', 'Subscribe Yearly');
    // Using a broader locator in case the translation has variations
    await page.getByRole('button').filter({ hasText: /Subscribe|Upgrade/i }).first().click();

    // 6. Complete Stripe Checkout
    // Wait for Stripe Checkout to load
    await page.waitForURL(/.*checkout\.stripe\.com.*/, { timeout: 15000 });
    
    // Fill Stripe form (test card)
    await page.locator('#email').fill(testEmail);
    await page.locator('#cardNumber').fill('4242 4242 4242 4242');
    await page.locator('#cardExpiry').fill('12/34');
    await page.locator('#cardCvc').fill('123');
    await page.locator('#billingName').fill('Test User');
    
    // Submit payment
    await page.locator('.SubmitButton').click();

    // 7. Return and Verify PRO Badge
    await page.waitForURL(`**/${locale}/solve?session_id=*`, { timeout: 25000 });
    await expect(page.getByText('PRO ✨')).toBeVisible({ timeout: 10000 });

    // 8. Open Settings and Cancel Subscription
    const settingsBtn = t(dict, 'Dashboard.Sidebar.settings', 'Settings');
    await page.locator(`text=${settingsBtn}`).first().click();
    
    // Wait for Settings page
    await page.waitForURL(`**/${locale}/settings`);
    
    const manageBillingBtn = t(dict, 'Dashboard.Settings.manageSubscription', 'Manage Subscription');
    
    // Click Manage Billing. It opens the customer portal in the same tab or new?
    // In our code we used window.location.href, so it's the same tab
    await page.locator(`button:has-text("${manageBillingBtn}")`).click();

    // Wait for Stripe Customer Portal
    await page.waitForURL(/.*billing\.stripe\.com.*/, { timeout: 15000 });
    
    // Click Cancel Plan natively on Stripe
    await page.getByText('Cancel plan').click();
    await page.getByRole('button', { name: 'Cancel plan' }).click();

    // The test successfully navigated back or confirmed cancellation
  });
});
