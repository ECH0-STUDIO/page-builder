import { test, expect } from '@playwright/test';

test.describe('Live Orders', () => {
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
      await page.fill('input[name="name"]', 'Playwright Test Cafe');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL('**/dashboard');
    }
  });

  test('Orders Page loads', async ({ page }) => {
    await page.goto('/dashboard/orders');
    await expect(page.locator('text=Live Orders')).toBeVisible();
  });
});
