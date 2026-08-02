# Marketing site & app subdomain split

Production layout:

| Host | Purpose |
|------|---------|
| `eateryvn.com` (or `eatery.com`) | Marketing: `/`, `/pricing`, `/features`, `/contact`, `/blog`, **and public store pages** `/{slug}` |
| `app.eateryvn.com` | Application: login, dashboard, page builder, public menu pages (`/{slug}`) |

Both hosts point to the **same Vercel project**. Routing is handled in `apps/web/src/proxy.ts`.

## Marketing site = Webflow HTML only

There are **no React marketing pages**. Every marketing URL is served by a `route.ts` handler that returns your Webflow export HTML with:

- Blog posts injected from Google Sheets (by locale)
- VI | EN language switcher in the navbar
- English copy via `marketing-i18n.ts` when `?lang=en`
- Vietnamese = export HTML as-is (clean URLs)

| Path | Role |
|------|------|
| `design/webflow-export/` | Source of truth — your **Eatery Marketing Website** Webflow export |
| `apps/web/public/marketing/` | Synced static assets (generated; do not edit by hand) |
| `apps/web/src/app/(marketing)/**/route.ts` | Serves HTML for `/`, `/blog`, `/features`, etc. |
| `apps/web/src/lib/marketing-html-response.ts` | Blog injection, SEO, locale switcher, EN translation |

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
| `/blog/[slug]` | `detail_blog.html` + sheet post body |

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
