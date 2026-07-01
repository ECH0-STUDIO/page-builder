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
| `apps/web/src/components/marketing/WebflowPage.tsx` | Renders export + runs Webflow/GSAP scripts |

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
| `/features` | Redirect → `/#features` |
| `/blog` | Redirect → `/#blog` |
| `/pricing`, `/contact` | Redirect → `/` (until separate Webflow pages exist) |

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

## Blog (future)

Options to decide later:

- Keep Webflow CMS export + `detail_blog.html` template
- Google Sheets (see previous setup below)
- MDX in the repo

### Google Sheets blog (optional, currently disabled)

Create a Google Sheet with a tab named **Posts** and columns:

| slug | title | excerpt | date | author | body | published |
|------|-------|---------|------|--------|------|-----------|
| my-first-post | Hello | Short summary | 2026-03-01 | Eatery Team | Paragraph one...\n\nParagraph two | TRUE |

Set `BLOG_GOOGLE_SHEET_ID` in Vercel when re-enabling.

## Contact form

Set where messages go:

```env
CONTACT_EMAIL=hello@eateryvn.com
RESEND_API_KEY=re_...
NEXT_PUBLIC_SENDER_EMAIL=noreply@eateryvn.com
```

Uses Resend (same as team invites). Without `RESEND_API_KEY`, submissions log to the server console in dev.
