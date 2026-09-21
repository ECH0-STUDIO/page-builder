import { test, expect } from '@playwright/test'

/**
 * Read-only smoke against a live deployment. Does not click Save, does not
 * place orders, does not change slugs.
 *
 *   PLAYWRIGHT_BASE_URL=https://www.eateryvn.com npx playwright test tests/production-smoke.spec.ts
 *
 * Optional:
 *   SMOKE_STORE_SLUG     published store (default la-matcha)
 *   SMOKE_CUSTOM_DOMAIN  verified custom domain origin (default https://next2zero.com)
 *   SMOKE_SKIP_CUSTOM_DOMAIN=1  skip production DNS checks while testing localhost
 *   SMOKE_EMAIL / SMOKE_PASSWORD  dashboard login
 */

const slug = process.env.SMOKE_STORE_SLUG || 'la-matcha'
const customOrigin = (process.env.SMOKE_CUSTOM_DOMAIN || 'https://next2zero.com').replace(/\/$/, '')
const skipCustomDomain = process.env.SMOKE_SKIP_CUSTOM_DOMAIN === '1'
const email = process.env.SMOKE_EMAIL
const password = process.env.SMOKE_PASSWORD

test.describe('Public marketing and auth gates', () => {
  test('home page renders', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.ok()).toBeTruthy()
    await expect(page.locator('title')).not.toHaveText(/Not Found/i)
  })

  test('pricing and features render', async ({ page }) => {
    for (const path of ['/pricing', '/features', '/explore']) {
      const res = await page.goto(path)
      expect(res?.ok(), path).toBeTruthy()
      await expect(page.locator('title'), path).not.toHaveText(/Not Found/i)
    }
  })

  test('login page has an email field', async ({ page }) => {
    const res = await page.goto('/login')
    expect(res?.ok()).toBeTruthy()
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('dashboard redirects signed-out visitors to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Published storefront', () => {
  test('landing page is the store, not a 404', async ({ page }) => {
    const res = await page.goto(`/${slug}`)
    expect(res?.ok()).toBeTruthy()
    await expect(page).toHaveTitle(/La Matcha/i)
    await expect(page.locator('title')).not.toHaveText(/Not Found/i)
  })

  test('order page is the order UI, not stolen by [locale]/[slug]', async ({ page }) => {
    // This is the URL diners hit from a QR code on the staging host.
    const res = await page.goto(`/${slug}/order`)
    expect(res?.ok()).toBeTruthy()
    await expect(page).toHaveTitle(/Order/i)
    await expect(page.locator('title')).not.toHaveText(/Not Found/i)
    await expect(page.locator('header')).toContainText(/La Matcha/i)
  })

  test('locale-prefixed order still works', async ({ page }) => {
    const res = await page.goto(`/en/${slug}/order`)
    expect(res?.ok()).toBeTruthy()
    await expect(page).toHaveTitle(/Order/i)
    await expect(page.locator('title')).not.toHaveText(/Not Found/i)
  })

  test('unpublished store is a 404', async ({ page }) => {
    await page.goto('/ph-dn')
    await expect(page).toHaveTitle(/Not Found/i)
  })
})

test.describe('Custom domain', () => {
  test.skip(skipCustomDomain, 'Skipped while testing a local/preview host')

  test('apex is the homepage, not /{slug}', async ({ page }) => {
    const res = await page.goto(customOrigin + '/')
    expect(res?.ok()).toBeTruthy()
    await expect(page).toHaveTitle(/La Matcha/i)
    await expect(page).toHaveURL(new RegExp(`${customOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`))
  })

  test('/{slug} canonicalizes to apex', async ({ page }) => {
    await page.goto(`${customOrigin}/${slug}`)
    await expect(page).toHaveURL(new RegExp(`${customOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`))
    await expect(page).toHaveTitle(/La Matcha/i)
  })

  test('/order is the order page, not a 404', async ({ page }) => {
    const res = await page.goto(`${customOrigin}/order`)
    expect(res?.ok()).toBeTruthy()
    await expect(page).toHaveTitle(/Order/i)
    await expect(page.locator('title')).not.toHaveText(/Not Found/i)
    await expect(page.locator('header')).toContainText(/La Matcha/i)
  })

  test('/en/order is the English order page', async ({ page }) => {
    const res = await page.goto(`${customOrigin}/en/order`)
    expect(res?.ok()).toBeTruthy()
    await expect(page).toHaveTitle(/Order/i)
    await expect(page.locator('title')).not.toHaveText(/Not Found/i)
  })
})

test.describe('Dashboard login', () => {
  test.skip(!email || !password, 'Set SMOKE_EMAIL and SMOKE_PASSWORD to exercise login')

  test('owner can open the dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill(email!)
    await page.locator('input[type="password"]').fill(password!)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20_000 })

    if (page.url().includes('onboarding')) return

    await page.goto('/dashboard')
    await expect(page.locator('h1')).toBeVisible()
    await page.goto('/dashboard/orders')
    await expect(page).toHaveURL(/\/dashboard\/orders/)
    await page.goto('/dashboard/publishing')
    await expect(page).toHaveURL(/\/dashboard\/publishing/)
  })
})
