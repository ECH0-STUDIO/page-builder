import { test, expect } from '@playwright/test';

test.describe('Publishing', () => {
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

  test('Update Slug', async ({ page }) => {
    await page.goto('/dashboard/publishing');
    const newSlug = 'playwright-pub-' + Date.now();
    await page.fill('#pub-slug', newSlug);
    
    // Wait for slug check to finish (Available)
    await expect(page.locator('text=Available')).toBeVisible();

    await page.locator('button:has-text("Save")').first().click();
    await expect(page.locator('text=URL updated')).toBeVisible(); // The toast in PublishingClient is "URL updated"
  });
});
