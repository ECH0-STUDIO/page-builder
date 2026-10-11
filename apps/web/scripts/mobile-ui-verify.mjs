/**
 * Mobile screenshot verification for the 13 UI fixes.
 * Usage:
 *   PLAYWRIGHT_BASE_URL=https://app.eateryvn.com node scripts/mobile-ui-verify.mjs
 */
import { chromium, devices } from '@playwright/test'
import { mkdirSync } from 'fs'
import { join } from 'path'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://app.eateryvn.com'
const email = process.env.SMOKE_EMAIL || 'thaitvtigervn3333@gmail.com'
const password = process.env.SMOKE_PASSWORD || '12345678'
const outDir = process.env.SCREENSHOT_DIR || '/opt/cursor/artifacts/mobile-ui-verify'
mkdirSync(outDir, { recursive: true })

const iPhone = devices['iPhone 13']

async function shot(page, name) {
  const path = join(outDir, `${name}.png`)
  await page.screenshot({ path, fullPage: false })
  console.log('shot', path)
  return path
}

async function login(page) {
  await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await Promise.all([
    page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 60000 }),
    page.locator('button[type="submit"]').click(),
  ])
}

async function go(page, path) {
  await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle', timeout: 90000 }).catch(async () => {
    await page.goto(`${baseURL}${path}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  })
  await page.waitForTimeout(800)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    ...iPhone,
    locale: 'vi-VN',
  })
  const page = await context.newPage()
  page.setDefaultTimeout(45000)

  await login(page)
  console.log('logged in', page.url())

  // 1 Credits
  await go(page, '/dashboard/settings/credits')
  await shot(page, '01-credits-history')

  // 2 Publishing custom domain
  await go(page, '/dashboard/publishing')
  await page.evaluate(() => window.scrollTo(0, 400))
  await page.waitForTimeout(400)
  await shot(page, '02-publishing-domain')

  // 3 Translation tabs
  await go(page, '/dashboard/translations')
  const localeLink = page.locator('a[href*="/dashboard/translations/"]').first()
  if (await localeLink.count()) {
    await localeLink.click()
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(800)
  } else {
    await go(page, '/dashboard/translations/en')
  }
  await shot(page, '03-translation-tabs')

  // 8 AI translate modal (from translation page)
  const aiBtn = page.getByRole('button', { name: /AI|Dịch bằng AI|Translate with AI/i }).first()
  if (await aiBtn.count()) {
    await aiBtn.click()
    await page.waitForTimeout(600)
    await shot(page, '08-ai-translate-modal')
    await page.keyboard.press('Escape')
  }

  // 4 Settings tabs (no logout overlap)
  await go(page, '/dashboard/settings/localization')
  await shot(page, '04-settings-nav')

  // 6 + 11 Media
  await go(page, '/dashboard/gallery')
  await shot(page, '11-media-padding')
  const mediaCheck = page.locator('button[aria-label*="elect"], button[aria-label*="Chọn"]').first()
  if (await mediaCheck.count()) {
    await mediaCheck.click()
    await page.waitForTimeout(400)
  } else {
    // fallback: click first checkbox-like control on tile
    const tileBtn = page.locator('.group button').first()
    if (await tileBtn.count()) await tileBtn.click()
    await page.waitForTimeout(400)
  }
  await shot(page, '06-media-selection')

  // 10 + 12 Menu
  await go(page, '/dashboard/menu')
  await shot(page, '10-menu-item-actions')
  const menuSelect = page.locator('button[aria-label="Select item"]')
  if (await menuSelect.count()) {
    const n = Math.min(await menuSelect.count(), 3)
    for (let i = 0; i < n; i++) {
      // Always click the first remaining unselected control — labels flip after click
      await page.locator('button[aria-label="Select item"]').first().click({ force: true })
      await page.waitForTimeout(200)
    }
    await shot(page, '12-menu-selection-bar')
  }

  // 5 PDF preview
  const printBtn = page.getByRole('button', { name: /PDF|In|Print/i }).first()
  if (await printBtn.count()) {
    await printBtn.click()
    await page.waitForTimeout(1000)
    await shot(page, '05-pdf-preview')
    await page.keyboard.press('Escape')
  } else {
    // try menu page print entry points
    const anyPrint = page.locator('button:has-text("PDF"), a:has-text("PDF")').first()
    if (await anyPrint.count()) {
      await anyPrint.click()
      await page.waitForTimeout(1000)
      await shot(page, '05-pdf-preview')
    }
  }

  // 7 Page builder
  await go(page, '/dashboard/pages')
  await shot(page, '07-page-builder-bar')

  // 9 Onboarding slug — open if reachable; otherwise skip
  await page.goto(`${baseURL}/onboarding/new-business`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(600)
  if (page.url().includes('onboarding')) {
    await shot(page, '09-onboarding-slug')
  } else {
    console.log('skip onboarding (redirected)', page.url())
  }

  // 13 Orders history dates
  await go(page, '/dashboard/orders')
  const hist = page.getByRole('button', { name: /Lịch sử|History/i }).first()
  if (await hist.count()) {
    await hist.click()
    await page.waitForTimeout(800)
  }
  await shot(page, '13-orders-dates')

  // 1 again: scroll credits for load more if present
  await go(page, '/dashboard/settings/credits')
  const loadMore = page.getByRole('button', { name: /Load more|Xem thêm/i })
  if (await loadMore.count()) {
    await loadMore.scrollIntoViewIfNeeded()
    await shot(page, '01b-credits-load-more')
  }

  await browser.close()
  console.log('done', outDir)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
