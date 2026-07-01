# Marketing site & app subdomain split

Production layout:

| Host | Purpose |
|------|---------|
| `eateryvn.com` (or `eatery.com`) | Marketing: `/`, `/pricing`, `/features`, `/contact`, `/blog`, **and public store pages** `/{slug}` |
| `app.eateryvn.com` | Application: login, dashboard, page builder, public menu pages (`/{slug}`) |

Both hosts point to the **same Vercel project**. Routing is handled in `apps/web/src/proxy.ts`.

## Marketing site source (Webflow export)

The marketing homepage is served from a **Webflow HTML export**, not hand-built React sections.

| Path | Role |
|------|------|
| `design/webflow-export/` | Source of truth — drop your Webflow zip contents here |
| `apps/web/public/marketing/` | Synced static assets (generated; do not edit by hand) |
| `apps/web/src/lib/marketing-webflow.ts` | Loads HTML, rewrites asset paths for Next.js |
| `apps/web/src/app/(marketing)/route.ts` | Serves full Webflow HTML for `/` (no React) |
| `scripts/marketing-html-postprocess.mjs` | Fixes paths, links, hero image at sync time |

### Update the marketing site from Webflow

1. In Webflow: **Export code** (or use the Designer export).
2. Replace the contents of `design/webflow-export/` with your export folder (e.g. copy from `Eatery Marketing Website` on your Mac).
3. From the repo root:

```bash
pnpm sync:marketing
```

4. Commit `design/webflow-export/` and `apps/web/public/marketing/` (or run sync in CI before build).
5. Restart the dev server and open `http://localhost:3000/`.

### Route mapping

| URL | Behavior |
|-----|----------|
| `/` | Webflow `index.html` |
| `/features`, `/pricing`, `/contact`, `/blog` | Matching `.html` file when present in the export; otherwise fallback redirect |
| `/blog/[slug]` | `detail_blog.html` template when present |

Navbar links in the export should use `features.html`, `pricing.html`, etc. — they are rewritten to `/features`, `/pricing`, etc. automatically.

### Hero / image assets

Webflow `srcset` paths and filenames with spaces are rewritten to `/marketing/images/...`. If a hero image is missing after sync, confirm the file exists under `design/webflow-export/images/` and re-run `pnpm sync:marketing`. Export typos (hyphen vs space in filenames) are auto-corrected for the known hero asset pattern.

Blog posts from Google Sheets are **paused** while we decide the blog approach. Old React marketing components were removed.

## Vercel setup

1. **Domains** → add both:
   - `eateryvn.com` (+ `www` redirect to apex if you prefer)
   - `app.eateryvn.com`

2. **Environment variables** (Production):

```env
NEXT_PUBLIC_MARKETING_URL=https://eateryvn.com
NEXT_PUBLIC_APP_URL=https://app.eateryvn.com
NEXT_PUBLIC_SITE_URL=https://eateryvn.com
```

**Critical:** `NEXT_PUBLIC_APP_URL` must be `https://app.eateryvn.com` — never `eateryvn.com` or `www.eateryvn.com`. If misconfigured, `www.eateryvn.com` redirects in a loop (`/` → `/login` → `/login` …).

3. Redeploy after changing env vars.

## Supabase Auth URLs

[URL Configuration](https://supabase.com/dashboard/project/lwupkuhygzybnkoaoenr/auth/url-configuration):

- **Site URL:** `https://app.eateryvn.com` (auth lives on the app)
- **Redirect URLs:**
  ```
  https://app.eateryvn.com/api/auth/callback
  https://app.eateryvn.com/**
  http://localhost:3000/api/auth/callback
  ```

## Local development

Leave both URLs as `http://localhost:3000` — marketing and app routes work on one host. No subdomain split locally.

## Blog (Google Sheets CMS)

The marketing blog is driven by a **Webflow CMS export** in Google Sheets. Export your Blog collection from Webflow (or maintain the sheet manually) and set:

```env
BLOG_GOOGLE_SHEET_ID=1tZQ1YEW-NnShU7yTZqNYRhO13EpBxwyOqAVqLvgNdUg
```

Share the sheet: **Anyone with the link can view**.

### Sheet columns (row 1 = header)

| Column | Used for |
|--------|----------|
| Name | Post title |
| Slug | URL: `/blog/{slug}` |
| Archived / Draft | Rows with `TRUE` are skipped |
| Published On / Date | Sort order and display date |
| Thumbnail | Hero + card image (absolute URL) |
| Summary | Excerpt and meta description |
| Avatar / Author / Role | Author block on post page |
| Social First / Second / Third | Share links (hidden if empty) |
| Category / Reading | Metadata row + card pill |
| Overview | Rich HTML body |

**Empty fields:** the connected UI block is hidden (Webflow `.hide` class).

**Images on Bunny CDN:** use full URLs like `https://ech0studio.b-cdn.net/...` or your custom CDN domain (`https://eateryvn.com/...`). Absolute URLs load on the dev server — the custom domain only matters if your sheet URLs use it.

### Routes

| URL | Template |
|-----|----------|
| `/` | Homepage blog carousel filled from sheet |
| `/blog` | `blog.html` collection list filled from sheet |
| `/blog/{slug}` | `detail_blog.html` filled per post |

Sync Webflow export after design changes:

```bash
pnpm sync:marketing
```

## Contact form

Set where messages go:

```env
CONTACT_EMAIL=hello@eateryvn.com
RESEND_API_KEY=re_...
NEXT_PUBLIC_SENDER_EMAIL=noreply@eateryvn.com
```

Uses Resend (same as team invites). Without `RESEND_API_KEY`, submissions log to the server console in dev.
