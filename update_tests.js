const fs = require('fs');

const setupCode = `  const testEmail = 'thaitvtigervn3333@gmail.com';
  const testPassword = '12345678';

  test.beforeEach(async ({ page }) => {
    // Standard login flow for pre-verified account
    await page.goto('/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.locator('button[type="submit"]').click();
    
    // Wait for navigation
    await page.waitForURL('**/(dashboard|onboarding)**');
    
    // If onboarding, complete it
    if (page.url().includes('onboarding')) {
      await page.fill('input[name="name"]', 'Playwright Test Cafe');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL('**/dashboard');
    }
  });`;

// 1. Update dashboard.spec.ts
fs.writeFileSync('apps/web/tests/dashboard.spec.ts', `import { test, expect } from '@playwright/test';

test.describe('Dashboard & Business Profile', () => {
${setupCode}

  test('Dashboard loads correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toContainText('Overview');
  });

  test('Update Business Profile', async ({ page }) => {
    await page.goto('/dashboard/business');
    await page.fill('input[name="address"]', '123 Playwright St');
    await page.fill('input[name="phone"]', '555-010-2020');
    await page.locator('button[type="submit"]').first().click();
    await expect(page.locator('text=Saved successfully')).toBeVisible();
  });
});
`);

// 2. Update menu.spec.ts
fs.writeFileSync('apps/web/tests/menu.spec.ts', `import { test, expect } from '@playwright/test';

test.describe('Menu Management', () => {
${setupCode}

  test('Create Category', async ({ page }) => {
    await page.goto('/dashboard/menu');
    await page.locator('button:has-text("Add Category")').click();
    await page.fill('input[name="name"]', 'Starters');
    await page.locator('button:has-text("Save")').last().click();
    await expect(page.locator('text=Starters')).toBeVisible();
  });
});
`);

// 3. Update orders.spec.ts
fs.writeFileSync('apps/web/tests/orders.spec.ts', `import { test, expect } from '@playwright/test';

test.describe('Live Orders', () => {
${setupCode}

  test('Orders Page loads', async ({ page }) => {
    await page.goto('/dashboard/orders');
    await expect(page.locator('text=Live Orders')).toBeVisible();
  });
});
`);

// 4. Update pages.spec.ts
fs.writeFileSync('apps/web/tests/pages.spec.ts', `import { test, expect } from '@playwright/test';

test.describe('Page Builder', () => {
${setupCode}

  test('Builder loads', async ({ page }) => {
    await page.goto('/dashboard/pages');
    await expect(page.locator('text=Add Block')).toBeVisible();
  });
});
`);

// 5. Update publishing.spec.ts
fs.writeFileSync('apps/web/tests/publishing.spec.ts', `import { test, expect } from '@playwright/test';

test.describe('Publishing', () => {
${setupCode}

  test('Update Slug', async ({ page }) => {
    await page.goto('/dashboard/publishing');
    const newSlug = 'playwright-pub-' + Date.now();
    await page.fill('input[name="slug"]', newSlug);
    await page.locator('button:has-text("Save")').first().click();
    await expect(page.locator('text=Saved successfully')).toBeVisible();
  });
});
`);

// 6. Update nice_to_have.spec.ts
fs.writeFileSync('apps/web/tests/nice_to_have.spec.ts', `import { test, expect } from '@playwright/test';

test.describe('Nice to Have Integrations', () => {
${setupCode}

  test('QR and Payments', async ({ page }) => {
    await page.goto('/dashboard/payments');
    await page.fill('input[name="bank_account_number"]', '1234567890');
    await page.fill('input[name="bank_account_name"]', 'TEST ACCOUNT');
    await page.locator('button:has-text("Save")').first().click();
    await expect(page.locator('text=Saved successfully')).toBeVisible();
    
    await page.goto('/dashboard/qr');
    await expect(page.locator('button:has-text("Download")')).toBeVisible();
  });
});
`);

// 7. Update settings.spec.ts
fs.writeFileSync('apps/web/tests/settings.spec.ts', `import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
${setupCode}

  test('Localization', async ({ page }) => {
    await page.goto('/dashboard/settings/localization');
    await page.locator('button[role="combobox"]').click();
    await page.locator('div[role="option"]:has-text("Vietnamese")').click();
    await page.locator('button:has-text("Save")').click();
    await expect(page.locator('text=Saved successfully')).toBeVisible();
  });
});
`);

// 8. Update auth.spec.ts
fs.writeFileSync('apps/web/tests/auth.spec.ts', `import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  const testEmail = 'thaitvtigervn3333@gmail.com';
  const testPassword = '12345678';

  test('Login flow', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/(dashboard|onboarding)**');
    expect(page.url()).toMatch(/(dashboard|onboarding)/);
  });
});
`);

console.log('Successfully updated all test scripts.');
