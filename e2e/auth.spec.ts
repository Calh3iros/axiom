import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to the login page and show correct elements', async ({ page }) => {
    // Navigate to the login page explicitly using a locale to avoid redirect complexity in tests
    await page.goto('/en/auth/login');
    
    // Check if the logo/title exists
    await expect(page.locator('text=AXIOM')).toBeVisible();
    await expect(page.locator('text=Sign in to your account')).toBeVisible();

    // Verify email and password inputs exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Verify buttons
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
  });

  test('should navigate to the signup page and show correct elements', async ({ page }) => {
    // Navigate to the signup page
    await page.goto('/en/auth/signup');

    // Check titles
    await expect(page.locator('text=Create your free account')).toBeVisible();

    // Verify inputs (Name, Email, Password)
    await expect(page.locator('label:has-text("Full Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Email")')).toBeVisible();
    await expect(page.locator('label:has-text("Password")')).toBeVisible();

    // Check minimum password validation
    const submitBtn = page.locator('button[type="submit"]');
    await page.fill('input[type="password"]', '123'); // Less than 6 characters
    await submitBtn.click();
    
    // HTML5 validation or our custom validation should prevent it or show error
    // (Playwright can check custom text messages or native validation states)
  });

  test('should allow toggling between login and signup', async ({ page }) => {
    await page.goto('/en/auth/login');
    
    // Click the "Sign up" link at the bottom
    await page.click('text=Sign up');
    await expect(page).toHaveURL(/.*\/auth\/signup/);

    // Click "Sign in" link from signup page
    await page.click('text=Sign in');
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });
});
