# Marketing site & app subdomain split

Production layout:

| Host | Purpose |
|------|---------|
| `eateryvn.com` (or `eatery.com`) | Marketing: `/`, `/pricing`, `/features`, `/explore`, `/contact`, `/blog`, **and public store pages** `/{slug}` |
| `app.eateryvn.com` | Application: login, dashboard, page builder, public menu pages (`/{slug}`) |

Both hosts point to the **same Vercel project**. Routing is handled in `apps/web/src/proxy.ts`.

## Marketing site = Webflow HTML + shared chrome

There are **no React marketing pages**. Every marketing URL is served by a `route.ts` handler that returns your Webflow export HTML with:

- Blog posts injected from Google Sheets (by locale)
- **Shared navbar links** (Explore, Pricing, Features, Blog) rewritten onto every page
- VI | EN language switcher in the navbar
- English copy via `marketing-i18n.ts` when `?lang=en`
- Vietnamese page *content* = export HTML as-is (clean URLs)

Webflow exports a **copy of the navbar into every HTML file**. Those copies drift — this is why Explore could appear on the homepage but not on `/explore` (that route reuses the pricing template, and a leftover “add Explore if missing” check skipped it because the locale switcher already linked to `/explore`). Do not maintain nav links in Webflow.

| Concern | Source of truth |
|---------|-----------------|
| Page layout, visual navbar variant (`base` vs `secondary`), illustrations | Webflow export |
| Nav *links*, current-page state, contact email, locale switcher, favicons | `apps/web/src/lib/marketing-nav.ts` + `marketing-chrome.ts` |

To add, remove, or rename a marketing nav item, edit `MARKETING_NAV_ITEMS` in `marketing-nav.ts`. Serve-time rewrite preserves each page’s Webflow classes (homepage vs inner-page variant) and marks the active route, including `/blog/[slug]` → Blog and `/explore` → Explore.

| Path | Role |
|------|------|
| `design/webflow-export/` | Visual templates — **Eatery Marketing Website** Webflow export |
| `apps/web/public/marketing/` | Synced static assets (generated; do not edit by hand) |
| `apps/web/src/app/(marketing)/**/route.ts` | Serves HTML for `/`, `/blog`, `/features`, `/explore`, etc. |
| `apps/web/src/lib/marketing-nav.ts` | Canonical nav + footer contact |
| `apps/web/src/lib/marketing-chrome.ts` | Injects shared chrome onto every HTML response |
| `apps/web/src/lib/marketing-html-response.ts` | Blog injection, SEO, locale, chrome finalize |

### Import your Webflow export (required once)

```bash
cd ~/page-builder
git pull origin cursor/replace-marketing-webflow-ffbe
pnpm import:eatery-export "/Users/mac/Downloads/Eatery Marketing Website"
rm -rf apps/web/.next
pnpm dev
```

If the site still shows **Nexbet** or English hero text, the wrong export is in `design/webflow-export/`. Re-run the import command above.

### Route mapping

| URL | Template |
|-----|----------|
| `/` | `index.html` + blog carousel from sheet |
| `/features`, `/pricing`, `/contact`, `/blog` | Matching `.html` when present; else `/#section` on homepage |
| `/explore` | `pricing.html` (secondary navbar) with the directory section injected |
| `/blog/[slug]` | `detail_blog.html` + sheet post body |

```bash
pnpm test:marketing-chrome
```

verifies every page type gets the same four nav links and the correct current item.

## Language / English translation

Vietnamese is the default (Webflow export HTML). English uses `?lang=en` and a translation manifest:

| File | Purpose |
|------|---------|
| `apps/web/src/lib/marketing-i18n-manifest.json` | Vietnamese → English string pairs |
| `scripts/extract-marketing-strings.mjs` | Crawl HTML and find untranslated strings |
| `scripts/test-marketing-i18n.mjs` | Verify EN pages have no leftover Vietnamese |

After importing your Webflow export:

```bash
pnpm import:eatery-export "/Users/mac/Downloads/Eatery Marketing Website"
pnpm test:marketing-i18n
```

If new Vietnamese strings appear, they are added to the manifest as `null`. Translate them in `marketing-i18n-manifest.json`, then re-run the test.


```env
BLOG_GOOGLE_SHEET_ID=1tZQ1YEW-NnShU7yTZqNYRhO13EpBxwyOqAVqLvgNdUg
```

See sheet column docs in the previous version of this file — Name, Slug, Collection ID, Item ID, Overview (HTML body), etc.

## Vercel / Supabase

Unchanged — see env vars in repo `.env.example`.

## Local development

Single host `http://localhost:3000` — marketing and app routes together. No subdomain split locally.
