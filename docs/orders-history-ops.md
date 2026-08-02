# Orders history — ops setup (migration, push, cron)

## 1. Run the migration in Supabase

1. Open **Supabase Dashboard → SQL Editor**
2. Paste the full contents of `supabase/migrations/046_order_events_history.sql`
3. Click **Run**

If you still see `syntax error at end of input / LINE 0`, the editor received an empty query — clear the editor, re-copy the file from the repo (not from chat with fancy dashes), and run again.

Optional check after success:

```sql
SELECT to_regclass('public.order_events');
SELECT to_regclass('public.push_subscriptions');
SELECT public.purge_orders_outside_retention(); -- safe; deletes only rows older than retention
```

---

## 2. Web Push (VAPID) — browser notifications

Push only works after you add VAPID keys to the **Vercel** project (Production + Preview if you test there).

### Generate keys (one time)

On your machine:

```bash
npx web-push generate-vapid-keys
```

You get something like:

```
Public Key:  BNxxx...
Private Key: yyy...
```

### Add env vars in Vercel

Project → **Settings → Environment Variables**:

| Name | Value | Notes |
|------|--------|--------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | the **Public Key** | Exposed to the browser (needed for subscribe) |
| `VAPID_PRIVATE_KEY` | the **Private Key** | Server only — never commit |
| `VAPID_SUBJECT` | `mailto:you@yourdomain.com` | Contact for push services (optional; app has a default) |

Redeploy after saving env vars.

### How staff use it

1. Open **Live Orders** on a supported browser (Chrome/Edge/Firefox; iOS needs the site added to Home Screen in many cases)
2. Click **Enable notifications**
3. Accept the browser permission prompt

After that, **new guest orders** and **new table service requests** trigger a push. Status changes do not.

If keys are missing, the button still asks for permission but cannot fully subscribe/send — set the env vars first.

---

## 3. Retention hard-delete cron

The SQL function `purge_orders_outside_retention()` deletes orders / events / service requests older than **current month + previous 3 months**.

### Option A — Supabase `pg_cron` (recommended)

In SQL Editor (requires `pg_cron` enabled on the project):

```sql
-- Run daily at 03:15 UTC
SELECT cron.schedule(
  'purge-orders-retention',
  '15 3 * * *',
  $$SELECT public.purge_orders_outside_retention();$$
);
```

Check jobs:

```sql
SELECT * FROM cron.job;
```

### Option B — Vercel Cron → app route

1. Add env var `CRON_SECRET` in Vercel (long random string).
2. Add or merge into `apps/web/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/purge-orders",
      "schedule": "15 3 * * *"
    }
  ]
}
```

3. In the cron route, Vercel sends the request; protect it by also configuring the Authorization header if your plan supports it, **or** set `CRON_SECRET` and call manually/with an external scheduler:

```bash
curl -X POST "https://YOUR_APP_DOMAIN/api/cron/purge-orders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Note: On Vercel Hobby, crons are limited; Pro is more reliable for daily jobs. Supabase `pg_cron` avoids depending on the app host.
