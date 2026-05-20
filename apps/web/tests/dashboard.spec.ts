import { test, expect } from '@playwright/test';

test.describe('Dashboard & Business Profile', () => {
  const testEmail = 'thaitvtigervn3333@gmail.com';
  const testPassword = '12345678';

  test.beforeEach(async ({ page }) => {
    // Standard login flow for pre-verified account
    await page.goto('/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.locator('button[type="submit"]').click();
    
    // Wait for navigation
    await page.waitForURL(/\/(dashboard|onboarding)/);
    
    // If onboarding, complete it
    if (page.url().includes('onboarding')) {
      await page.fill('#prof-name', 'Playwright Test Cafe');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL('**/dashboard');
    }
  });

  test('Dashboard loads correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toContainText('Overview');
  });

  test('Update Business Profile', async ({ page }) => {
    await page.goto('/dashboard/business');
    await page.fill('#prof-address', '123 Playwright St');
    await page.fill('#prof-phone', '555-010-2020');
    await page.locator('button[type="submit"]').first().click();
    await expect(page.locator('text=Profile saved')).toBeVisible();
  });
});
