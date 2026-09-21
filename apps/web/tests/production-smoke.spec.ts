import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Read-only smoke against a live deployment. Does not click Save, does not
 * place orders, does not change slugs, does not call staff.
 *
 *   PLAYWRIGHT_BASE_URL=https://www.eateryvn.com npx playwright test tests/production-smoke.spec.ts
 *
 * Optional:
 *   SMOKE_STORE_SLUG     published store (default la-matcha)
 *   SMOKE_CUSTOM_DOMAIN  verified custom domain origin (default https://next2zero.com)
 *   SMOKE_SKIP_CUSTOM_DOMAIN=1  skip production DNS checks while testing localhost/preview
 *   SMOKE_EMAIL / SMOKE_PASSWORD  dashboard login
 *   SMOKE_ARTIFACT_DIR   write order-page screenshots (default /opt/cursor/artifacts/screenshots)
 */

const slug = process.env.SMOKE_STORE_SLUG || 'la-matcha'
const customOrigin = (process.env.SMOKE_CUSTOM_DOMAIN || 'https://next2zero.com').replace(/\/$/, '')
const skipCustomDomain = process.env.SMOKE_SKIP_CUSTOM_DOMAIN === '1'
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const isLocalhost = /localhost|127\.0\.0\.1/.test(baseURL)
const skipLocalePrefix = isLocalhost && !process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.SMOKE_EMAIL
const password = process.env.SMOKE_PASSWORD
const artifactDir = process.env.SMOKE_ARTIFACT_DIR || '/opt/cursor/artifacts/screenshots'

const STAFF_BTN = /Gọi nhân viên|Call staff/i
const SEARCH = /Tìm món|Search menu/i
const ADD_TO_ORDER = /Thêm vào đơn|Add to order/i
const CLOSED = /Đóng cửa|Ordering is closed|Hiện không nhận đơn/i

function htmlTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return (match?.[1] || '').replace(/\s+/g, ' ').trim()
}

async function fetchTitle(request: APIRequestContext, url: string) {
  const res = await request.get(url, { maxRedirects: 5 })
  return { ok: res.ok(), status: res.status(), title: htmlTitle(await res.text()) }
}

async function assertLiveOrderUi(page: Page) {
  await expect(page.locator('title')).not.toHaveText(/Not Found/i)
  await expect(page.getByRole('button', { name: STAFF_BTN }).first()).toBeVisible({
    timeout: 20_000,
  })
  await expect(page.getByPlaceholder(SEARCH).first()).toBeVisible()
}

async function maybeScreenshot(page: Page, name: string) {
  try {
    if (!existsSync(artifactDir)) mkdirSync(artifactDir, { recursive: true })
    await page.screenshot({ path: join(artifactDir, name), fullPage: true })
  } catch {
    // Artifact dir is optional (CI / local without /opt/cursor).
  }
}

test.describe('Public marketing and auth gates', () => {
  test('home page renders', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.ok()).toBeTruthy()
    await expect(page.locator('title')).not.toHaveText(/Not Found/i)
  })

  test('pricing, features, and signup render', async ({ request, page }) => {
    for (const path of ['/pricing', '/features']) {
      const { ok, title } = await fetchTitle(request, path)
      expect(ok, path).toBeTruthy()
      expect(title, path).not.toMatch(/Not Found/i)
    }
    const signup = await page.goto('/signup')
    expect(signup?.ok()).toBeTruthy()
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('explore is not a 404 when the directory is available', async ({ request }) => {
    const { status, title } = await fetchTitle(request, '/explore')
    test.skip(status >= 500, 'Explore depends on the marketing directory source')
    expect(status).toBeLessThan(400)
    expect(title).not.toMatch(/Not Found/i)
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

  test('cron purge rejects unauthenticated callers', async ({ request }) => {
    // Must 401 before the RPC — never send CRON_SECRET here.
    const res = await request.get('/api/cron/purge-orders')
    expect(res.status()).toBe(401)
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
    const { ok, title } = await fetchTitle(request, `/${slug}/order`)
    expect(ok).toBeTruthy()
    expect(title).toMatch(/Order/i)
    expect(title).not.toMatch(/Not Found/i)
  })

  test('order page shows menu chrome and can add to cart without placing', async ({ page }) => {
    const res = await page.goto(`/${slug}/order`)
    expect(res?.ok()).toBeTruthy()
    await assertLiveOrderUi(page)
    await maybeScreenshot(page, 'diner-order-page.png')

    const closed = await page.getByText(CLOSED).first().isVisible().catch(() => false)
    test.skip(closed, 'Store is outside opening hours — browse-only, no add to cart')

    await expect(page.getByRole('button', { name: /Món thử vị giác|Đồ uống|Khai vị/i }).first()).toBeVisible()
    const addBtn = page.getByRole('button', { name: ADD_TO_ORDER }).first()
    await expect(addBtn).toBeVisible()
    await addBtn.click()
    await expect(page.getByText(/1 món|1 items/i).first()).toBeVisible()
    await maybeScreenshot(page, 'diner-order-cart.png')
  })

  test('locale-prefixed order still works', async ({ request, page }) => {
    test.skip(skipLocalePrefix, 'Locale extras need SUPABASE_SERVICE_ROLE_KEY on a local server')
    const { ok, title } = await fetchTitle(request, `/en/${slug}/order`)
    expect(ok).toBeTruthy()
    expect(title).toMatch(/Order/i)
    expect(title).not.toMatch(/Not Found/i)

    const res = await page.goto(`/en/${slug}/order`)
    expect(res?.ok()).toBeTruthy()
    await assertLiveOrderUi(page)
  })

  test('unpublished store and its order page are 404s', async ({ request }) => {
    const landing = await fetchTitle(request, '/ph-dn')
    expect(landing.title).toMatch(/Not Found/i)
    const order = await fetchTitle(request, '/ph-dn/order')
    expect(order.title).toMatch(/Not Found/i)
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

  test('/order is the order page, not a 404', async ({ request, page }) => {
    const { ok, title } = await fetchTitle(request, `${customOrigin}/order`)
    expect(ok).toBeTruthy()
    expect(title).toMatch(/Order/i)
    expect(title).not.toMatch(/Not Found/i)

    const res = await page.goto(`${customOrigin}/order`)
    expect(res?.ok()).toBeTruthy()
    await assertLiveOrderUi(page)
    await maybeScreenshot(page, 'diner-custom-domain-order.png')
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

  test('owner can open dashboard surfaces without saving', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill(email!)
    await page.locator('input[type="password"]').fill(password!)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20_000 })

    if (page.url().includes('onboarding')) return

    const ownerPaths = [
      '/dashboard',
      '/dashboard/orders',
      '/dashboard/menu',
      '/dashboard/qr',
      '/dashboard/publishing',
      '/dashboard/settings',
      '/dashboard/settings/credits',
    ]

    for (const path of ownerPaths) {
      await page.goto(path)
      await expect(page, path).toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
      // Menu/QR/etc. are not all <h1> pages — sidebar is the stable chrome.
      await expect(page.getByRole('link', { name: /Tổng quan|Overview/i })).toBeVisible()
      await expect(page.locator('body')).not.toContainText(/This page couldn’t load|Application error/i)
    }
    await maybeScreenshot(page, 'owner-dashboard-credits.png')
  })
})
