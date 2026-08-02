# Orders history — ops setup (migration, push, cron)

Do these **in order** after deploying PR #24 (or the `cursor/orders-explore-nav-ffbe` branch).

---

## 1. Run the migration in Supabase

This creates `order_events`, `push_subscriptions`, team RLS on orders, and the retention function.

### Steps

1. Open your repo file: `supabase/migrations/046_order_events_history.sql`  
   (GitHub: branch `cursor/orders-explore-nav-ffbe` → that path → **Raw** → Select all → Copy)
2. Supabase Dashboard → **SQL Editor** → **New query**
3. Paste the **entire** file (should start with `-- 046_order_events_history.sql` and end with `$pub$;`)
4. Click **Run** (or Ctrl/Cmd+Enter)

### If you see `syntax error at end of input` / `LINE 0`

That almost always means Supabase ran an **empty** query — not a bug in the SQL file.

- Clear the editor completely and paste again from the **Raw** file (not from Slack/chat — smart quotes break SQL)
- Confirm the first line is a comment and the last line is `$pub$;`
- Do **not** run only a highlighted selection unless you know what you selected

### If you see another error

| Error | Likely cause | Fix |
|-------|----------------|-----|
| `function has_business_role does not exist` | Older migrations not applied | Run `036_service_requests.sql` or `042_service_requests_repair.sql` first |
| `relation service_requests does not exist` | Migration 036 missing | Apply `036_service_requests.sql` first |
| `policy … already exists` | Partial previous run | Safe to re-run; migration uses `DROP POLICY IF EXISTS` |

### After success

Optional check after success:

```sql
SELECT to_regclass('public.order_events');
SELECT to_regclass('public.push_subscriptions');
SELECT public.purge_orders_outside_retention(); -- safe; deletes only rows older than retention
```

---

## 2. Web Push (VAPID) — browser notifications

### What is VAPID?

When staff click **Enable notifications** on Live Orders, the browser asks your server to send alerts for new orders. Browsers require a **key pair** so only your app can send those messages:

- **Public key** — safe to expose to the browser (env: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`)
- **Private key** — secret, server-only (env: `VAPID_PRIVATE_KEY`)

You generate the pair **once**, store both in **Vercel environment variables**, and redeploy. You do **not** put them in Supabase or commit them to git.

### Generate keys (one time, on your laptop)

```bash
npx web-push generate-vapid-keys
```

Example output:

```
Public Key:  BNabc123...
Private Key: xyz789...
```

Copy each line’s value (without the `Public Key:` label if your terminal includes it).

### Save in Vercel

1. [Vercel](https://vercel.com) → your **page-builder / Eatery** project
2. **Settings → Environment Variables**
3. Add:

| Name | Value | Environments |
|------|--------|--------------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public Key from step above | Production (+ Preview if you test there) |
| `VAPID_PRIVATE_KEY` | Private Key | Production (+ Preview) |
| `VAPID_SUBJECT` | `mailto:you@eateryvn.com` | Production (+ Preview) — optional |

4. **Save**, then **Redeploy** the latest deployment (env vars are not picked up until redeploy)

### Local dev (optional)

Add the same three vars to `apps/web/.env.local` if you want to test push on localhost.

### How staff use it

1. Open **Live Orders** on a supported browser (Chrome/Edge/Firefox; iOS needs the site added to Home Screen in many cases)
2. Click **Enable notifications**
3. Accept the browser permission prompt

After that, **new guest orders** and **new table service requests** trigger a push. Status changes do not.

If keys are missing, the button still asks for permission but cannot fully subscribe/send — set the env vars first.

---

## 3. Retention hard-delete cron

Orders history keeps **this month + the previous 3 calendar months**. Older rows are **permanently deleted** by `purge_orders_outside_retention()` (orders, order events, service requests).

You must **schedule** that function to run automatically — otherwise old data never gets cleaned up.

### Option A — Supabase `pg_cron` (recommended)

Runs inside your database; no Vercel cron plan needed.

1. Supabase Dashboard → **Database → Extensions** → enable **pg_cron** (if not already)
2. SQL Editor → run **once**:

```sql
SELECT cron.schedule(
  'purge-orders-retention',
  '15 3 * * *',
  $$SELECT public.purge_orders_outside_retention();$$
);
```

That runs every day at **03:15 UTC**.

Verify:

```sql
SELECT jobid, jobname, schedule FROM cron.job;
```

Manual test (safe — only deletes data older than retention):

```sql
SELECT public.purge_orders_outside_retention();
```

### Option B — Vercel Cron → app route

Use this if you prefer the app to trigger cleanup or `pg_cron` is unavailable.

1. In Vercel env vars, add `CRON_SECRET` = a long random string (e.g. from a password generator)
2. Add `apps/web/vercel.json` (or merge crons into existing file):

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

3. Deploy. The route is `POST /api/cron/purge-orders` and checks `Authorization: Bearer <CRON_SECRET>`.

Manual test:

```bash
curl -X POST "https://app.eateryvn.com/api/cron/purge-orders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Note:** Vercel Hobby has limited cron support; Supabase `pg_cron` is simpler for a daily DB job.

---

## Checklist

- [ ] Migration `046_order_events_history.sql` ran successfully
- [ ] VAPID public + private keys in Vercel, redeployed
- [ ] Daily purge scheduled (`pg_cron` or Vercel cron + `CRON_SECRET`)
- [ ] Staff can open Live Orders → History (owner/manager) and enable notifications
