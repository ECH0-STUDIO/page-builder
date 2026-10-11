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

async function shot(page, name, locator) {
  const path = join(outDir, `${name}.png`)
  if (locator) {
    await locator.screenshot({ path })
  } else {
    await page.screenshot({ path, fullPage: false })
  }
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
  await page.goto(`${baseURL}${path}`, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForTimeout(1200)
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

  // 1 Credits — scroll to transaction history / load more
  await go(page, '/dashboard/settings/credits')
  const history = page.getByText(/Lịch Sử Giao Dịch|Transaction History/i).first()
  if (await history.count()) {
    await history.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
  }
  await shot(page, '01-credits-history')
  const loadMore = page.getByRole('button', { name: /Load more|Xem thêm/i })
  if (await loadMore.count()) {
    await loadMore.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await shot(page, '01b-credits-load-more')
  } else {
    console.log('no load-more button (≤20 txs or not rendered)')
  }

  // 2 Publishing custom domain
  await go(page, '/dashboard/publishing')
  const domainHeading = page.getByText(/Tên miền tùy chỉnh|Custom domain/i).first()
  if (await domainHeading.count()) {
    await domainHeading.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
  }
  await shot(page, '02-publishing-domain')

  // 3 Translation tabs + 8 AI modal
  await go(page, '/dashboard/translations')
  const editLink = page.locator('a[href*="/dashboard/translations/"]').first()
  if (await editLink.count()) {
    await editLink.click()
    await page.waitForTimeout(1500)
  } else {
    await go(page, '/dashboard/translations/en')
  }
  await shot(page, '03-translation-tabs')

  const aiBtn = page.getByRole('button', { name: /Dịch bằng AI|Translate with AI/i }).first()
  if (await aiBtn.count()) {
    await aiBtn.click()
    await page.waitForTimeout(800)
    await shot(page, '08-ai-translate-modal')
    await page.keyboard.press('Escape')
  } else {
    console.log('AI translate button not found')
  }

  // 4 Settings tabs
  await go(page, '/dashboard/settings/localization')
  await page.waitForTimeout(600)
  await shot(page, '04-settings-nav')

  // 5 PDF preview
  await go(page, '/dashboard/print-menu')
  await page.waitForTimeout(1500)
  const previewOpen = page.getByRole('button', { name: /Xem trước|Preview|PDF|In PDF/i }).first()
  if (await previewOpen.count()) {
    await previewOpen.click()
    await page.waitForTimeout(1200)
  }
  await shot(page, '05-pdf-preview')
  const zoomOut = page.locator('button[title="Zoom Out"]').first()
  if (await zoomOut.count() && await zoomOut.isVisible()) {
    await zoomOut.click({ force: true })
    await page.waitForTimeout(200)
    await zoomOut.click({ force: true })
    await page.waitForTimeout(400)
    await shot(page, '05b-pdf-preview-zoomed')
  } else {
    console.log('zoom controls not visible in viewport')
  }

  // 6 + 11 Media
  await go(page, '/dashboard/gallery')
  await shot(page, '11-media-padding')
  const checks = page.locator('div.group button').filter({ has: page.locator('svg') })
  if (await checks.count()) {
    await checks.first().click({ force: true })
    await page.waitForTimeout(400)
  }
  await shot(page, '06-media-selection')
  const more = page.locator('button[aria-label*="more" i], button[aria-label*="Thêm" i], button[aria-label*="More" i]').first()
  if (await more.count()) {
    await more.click()
    await page.waitForTimeout(400)
    await shot(page, '06b-media-item-menu')
    await page.keyboard.press('Escape')
  }

  // 10 + 12 Menu
  await go(page, '/dashboard/menu')
  await shot(page, '10-menu-item-actions')
  const menuSelect = page.locator('button[aria-label="Select item"]')
  if (await menuSelect.count()) {
    const n = Math.min(await menuSelect.count(), 2)
    for (let i = 0; i < n; i++) {
      await page.locator('button[aria-label="Select item"]').first().click({ force: true })
      await page.waitForTimeout(200)
    }
    await shot(page, '12-menu-selection-bar')
  }

  // 7 Page builder — capture header
  await go(page, '/dashboard/pages')
  await page.waitForTimeout(2500)
  const header = page.locator('.eatery-puck-header').first()
  if (await header.count()) {
    await shot(page, '07-page-builder-bar', header)
    await shot(page, '07b-page-builder-full')
    const moreBtn = header.getByRole('button', { name: /More|Thêm/i }).first()
    if (await moreBtn.count()) {
      await moreBtn.click()
      await page.waitForTimeout(400)
      await shot(page, '07c-page-builder-more-menu')
      await page.keyboard.press('Escape')
    }
  } else {
    console.log('page builder header missing')
    await shot(page, '07-page-builder-bar')
  }

  // 9 Onboarding slug
  await page.goto(`${baseURL}/onboarding/new-business`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(800)
  if (page.url().includes('onboarding')) {
    await page.locator('#biz-slug').click()
    await page.waitForTimeout(200)
    await shot(page, '09-onboarding-slug')
  } else {
    console.log('skip onboarding (redirected)', page.url())
  }

  // 13 Orders history dates
  await go(page, '/dashboard/orders')
  const hist = page.getByRole('button', { name: /Lịch sử|History/i }).first()
  if (await hist.count()) {
    await hist.click()
    await page.waitForTimeout(1000)
  }
  await shot(page, '13-orders-dates')

  await browser.close()
  console.log('done', outDir)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
