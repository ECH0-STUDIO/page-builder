# Bilingual (Vietnamese + English) — implementation plan

Target audience is Vietnam. Visitors and editors work in **one language at a time** — Vietnamese **or** English, never both displayed together.

## Current state (audit)

| Area | IP/locale auto? | Notes |
|------|-----------------|-------|
| Dashboard / page builder | Partial | `proxy.ts` sets `NEXT_LOCALE` cookie from `x-vercel-ip-country` (VN → `vi`). Dashboard layout wraps `I18nProvider`. |
| Login / signup / forgot-password | **No** | Auth route group has no `I18nProvider`; UI strings are hardcoded English. |
| Live store `/[slug]` | **Partial** | `[slug]/layout.tsx` has `I18nProvider` but dictionary comes from visitor cookie only. Cart drawer strings are hardcoded English. |
| Marketing site | English | Nexbet export; not wired to i18n. |
| Menu items / page blocks | Single language | One `name`, `heading`, `description` field per entity. |
| Publishing `language` field | Stored | Used for `html[lang]` and schema; not a full content locale system. |

## Product requirements

1. **Single-locale display** — live page shows Vietnamese **or** English for a given visit, based on IP/cookie/switcher. Never side-by-side or stacked dual text.
2. **Page builder** — locale toggle (🇻🇳 / 🇬🇧) edits **one language at a time** per block and menu item.
3. **Menu builder** — item name/description stored per locale; render picks active locale only.
4. **Live store** — auto language from IP (existing cookie logic), footer language switcher, system UI (cart, buttons) translated.
5. **URLs** — optional `?lang=vi` (phase 2); cookie is sufficient for MVP.

## Recommended architecture

### Phase 1 — System UI i18n (in progress)

- Wrap `(auth)/layout.tsx` in `I18nProvider` (same as dashboard).
- Add `cart.*`, `order.*`, `auth.*`, `liveStore.*` keys to `en.json` / `vi.json`; use `t()` in `CartDrawer`, `PaymentDrawer`, auth pages.
- Live store: `resolveLiveLocale(cookie, publishing_settings.language)` in `[slug]/layout.tsx`.
- Footer language switcher on live store (sets `NEXT_LOCALE` cookie, reload).

**No schema changes.**

### Phase 2 — Store content bilingual (medium)

**JSON fields (recommended for MVP)**

```sql
-- page_blocks.config already JSONB; extend shapes:
{ "heading": { "vi": "...", "en": "..." } }

-- menu_items
ALTER TABLE menu_items ADD COLUMN name_i18n jsonb;
ALTER TABLE menu_items ADD COLUMN description_i18n jsonb;
```

- `publishing_settings.content_locales: text[]` default `'{vi,en}'`.
- Render helper: `pickLocale(value, locale)` — returns **one** string for the active locale.
- Backfill: `{ "vi": existing_value, "en": existing_value }`.

### Phase 3 — Page builder UX (larger)

- Locale toggle in editor toolbar — edits **one language at a time**.
- Per-block settings show fields for **active edit locale** only.
- Menu builder: locale tabs per item.
- Canvas preview respects selected preview locale.

### Phase 4 — Live rendering rules

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
- More than 2 languages
- Per-locale custom domains
- Simultaneous bilingual display (rejected — not useful for this product)

## Suggested order of work

1. Fix production domains + preview (PR #7).
2. Phase 1 — auth + cart i18n + live footer switcher.
3. Phase 2 schema + migration + `pickLocale` render helpers.
4. Phase 3 page builder locale toggle UI.
5. Phase 4 content rendering + SEO hreflang.
