import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  const testEmail = 'thaitvtigervn3333@gmail.com';
  const testPassword = '12345678';

  test('Login flow', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/(dashboard|onboarding)/);
    expect(page.url()).toMatch(/(dashboard|onboarding)/);
  });
});
