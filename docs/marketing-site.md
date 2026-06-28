# Marketing site & app subdomain split

Production layout:

| Host | Purpose |
|------|---------|
| `eateryvn.com` (or `eatery.com`) | Marketing: `/`, `/pricing`, `/features`, `/contact`, `/blog`, **and public store pages** `/{slug}` |
| `app.eateryvn.com` | Application: login, dashboard, page builder, public menu pages (`/{slug}`) |

Both hosts point to the **same Vercel project**. Routing is handled in `apps/web/src/proxy.ts`.

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

## Blog via Google Sheets (free)

No CMS required. Create a Google Sheet with a tab named **Posts** and columns:

| slug | title | excerpt | date | author | body | published |
|------|-------|---------|------|--------|------|-----------|
| my-first-post | Hello | Short summary | 2026-03-01 | Eatery Team | Paragraph one...\n\nParagraph two | TRUE |

- **slug:** URL path (`/blog/my-first-post`)
- **body:** Use blank lines between paragraphs (Alt+Enter in Sheets)
- **published:** `TRUE` or `FALSE`

Share: **Anyone with the link can view**

Copy the sheet ID from the URL:
`https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`

Set in Vercel:

```env
BLOG_GOOGLE_SHEET_ID=your_sheet_id
```

Without this variable, sample blog posts are shown.

## Contact form

Set where messages go:

```env
CONTACT_EMAIL=hello@eateryvn.com
RESEND_API_KEY=re_...
NEXT_PUBLIC_SENDER_EMAIL=noreply@eateryvn.com
```

Uses Resend (same as team invites). Without `RESEND_API_KEY`, submissions log to the server console in dev.
