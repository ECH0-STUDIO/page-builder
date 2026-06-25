# Eatery Page Builder

Restaurant page builder and dashboard for [eateryvn.com](https://www.eateryvn.com), built with Next.js, Supabase, and Vercel.

## Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** Supabase (Postgres, Auth, Storage)
- **Hosting:** Vercel
- **Payments:** PayOS (credit purchases)
- **Email:** Resend (team invites)

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 10+

## Quick start

```bash
git clone https://github.com/ECH0-STUDIO/page-builder.git
cd page-builder
pnpm install
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local with your Supabase keys (see below)
pnpm dev:web
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy the example file and fill in secrets:

```bash
cp apps/web/.env.example apps/web/.env.local
```

| Variable | Required | Where to get it |
|----------|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | [Supabase API settings](https://supabase.com/dashboard/project/lwupkuhygzybnkoaoenr/settings/api) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Same page — `anon` / `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Same page — `service_role` key (server only) |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` locally, `https://www.eateryvn.com` in production |
| `NEXT_PUBLIC_SITE_URL` | Yes | Same as `NEXT_PUBLIC_APP_URL` |
| `RESEND_API_KEY` | No | [Resend dashboard](https://resend.com/api-keys) |
| `NEXT_PUBLIC_SENDER_EMAIL` | No | Verified sender domain in Resend |
| `PAYOS_*` | No | [PayOS dashboard](https://my.payos.vn) |

**Shortcut:** copy all values from your Vercel project → Settings → Environment Variables.

## Platform admin (you, not business owners)

### Discount codes

Business owners can **enter** a code when buying credits. Only you create codes — in the **Supabase SQL editor**, not in the app:

```sql
INSERT INTO discount_codes (code, discount_type, discount_value, max_uses, is_active)
VALUES ('FREEPROMO', 'percent', 100, 5, true);
```

See `supabase/scripts/create_discount_code.sql` for examples. Use `100` percent for free credit packages (0đ checkout).

### Custom domains

Two separate steps:

1. **Business owner** (in app): adds domain → configures DNS → clicks Verify. App checks DNS, deducts credits, routes traffic to their page.
2. **You** (in Vercel dashboard): add the same domain under Project → Settings → Domains so Vercel accepts HTTPS traffic for that hostname.

The app does not register domains with Vercel automatically — you add each customer domain once in Vercel when they connect.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev:web` | Start Next.js dev server |
| `pnpm build:web` | Production build |
| `pnpm lint` | Run ESLint |

## Repository layout

```
apps/web/          Next.js application
supabase/migrations/   Database schema (applied to remote Supabase)
```

## Supabase

This project uses a hosted Supabase instance (`lwupkuhygzybnkoaoenr`). Migrations in `supabase/migrations/` document the schema; apply new migrations via the Supabase SQL editor or CLI against the remote project.

## Deployment

Production deploys automatically from the `main` branch via Vercel. Environment variables must be configured in the Vercel dashboard.
