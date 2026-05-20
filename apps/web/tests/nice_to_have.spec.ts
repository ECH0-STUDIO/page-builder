import { test, expect } from '@playwright/test';

test.describe('Nice to Have Integrations', () => {
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

  test('QR and Payments', async ({ page }) => {
    await page.goto('/dashboard/payments');
    
    // Select Bank
    await page.locator('button[role="combobox"]').first().click();
    await page.locator('div[role="option"]').first().click();
    
    await page.getByPlaceholder('0123456789').fill('1234567890');
    await page.getByPlaceholder('NGUYEN VAN A').fill('TEST ACCOUNT');
    
    await page.locator('button:has-text("Save")').first().click();
    await expect(page.locator('text=Payment settings saved!')).toBeVisible();
    
    await page.goto('/dashboard/qr');
    await expect(page.locator('button:has-text("Download")').first()).toBeVisible();
  });
});
