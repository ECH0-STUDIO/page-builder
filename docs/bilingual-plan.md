# Bilingual (Vietnamese + English) — implementation plan

Target audience is Vietnam. Visitors and editors work in **one language at a time** — Vietnamese **or** English, never both displayed together.

## Current state (audit)

| Area | IP/locale auto? | Notes |
|------|-----------------|-------|
| Dashboard / page builder | Partial | `proxy.ts` sets `NEXT_LOCALE` cookie from `x-vercel-ip-country` (VN → `vi`). Dashboard layout wraps `I18nProvider`. |
| Login / signup / forgot-password | **No** | Auth route group has no `I18nProvider`; UI strings are hardcoded English. |
| Live store `/[slug]` | **Partial** | `[slug]/layout.tsx` has `I18nProvider` but dictionary comes from visitor cookie only. Cart drawer strings are hardcoded English. |
| Marketing site | English | Nexbet export; not wired to i18n. |
| Menu items / page blocks | Bilingual JSON | `name_i18n`, `description_i18n`, block `config` fields as `{ vi, en }`; `pickLocale` at render. |
| Publishing tab | Deduped | SEO, favicon, GSC removed — lives in Page Builder → Global Settings only. |
| Publishing `language` field | Deprecated in UI | Replaced by locale selection model (Phase 5). |

## Phase 5 — Locale URLs & selection (next)

### How other platforms handle multi-language

| Platform | URL pattern | Notes |
|----------|-------------|-------|
| **Webflow** | `/en/page`, `/fr/page` or subdomain | Locale subpaths; hreflang in head |
| **Squarespace** | Separate pages per language | Manual duplication; no shared blocks |
| **Wix** | `domain.com/es` or Multilingual app | Paid add-on; language switcher widget |
| **Shopify** | `store.com/en`, markets | Shopify Markets; paid on higher plans |
| **WordPress + WPML** | `/vi/slug/` | Industry standard subpath; plugin ~$39+/yr |
| **Framer** | `/es/about` | Locale path prefix; one site, multiple locales |

**Recommendation for Eatery:** subpath after business slug — `eateryvn.com/{slug}/vi` and `/{slug}/en` (default locale can omit prefix or use `/en`). Same published blocks JSON; `pickLocale(content, activeLocale)` at render. No duplicate page builder canvases.

### Product model (non-aggressive)

1. **Default included:** Vietnamese + English (2 locales) on every plan.
2. **Editor:** Top-level **language tabs** on the live page preview / a dedicated “Languages” strip — **not** inside every block settings panel. Switching tab sets `editLocale`; block fields show one language at a time (existing `LocaleToggle` moves here).
3. **Visitor:** Footer switcher + auto-detect (cookie/IP). Optional direct link `/vi` or `/en`.
4. **Paid unlock:** Extra locales (Thai, Chinese, …) via credits — stored in `publishing_settings.enabled_locales` or credits feature flag. Server validates locale on publish; no client-only “unlock” (credit check in `savePublishingSettingsAction` / `unlockLocaleAction`).
5. **SEO:** `hreflang` link cluster per enabled locale; `canonical` per active URL.

### What we are NOT doing

- Separate page builder layouts per language (one block tree, i18n JSON fields).
- Duplicating SEO/settings between Publishing and Page Builder.
- Showing two languages on screen at once.

### Implementation order (Phase 5)

1. `enabled_locales: text[]` default `'{vi,en}'` on `publishing_settings`.
2. Route: `[slug]/[locale]/page.tsx` or middleware rewrite `/{slug}/vi` → same page with `locale=vi`.
3. Move `LocaleToggle` to a prominent **Language** bar above the canvas (keep PublishBar or new strip).
4. Credit-gated unlock for `th`, `zh`, etc.
5. hreflang + sitemap entries per locale.

## Data migration

1. **Single-locale display** — live page shows Vietnamese **or** English for a given visit, based on IP/cookie/switcher. Never side-by-side or stacked dual text.
2. **Page builder** — locale toggle (🇻🇳 / 🇬🇧) edits **one language at a time** per block and menu item.
3. **Menu builder** — item name/description stored per locale; render picks active locale only.
4. **Live store** — auto language from IP (existing cookie logic), footer language switcher, system UI (cart, buttons) translated.
5. **URLs** — optional `?lang=vi` (phase 2); cookie is sufficient for MVP.

## Recommended architecture

### Phase 1 — System UI i18n (done)

- Wrap `(auth)/layout.tsx` in `I18nProvider` (same as dashboard).
- Add `cart.*`, `order.*`, `auth.*`, `liveStore.*` keys to `en.json` / `vi.json`; use `t()` in `CartDrawer`, `PaymentDrawer`, auth pages.
- Live store: `resolveLiveLocale(cookie, publishing_settings.language)` in `[slug]/layout.tsx`.
- Footer language switcher on live store (sets `NEXT_LOCALE` cookie, reload).

**No schema changes.**

### Phase 2 — Store content bilingual (done)

**JSON fields (recommended for MVP)**

```sql
-- page_blocks.config already JSONB; extend shapes:
{ "heading": { "vi": "...", "en": "..." } }

-- menu_items / menu_categories (migration 031_menu_i18n.sql)
ALTER TABLE menu_items ADD COLUMN name_i18n jsonb;
ALTER TABLE menu_items ADD COLUMN description_i18n jsonb;
ALTER TABLE menu_categories ADD COLUMN name_i18n jsonb;
```

- `pickLocale(value, locale)` — returns **one** string for the active locale.
- Backfill: `{ "vi": existing_value, "en": existing_value }`.

### Phase 3 — Page builder UX (done)

- Locale toggle in editor toolbar — edits **one language at a time**.
- Per-block settings show fields for **active edit locale** only.
- Menu builder: locale tabs per item and category.
- Canvas preview uses `pickLocale` for the active preview locale.

### Phase 4 — Live rendering rules (done)

| Visitor locale | Live behavior |
|----------------|---------------|
| `vi` | All system UI + content in Vietnamese; fallback to English if field empty. |
| `en` | All system UI + content in English; fallback to Vietnamese if field empty. |

- Cart/checkout always uses visitor locale for system strings.
- SEO: `hreflang` alternates when both locales are published with content.

## Data migration

- Backfill i18n JSON from existing single-string fields.
- Publish snapshot includes full i18n config in `published_blocks`.

## Testing checklist

- [ ] VN IP → live store Vietnamese cart strings
- [ ] US IP → English
- [ ] Footer switcher overrides cookie
- [ ] Single-locale mode shows only active language (no dual text)
- [ ] Empty secondary locale falls back to primary

## Out of scope (later)

- Auto-translate (Google / DeepL API)
- Per-locale custom domains
- Simultaneous bilingual display (rejected — not useful for this product)
- More than 2 languages without credit unlock (see Phase 5)

## Suggested order of work

1. Fix production domains + preview (PR #7).
2. Phase 1 — auth + cart i18n + live footer switcher.
3. Phase 2 schema + migration + `pickLocale` render helpers.
4. Phase 3 page builder locale toggle UI.
5. Phase 4 content rendering + SEO hreflang.
