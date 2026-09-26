# Launch readiness plan

Pre-launch audit for paid-ads traffic. Every item below was verified against the code at the
cited lines. Items marked **[reported]** came out of the audit sweep but were not individually
re-verified — confirm before spending time on a fix.

Work top to bottom. Phase 1 gates the launch; Phases 2–3 should land before ad spend ramps;
Phases 4–6 can ship during the ramp.

---

## Phase 0 — Establish the baseline (do this first)

You cannot tell whether a fix worked without a before-number. Half a day of measurement saves
repeated guessing later.

| Check | How | What to do with the result |
|---|---|---|
| Real page speed | Run PageSpeed Insights (mobile) on the live storefront `/{slug}` and `/{slug}/order`. Record LCP, TTFB, TBT. | TTFB > 800ms → Phase 3 items 3.1–3.3 are the cause. TBT > 300ms → 3.5. |
| Slowest server routes | Vercel dashboard → project → Observability → Routes, sort by p75 duration. | Any route > 1s p75 goes on the fix list with its own line item. |
| Slowest DB queries | Supabase → Database → Query Performance, sort by total time. | Expect `page_views` aggregates at the top; confirms 3.3. |
| Error volume | Vercel → Logs, filter `level:error` for the last 7 days. | Every recurring error becomes a Phase 2 item. Unhandled `PGRST116` confirms 2.4. |
| Actual AI cost | Google AI Studio → billing, divide last month's spend by number of translate runs. | Compare against the per-run revenue in Phase 4. This replaces the estimate. |

Write the five numbers down. Re-measure after Phase 3 and Phase 4.

---

## Phase 1 — Launch blockers

These are security and money-correctness defects. Do not run ads until all four are closed.

### 1.1 `publishing_settings` is readable by the public anon key

**Evidence:** `supabase/migrations/002_rls_policies.sql:87-89` creates
`"Anyone can view publishing settings" ... USING (true)`. `004_fix_rls_recursion.sql:72` explicitly
keeps it. `027_comprehensive_rbac.sql:164` later adds a team-scoped SELECT policy but never drops
the open one — and Postgres ORs permissive policies together, so the open policy still wins.

**Impact:** Anyone with the public anon key (it ships in the browser bundle) can read every
tenant's row: unpublished draft snapshots, Google Analytics / Facebook / TikTok pixel IDs, Search
Console verification tokens, and custom domains.

**How to check:**
```bash
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/publishing_settings?select=business_id,custom_domain,google_analytics_id" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```
If this returns rows for businesses you don't own, the hole is open.

**Fix:** New migration that drops the open policy and replaces it with a published-only public
read. The storefront only needs published rows; `[slug]/page.tsx` calls `notFound()` when the row
is missing, so a restrictive policy degrades correctly.

```sql
DROP POLICY IF EXISTS "Anyone can view publishing settings" ON public.publishing_settings;

CREATE POLICY "Public can view published storefront settings"
  ON public.publishing_settings FOR SELECT
  TO anon, authenticated
  USING (published = true OR order_published = true);
```

**Done when:** the curl above returns only published businesses, and a logged-out visit to a
published storefront and its `/order` page still renders.

**Then:** audit the other `USING (true)` policies from `002_rls_policies.sql` the same way —
this was almost certainly not the only one.

---

### 1.2 Custom-domain server actions run privileged work without an ownership check

**Evidence:** all in `apps/web/src/app/actions/page-builder.ts` (the file is `'use server'`, so
each export is a callable HTTP endpoint):

| Action | Line | Gap |
|---|---|---|
| `getCustomDomainSetupAction` | 792 | **No auth check at all.** Uses the admin client, and can clear `custom_domain_verified` and issue a credit refund. |
| `connectCustomDomainAction` | 852 | `getUser()` only. Refunds credits and mutates the Vercel project before any ownership check. |
| `disconnectCustomDomainAction` | 914 | `getUser()` only. Refunds credits and removes the domain from Vercel. |
| `verifyDnsAction` | 951 | `getUser()` only. Admin-writes `custom_domain_verified = true`. |

`assertOwnerOrManager` already exists at `apps/web/src/lib/business-auth.ts:40` and is used
correctly elsewhere (for example `purchaseLocaleAction` at `business-locales.ts:117`).

**Impact:** an attacker who learns a `businessId` (a UUID, exposed in various client payloads) can
take a competitor's custom domain offline and mint credit refunds into their ledger.

**How to check:** in a browser logged in as an unrelated account, call the action with another
business's id and confirm the side effects happen. Or simply read the four functions — the check
is either present or it isn't.

**Fix:** at the top of every one of these, after `getUser()`:
```ts
const access = await assertOwnerOrManager(supabase, user.id, businessId)
if (!access.ok) return { success: false, error: access.error }
```
`getCustomDomainSetupAction` needs the `getUser()` call added too. No admin client, refund, or
Vercel call may run before that check passes.

**Done when:** all four actions reject a foreign `businessId` before any side effect.

**Then:** apply the same guard to every other mutating action in `page-builder.ts`
(`savePageBlocksAction`, `togglePublishAction`, `saveThemeAction`, `savePublishingSettingsAction`,
and the order-page savers). RLS currently blocks the cross-tenant DB write, so those are
defence-in-depth rather than live holes — but the pattern should be uniform so the next reviewer
doesn't have to reason about which ones are safe.

---

### 1.3 Credit deduction is a read-modify-write, so it can double-charge

**Evidence:** `apps/web/src/lib/credits-internal.ts:32-53` reads `balance`, subtracts in JS, then
writes the new value. `grantCreditsInternal` at `:80-97` has the same shape. The
`CHECK (balance >= 0)` in `022_credit_system.sql:7` stops the balance going negative but does not
stop a lost update.

**Impact:** two concurrent billing calls both read 10, both write 2, and two `-8` transactions land.
The customer is charged twice and the ledger disagrees with the balance. This is reachable today
because billing runs opportunistically on page load — two dashboard tabs is enough. Callers include
custom-domain billing, storage billing, locale purchase and renewal, and AI translate.

**How to check:** in staging, fire two `purchaseLocaleAction` calls for the same business
simultaneously, then compare `credit_balances.balance` against `SUM(credit_transactions.amount)`.
They should be equal.

**Fix:** move the debit into a `SECURITY DEFINER` RPC that locks the row, following the pattern
already used by `fulfill_credit_order` in `043_lock_down_credit_billing.sql`:

```sql
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_business_id uuid, p_amount integer, p_description text
) RETURNS TABLE (ok boolean, balance integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_balance integer;
BEGIN
  SELECT cb.balance INTO v_balance FROM credit_balances cb
    WHERE cb.business_id = p_business_id FOR UPDATE;
  IF v_balance IS NULL OR v_balance < p_amount THEN
    RETURN QUERY SELECT false, coalesce(v_balance, 0); RETURN;
  END IF;
  UPDATE credit_balances SET balance = balance - p_amount WHERE business_id = p_business_id;
  INSERT INTO credit_transactions (business_id, amount, description)
    VALUES (p_business_id, -p_amount, p_description);
  RETURN QUERY SELECT true, v_balance - p_amount;
END $$;

REVOKE ALL ON FUNCTION public.deduct_credits(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, integer, text) TO service_role;
```
Then `deductCreditsInternal` becomes a thin wrapper over the RPC. Do the same for grants.

**Done when:** a concurrency test produces exactly one debit, and balance equals the transaction sum.

**Then:** add a reconciliation query you can run monthly:
`SELECT business_id FROM credit_balances cb WHERE cb.balance <> (SELECT COALESCE(SUM(amount),0) FROM credit_transactions t WHERE t.business_id = cb.business_id);`

---

### 1.4 Public order creation has no rate limit and no idempotency

**Evidence:** `apps/web/src/app/actions/orders.ts:10-17` — `createOrderAction` is an unauthenticated
`'use server'` export using `createAdminClient()`. This is correct by design (diners have no
account), but there is no throttle and no dedupe key. The order row is inserted at `:50` and the
items at `:77`; if the items insert fails, the order header is left behind with no rollback.

**Impact:** two failure modes. A double-tap or a retry on flaky restaurant Wi-Fi creates duplicate
orders in the kitchen display. And anyone can script the endpoint to flood a restaurant's board
during service, which is the kind of thing that gets a venue to churn on day one.

**How to check:** double-click "Place order" on a throttled connection and count the rows in
`orders`. Then `for i in {1..50}; do curl ...; done` against staging and see whether all 50 land.

**Fix, in order:**
1. Rollback: if the `order_items` insert fails, delete the order row before returning the error.
   Better, move both inserts into one RPC so it's atomic.
2. Idempotency: have the client generate a UUID per checkout attempt, add a nullable
   `client_token` column with a unique index, and let a duplicate insert resolve to the existing
   order instead of erroring.
3. Rate limit: cap orders per `business_id` + IP per minute. Vercel's firewall rules or a small
   Postgres counter both work; the point is that an unauthenticated admin-client write is exposed.

**Done when:** rapid double-submit yields one order, and a burst script is rejected.

---

## Phase 2 — Stability (before ad spend ramps)

### 2.1 There are no error boundaries anywhere

**Evidence:** `find src/app -name "error.tsx"` returns nothing. Only `src/app/not-found.tsx` exists.

**Impact:** any unhandled throw renders the raw Next.js 500 page. On a storefront that is a paid
click landing on a broken page.

**Fix:** add `error.tsx` for `(dashboard)`, `[slug]`, and `[locale]/[slug]`, plus a root
`global-error.tsx`. The storefront one should be branded and offer a retry, not a stack trace.

---

### 2.2 `savePageBlocksAction` deletes every block before inserting the new set

**Evidence:** `page-builder.ts:156-193` — `DELETE ... WHERE business_id = ?` at :156, then
`INSERT` at :190. Between the two there is no transaction.

**Impact:** if the insert fails (oversized payload, timeout, constraint), the business loses its
entire page. The user sees an error and their page is gone.

**Fix:** wrap delete + insert in a single RPC so it commits or rolls back as one unit.

**Done when:** an induced insert failure leaves the previous blocks intact.

---

### 2.3 Locale purchase debits credits before the entitlement is written

**Evidence:** `business-locales.ts:143` deducts, then the insert/update at `:165-180` returns
`{ success: false }` on error without refunding.

**Impact:** customer pays 20 credits and gets no language. Same shape as 1.3 — the fix is to make
debit and grant one transaction.

**Related:** `ai-translate.ts:143-164` saves the translations first and debits second; if the debit
fails it still returns `success: true` with `creditsCharged: 0`. That is a free translation and a
direct API cost leak. Debit inside the same transaction as the save.

---

### 2.4 Public storefront pages use `.single()` and can 500 on missing rows

**Evidence:** `[slug]/page.tsx:120-132` fetches the business and then `publishing_settings` with
`.single()`. A business with no publishing row (partial onboarding) throws `PGRST116` rather than
returning null, which becomes an unhandled 500 instead of a 404.

**Fix:** `.maybeSingle()` plus an explicit `notFound()`. Do the same in `[slug]/order/page.tsx` and
both locale variants.

---

### 2.5 Managers cannot edit categories or variants

**Evidence:** `menu.ts:68-76` (`userOwnsCategoryBusiness`) and `:100-120` (the two variant guards)
check `businesses.owner_id` only. `userOwnsItemBusiness` at `:78-98` correctly falls back to a
`business_members` role check — so items work and categories don't.

**Impact:** a manager renaming a category gets "Forbidden". Confusing, and it looks like a broken
product rather than a permission model.

**Fix:** route all four guards through `assertOwnerOrManager`.

---

### 2.6 Billing only runs when the owner visits the right page

**Evidence:** there is no billing cron — `src/app/api/cron/` contains only `purge-orders`. Custom
domain renewal fires from `publishing/page.tsx:37`, locale renewal from `publishing/page.tsx:39`
and `settings/languages/page.tsx:29`, storage from `gallery.ts:139-141`.

**Impact:** an owner who never opens Publishing keeps their custom domain and extra languages
running without ever being charged again. That is unbilled revenue that scales with how happy your
customers are — the ones who set it up and never log back in cost you the most.

**Fix:** add a daily Vercel cron that walks businesses with `custom_domain_verified = true`,
active `business_locales`, or storage subscriptions, and runs the same billing functions. Keep the
opportunistic path as a safety net.

**Done when:** a test business with a verified domain gets charged on schedule with zero dashboard
visits.

---

### 2.7 Billing helpers report success when the underlying write failed

**Evidence:** `credits.ts:318-322` and `:330-332` (`billPageViewsIfDueAction`) return
`{ success: true }` on RPC error. `business-locales.ts:290-293` does the same.
`credits.ts:290-295` and `:376-384` deduct credits and then update `billed_until` /
`next_billing_date` without checking that update for an error.

**Impact:** the dangerous one is the last: if the debit succeeds and the date update fails, the
customer is charged again on the next page load. Silent double-billing.

**Fix:** check every update error; make deduct-and-advance a single transaction (falls out of 1.3);
return real failures so they show up in logs.

---

## Phase 3 — Performance (this is the "slow" you're feeling)

Ordered by expected effect on the numbers from Phase 0.

### 3.1 Every page view billing call aggregates the whole table

**Evidence:** `supabase/migrations/056_page_views_locale.sql:83-86` runs
`SELECT COALESCE(SUM(count),0) FROM page_views WHERE business_id = ...` inside the RPC that
`api/view/[slug]/route.ts:50-55` calls on **every storefront view**. Separately,
`page-builder.ts:743-748` pulls every `page_views` row for the business into Node and sums it in
JavaScript to display the lifetime total.

**Impact:** cost grows with traffic, so this gets worse exactly when ads start working. This is the
single most likely source of the slowdown you're noticing, and it burns Supabase CPU.

**Fix:** keep a running total column (for example `page_views_total` on `credit_balances`) and
increment it, so both paths become O(1). Until then, pass `{ reconcileBilling: false }` on the
overview page, which already exists as an option.

**Done when:** the view endpoint's p75 is flat as row count grows.

---

### 3.2 The middleware authenticates every anonymous storefront request

**Evidence:** `proxy.ts:167-169` calls `supabase.auth.getUser()` unconditionally, and the matcher at
`:218-222` covers essentially everything except `_next` and a few static files.

**Impact:** every paid ad click pays for a Supabase Auth round trip at the edge before rendering
starts. Pure TTFB tax on the exact traffic you're buying.

**Fix:** skip `getUser()` when the request has no Supabase session cookie and the path is not a
dashboard/auth route. Storefront requests then do zero auth work.

**Also:** the custom-domain lookup at `:73-82` does up to two sequential RPCs per request. Collapse
to one RPC that accepts both host candidates, and cache the host→slug mapping briefly.

---

### 3.3 Storefront pages are fully dynamic and fetch the same rows several times

**Evidence:** `generateMetadata` in `[slug]/page.tsx:49-63` fetches the business and publishing
rows, and the page body fetches them again at `:120-132`. The locale route resolves locale access
three separate times (`[locale]/[slug]/page.tsx:17-20`, `:80-81`, and again inside `SlugPage`).
`loadStoreLocaleAccess` (`lib/store-locale-access.ts:16-41`) runs its three queries sequentially.
Nothing sets `revalidate`, and `createClient()` reads cookies, which forces dynamic rendering.

**Impact:** roughly 15–18 server round trips to render one storefront page that changes only when
the owner publishes.

**Fix, in order:**
1. Wrap the shared loaders in `React.cache()` so metadata and body share one fetch.
2. `Promise.all` the independent queries inside `loadStoreLocaleAccess`.
3. Move published storefront reads onto a non-cookie client and add `revalidate`, invalidating on
   publish. `revalidateLiveStore` already exists in `page-builder.ts` to hook into.

---

### 3.4 Missing indexes

```sql
CREATE INDEX IF NOT EXISTS publishing_settings_custom_domain_lower_idx
  ON publishing_settings (lower(custom_domain))
  WHERE custom_domain IS NOT NULL AND custom_domain_verified = true;

CREATE INDEX IF NOT EXISTS menu_categories_business_sort_idx ON menu_categories (business_id, sort_order);
CREATE INDEX IF NOT EXISTS menu_items_business_sort_idx      ON menu_items (business_id, sort_order);
```
The first backs the custom-domain lookup that now runs in middleware on every request to a
customer domain (`030_custom_domain_and_credits_fixes.sql:17`).

---

### 3.5 The client bundle carries dashboard machinery onto storefronts

**Evidence:** `app/layout.tsx:39-49` mounts `QueryProvider` for every route including marketing and
storefront pages. The storefront render tree is almost entirely `'use client'` — `MenuGridRender`
(~900 lines with cart logic) ships even on the browse-only landing page (`[slug]/page.tsx:262,367`).

**Fix:** move `QueryProvider` into `(dashboard)/layout.tsx`. Then split the browse-only menu render
from the interactive ordering one so landing pages ship markup instead of cart code.

---

### 3.6 Duplicate client fetches on every dashboard navigation

**Evidence:** the layout already server-fetches businesses (`layout.tsx:36`), but `useBusiness.ts:5-22`
sets `staleTime: 5_000` without `initialDataUpdatedAt`, so React Query immediately refetches
`/api/user-businesses`. `useCreditBalance` (`useCredits.ts:9-20`) fires a server action from the
sidebar on every page.

**Fix:** pass `initialDataUpdatedAt: Date.now()` and raise `staleTime`; feed the credit balance from
layout SSR and invalidate only after purchases (the invalidation hooks already exist).

---

### 3.7 Sequential awaits that should be parallel

`(dashboard)/layout.tsx:17-39` (profile, active business, all businesses, dictionary),
`business-server.ts:98-106` (owned then member businesses), `dashboard/page.tsx:25-35` (analytics
blocks the count queries), `translations.ts:67-81`, and the variant chunk loops in
`[slug]/page.tsx:205-217` and `[slug]/order/page.tsx:159-170`. Each is a small `Promise.all` and
each removes a round trip from a page you load constantly.

---

## Phase 4 — Pricing

### 4.1 What AI translate actually costs today

Charging is per run, by word count of the untranslated fields in scope:
`estimateTranslateCredits` in `credit-packs.ts:26-29` is `max(1, ceil(words / 300))`, with
`AI_TRANSLATE_WORDS_PER_CREDIT = 300` at `:24`.

For the typical full-page job (~1,200 words, per `docs/translation-ui-plan.md:62`):

| | Value |
|---|---|
| Credits charged | 4 |
| Revenue at the 100-pack rate (900₫/credit) | 3,600₫ ≈ $0.14 |
| Gemini API calls | 2 (600-word chunks, `ai-translate.ts:13`) |

Gemini 3.6 Flash list price is **$1.50/M input and $7.50/M output, and output includes thinking
tokens**. `gemini-translate.ts:54-58` calls `generateObject` with no thinking configuration, so the
model runs at its default medium thinking level and you pay for that reasoning at the output rate.
That puts a typical run somewhere around $0.03–0.05, i.e. a 3–5× margin rather than the ~18× the
300-words-per-credit figure was originally chosen for. Replace this estimate with the real number
from Phase 0 before deciding.

### 4.2 Do these two things, in this order

**First, turn thinking down.** Translation is a mechanical task; medium thinking buys nothing here
and you pay for it at $7.50/M. Pass a minimal thinking budget in the `generateObject` call at
`gemini-translate.ts:54-58`. This is the largest single lever on both cost and latency, and it
costs your customers nothing.

**Then raise the price modestly.** Change `AI_TRANSLATE_WORDS_PER_CREDIT` from `300` to `200` in
`credit-packs.ts:24`. That is a 50% increase, which matches "a bit":

| Job | Now | After |
|---|---|---|
| 1,200-word full translate | 4 credits (3,600₫) | 6 credits (5,400₫) |
| 300-word section | 1 credit (900₫) | 2 credits (1,800₫) |

A first full translate stays below one month of a language (20 credits) and well below a custom
domain (50 credits), so the feature still reads as cheap. The constant is the only place to change
— the estimate shown in the UI and the actual debit both derive from it. Check the marketing copy
in `marketing-i18n-manifest.json` for any hardcoded translate pricing before shipping.

Going to 150 words/credit (a full doubling) is defensible if the Phase 0 numbers come back worse
than the estimate above, but do it after the thinking fix, not instead of it.

### 4.3 Close the leaks around it

- Debit inside the save transaction so a failed debit can't hand out a free translation
  (`ai-translate.ts:143-164`, also listed in 2.3).
- Add a per-business rate limit on `applyAiTranslateAction`. There is none today, so a compromised
  account can run your Google bill up with no ceiling.
- Note that page views stop being billed when a balance hits zero while the site keeps serving
  (`041_page_view_billing.sql:67` charges `least(due, balance)`). Decide deliberately whether that
  backlog is forgiven or collected later — right now it is silently forgiven.

---

## Phase 5 — Diner conversion

These are the storefront issues most likely to cost you an order. Ad traffic makes each one
expensive.

| # | Issue | Evidence | Fix |
|---|---|---|---|
| 5.1 | Cart is in-memory only, so a refresh or a language switch empties it mid-order | `render/CartContext.tsx:4-6,49-50`; the switcher is a full navigation (`StoreLanguageSwitcher.tsx:74-86`) | Persist cart to `sessionStorage` keyed by business; hydrate on mount; clear after a successful order |
| 5.2 | The language switcher sits on top of the cart bar — both are `fixed bottom` at `z-40` | `StoreLanguageSwitcher.tsx:53-55` vs `OrderBottomBar.tsx:201-217` | Move the switcher into the header on `/order` |
| 5.3 | An unpublished store shows the generic marketing 404 to someone who just scanned a QR | `[slug]/order/page.tsx:103-108` → `not-found.tsx` | Branded "not taking orders right now" page |
| 5.4 | Order submit has no `try/catch`, so a network failure shows nothing at all | `CartDrawer.tsx:230-250` | Catch, toast a retry, keep the cart |
| 5.5 | Submit errors surface raw strings like "Order total mismatch" | `CartDrawer.tsx:246-248`, `validate-order-total.ts:24-25` | Map codes to diner-friendly copy with a "refresh menu" action |
| 5.6 | Quick-add gives no feedback, so diners tap twice | `MenuGridRender.tsx:807-809` | Toast or micro-animation on add |
| 5.7 | Empty menu shows the English string "No menu categories yet." | `MenuGridRender.tsx:690-695` | Distinct translated empty state, separate from the no-search-results copy |
| 5.8 | Menu cards are `div` + `onClick`; modal has no dialog role; icon buttons unlabelled; add buttons are 28px | `MenuGridRender.tsx:397-407,179-197,451`; `CartDrawer.tsx:329-334,55-60` | Real buttons, dialog semantics, `aria-label`s, 44px targets |
| 5.9 | No loading skeleton for `/order`; the `[slug]` one is a wide landing layout | only `[slug]/loading.tsx` exists | Add `[slug]/order/loading.tsx` shaped like the phone layout |
| 5.10 | Store titles inherit the "\| Eatery" template | `layout.tsx:17-20` | Return `title: { absolute: ... }` from store metadata |

---

## Phase 6 — Launch gate

Do not start ad spend until every line is checked.

- [ ] Anon key cannot read unpublished `publishing_settings` (1.1)
- [ ] All four custom-domain actions reject a foreign `businessId` (1.2)
- [ ] Concurrent debit test charges exactly once; balance equals transaction sum (1.3)
- [ ] Double-submit creates one order; burst script is throttled (1.4)
- [ ] Error boundaries render on a forced throw in dashboard and storefront (2.1)
- [ ] Billing cron charges a domain and a locale with no dashboard visit (2.6)
- [ ] Storefront mobile TTFB and LCP improved against the Phase 0 baseline (3.1–3.3)
- [ ] One real order placed end-to-end on a phone, on a custom domain, in both locales
- [ ] Cart survives a refresh and a language switch (5.1)
- [ ] AI translate cost per run re-measured after the thinking change (4.2)

### After launch

Watch these for the first two weeks: Vercel error rate and p75 route duration, Supabase query
performance top 10, the credit reconciliation query from 1.3, Google AI spend per translate run,
and the ratio of orders started to orders placed. The last one tells you whether Phase 5 worked.
