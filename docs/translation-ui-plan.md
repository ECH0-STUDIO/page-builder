# Translation UI + paid locales plan

**Status:** locked product direction — supersedes `docs/dual-language-ai-plan.md` (inline VI|EN tabs) and `docs/bilingual-plan.md` (CoW editor model).

**Branch target:** revert inline dual-language UX first, then build this model on top of existing `*_i18n` storage.

---

## 1. Product model (locked)

| Decision | Choice |
|----------|--------|
| Primary editing | **One** page builder, **one** menu, **one** order editor — primary locale only |
| Secondary locales | Purchased separately; edited in a dedicated **Translation UI** |
| Locale billing | **Monthly credits per locale** (not upfront unlock) |
| Which locales | **All supported storefront locales** — same product rules for each |
| Traffic billing | **Single shared credit pool** — page views aggregate across all locales (500 views = 1 credit, unchanged) |
| AI translate | Optional bulk fill in Translation UI; charged per job by **word count** |
| Storage | Keep existing `*_i18n` jsonb columns — Translation UI reads/writes locale slices |
| Disable / lapse | Locale expires → hide public URL + switcher; **keep translations in DB** |

### Merchant flow

1. Business runs in **primary locale** (default Vietnamese) — edit structure and content normally.
2. Settings → **Languages** → “Add English” (or DE, FR, …) → confirm **N credits/month**.
3. Open **Translations → English** — checklist of every string grouped by area (page, menu, order, SEO, QR copy).
4. Fill manually or **Translate with AI** (shows credit estimate before confirm).
5. Save → updates all related `*_i18n` fields for that locale.
6. Live site serves `/{slug}` (primary) and `/{locale}/{slug}` for each **active** purchased locale, with correct `hreflang`.

---

## 2. Pricing constants (v1 proposal)

Defined in `apps/web/src/lib/credit-packs.ts` — server is source of truth.

| Item | Credits | Rationale |
|------|---------|-----------|
| **Extra locale / month** | **20** | Below custom domain (50/mo); matches old bilingual plan; ~40k VND/mo at 100-pack rate |
| **Page views** | 1 / 500 views | Unchanged — **all locales combined** |
| **AI translate** | `max(1, ceil(words / 300))` | Budget-friendly; see §3 |
| **Primary locale** | **Free** | Included with every business |

Renewal: mirror `billCustomDomainIfDueAction` — deduct on due date; on insufficient balance, deactivate locale (redirect secondary URLs to primary).

---

## 3. AI translate pricing (recommendation)

### Formula

```
words = count translatable plain text (strip HTML, split on whitespace)
credits = max(1, ceil(words / 300))
```

**Minimum 1 credit** per job (even a tiny SEO title-only job).

### Why words / 300

- **Merchant-friendly:** “about 300 words per credit” is easy to explain.
- **Budget-friendly:** Typical small restaurant (~800 menu words + ~400 page words) ≈ **4 credits** (~3.6k–5k VND) for a full first translate.
- **Fair margin:** Gemini 2.5 Flash translation COGS for ~1.2k words is well under 1 credit’s retail value; 300 words/credit leaves room for failed retries and support.
- **Consistent with old char plan:** Previous draft used 200 **characters**/credit; 300 **words**/credit is roughly similar cost for Latin scripts, cheaper for CJK-heavy menus (words are shorter in character count).

### Job scopes

| Job | Fields included |
|-----|-----------------|
| **Everything** | Page blocks + menu + order copy + SEO + QR print strings |
| **Page only** | Puck block text fields for landing |
| **Menu only** | Categories, items, variants, custom tag labels |
| **Order only** | Promo slides, custom labels |
| **SEO only** | meta title, description |

Estimate endpoint = word math only (no LLM). Apply = LLM + debit **only on full success**.

### UX copy

> “Translate 1,240 words to English — **5 credits** (~4,500₫). You’ll only be charged if translation succeeds.”

---

## 4. Supported storefront locales

System UI (dashboard) stays **vi | en** via `I18nProvider`.

**Store content locales** expand beyond vi/en — use BCP-47 language codes:

`vi`, `en`, `de`, `fr`, `es`, `pt`, `it`, `nl`, `pl`, `ru`, `ja`, `ko`, `zh`, `th`, `id`, `ms`, `ar`, `hi`, …

Implementation:

- `apps/web/src/i18n/store-locales.ts` — catalog with labels + `hreflang` values
- `business_locales` table — which locales a business has active
- URL prefix: `/{locale}/{slug}` for non-primary; primary stays unprefixed
- `hreflang` alternates in `store-metadata.ts` for all active locales

Primary locale is always one of the catalog; cannot be “removed”, only switched (content preserved).

---

## 5. Data model

### New table: `business_locales`

```sql
business_locales (
  id uuid PK,
  business_id uuid FK,
  locale text NOT NULL,           -- 'en', 'de', ...
  status text NOT NULL,           -- 'active' | 'past_due' | 'cancelled'
  activated_at timestamptz,
  next_bill_at timestamptz,       -- monthly renewal anchor
  created_at, updated_at,
  UNIQUE (business_id, locale)
)
```

Primary locale lives in `publishing_settings.language` — **not** in `business_locales`.

Deprecate (do not delete yet):

- `publishing_settings.dual_language_enabled`
- `publishing_settings.dual_language_setup_status`
- `enabled_locales` → derive from `language` + active `business_locales`

### Page views (optional v1.1)

Add `locale text` to view tracking for **analytics breakdown only** — billing stays aggregate.

---

## 6. Translation UI (screen map)

**Route:** `/dashboard/translations` → pick locale → `/dashboard/translations/[locale]`

Sections (collapsible):

1. **Landing page** — all Puck text fields (read primary, edit target)
2. **Order page** — promo slides, headings
3. **Menu** — categories, items, variant groups/options, custom tags
4. **SEO & social** — meta title, description
5. **QR print copy** — headline, subtext (stored when we persist QR design)

Row states: empty (inherits primary on live until customized), customized, stale (primary changed since last translate — optional badge).

Actions:

- Save section / Save all
- **Translate section with AI** / **Translate all**
- Reset locale (clear customized slices, revert to primary fallback)

---

## 7. Phased delivery

### Phase A — Revert inline dual-language UX

- Remove locale tabs from Puck, menu, QR, order editor
- Editors write primary only
- Force `dual_language_enabled = false` globally (migration)
- Redirect `/en/{slug}` etc. unless locale is in `business_locales` (initially: redirect all)
- Close/abandon PRs that extend inline dual editing (#63 and similar)

**Exit:** Single editor experience; DB i18n columns untouched.

### Phase B — Locale purchase + monthly billing

- [x] Migration `business_locales`
- [x] `LOCALE_CREDITS_PER_MONTH = 20` in `credit-packs.ts`
- [x] `purchaseLocaleAction` / `cancelLocaleAction` / `billLocalesIfDueAction`
- [x] Settings → Languages: list catalog, show active + “Add for 20 credits/month”
- [x] On activate: enable public `/{locale}/{slug}` routes + hreflang

### Phase C — Translation UI (manual)

- [x] `/dashboard/translations/[locale]` checklist
- [x] Collect all translatable fields from pages, menu, order, SEO
- [x] Save → batch write `*_i18n` via existing `writeLocaleText` helpers
- [x] Live site reads target locale with primary fallback

### Phase D — AI translate

- [x] Vercel AI SDK + Gemini 2.5 Flash
- [x] `estimateTranslateCredits(words)` → `max(1, ceil(words/300))`
- [x] Chunk large menus; Zod-validated output; debit on success only
- [x] Translation UI: estimate + confirm + progress

### Phase E — Analytics by locale (optional)

- [x] Track views with locale dimension
- [x] Publishing chart: breakdown VI / EN / DE — **billing still one pool**

---

## 8. What we keep from dual-language work

| Keep | Remove |
|------|--------|
| `*_i18n` jsonb columns | `LocaleEditBar`, `MenuLocaleTabs` in editors |
| `localized-content.ts`, `writeLocaleText` | Free dual toggle in settings |
| `/{locale}/{slug}` route structure (gated) | `dual_language_setup` backfill job |
| `StoreLanguageSwitcher` (gated on purchased locales) | Per-field editing in block settings |

---

## 9. Open items (non-blocking)

- Exact locale catalog for launch (start with 10–15, expand on request)
- Primary locale switch UX (swap URL ownership — content kept)
- QR print design persistence (needed for Translation UI QR section)
- Stale translation detection when primary edits after translate

---

## 10. References

- Credit packs: `apps/web/src/lib/credit-packs.ts`
- Custom domain billing pattern: `apps/web/src/app/actions/credits.ts` → `billCustomDomainIfDueAction`
- Page view billing: `supabase/migrations/041_page_view_billing.sql`
- Superseded: `docs/dual-language-ai-plan.md`, `docs/bilingual-plan.md`
