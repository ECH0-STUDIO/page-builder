import { test, expect, type APIRequestContext } from '@playwright/test'

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
const testingProduction = (process.env.PLAYWRIGHT_BASE_URL || '').includes('eateryvn.com')
const skipLocalePrefix = !testingProduction && !process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.SMOKE_EMAIL
const password = process.env.SMOKE_PASSWORD

function htmlTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return (match?.[1] || '').replace(/\s+/g, ' ').trim()
}

async function fetchTitle(request: APIRequestContext, url: string) {
  const res = await request.get(url, { maxRedirects: 5 })
  return { ok: res.ok(), status: res.status(), title: htmlTitle(await res.text()) }
}

test.describe('Public marketing and auth gates', () => {
  test('home page renders', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.ok()).toBeTruthy()
    await expect(page.locator('title')).not.toHaveText(/Not Found/i)
  })

  test('pricing and features render', async ({ request }) => {
    for (const path of ['/pricing', '/features']) {
      const { ok, title } = await fetchTitle(request, path)
      expect(ok, path).toBeTruthy()
      expect(title, path).not.toMatch(/Not Found/i)
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
  test('landing page is the store, not a 404', async ({ request }) => {
    const { ok, title } = await fetchTitle(request, `/${slug}`)
    expect(ok).toBeTruthy()
    expect(title).toMatch(/La Matcha/i)
    expect(title).not.toMatch(/Not Found/i)
  })

  test('order page is the order UI, not stolen by [locale]/[slug]', async ({ request }) => {
    // QR / staging-host diner URL. Production main currently titles this "Not Found | Eatery".
    const { ok, title } = await fetchTitle(request, `/${slug}/order`)
    expect(ok).toBeTruthy()
    expect(title).toMatch(/Order/i)
    expect(title).not.toMatch(/Not Found/i)
  })

  test('locale-prefixed order still works', async ({ request }) => {
    test.skip(skipLocalePrefix, 'Locale extras need SUPABASE_SERVICE_ROLE_KEY on a local server')
    const { ok, title } = await fetchTitle(request, `/en/${slug}/order`)
    expect(ok).toBeTruthy()
    expect(title).toMatch(/Order/i)
    expect(title).not.toMatch(/Not Found/i)
  })

  test('unpublished store is a 404', async ({ request }) => {
    const { title } = await fetchTitle(request, '/ph-dn')
    expect(title).toMatch(/Not Found/i)
  })
})

test.describe('Custom domain', () => {
  test.skip(skipCustomDomain, 'Skipped while testing a local/preview host')

  test('apex is the homepage, not /{slug}', async ({ request }) => {
    const { ok, title } = await fetchTitle(request, customOrigin + '/')
    expect(ok).toBeTruthy()
    expect(title).toMatch(/La Matcha/i)
  })

  test('/{slug} canonicalizes to apex', async ({ page }) => {
    await page.goto(`${customOrigin}/${slug}`)
    await expect(page).toHaveURL(new RegExp(`${customOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`))
  })

  test('/order is the order page, not a 404', async ({ request }) => {
    const { ok, title } = await fetchTitle(request, `${customOrigin}/order`)
    expect(ok).toBeTruthy()
    expect(title).toMatch(/Order/i)
    expect(title).not.toMatch(/Not Found/i)
  })

  test('/en/order is the English order page', async ({ request }) => {
    const { ok, title } = await fetchTitle(request, `${customOrigin}/en/order`)
    expect(ok).toBeTruthy()
    expect(title).toMatch(/Order/i)
    expect(title).not.toMatch(/Not Found/i)
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
