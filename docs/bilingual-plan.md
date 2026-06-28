# Bilingual (Vietnamese + English) — implementation plan

Target audience is Vietnam. This document plans dual-language support without implementing it yet.

## Current state (audit)

| Area | IP/locale auto? | Notes |
|------|-----------------|-------|
| Dashboard / page builder | Partial | `proxy.ts` sets `NEXT_LOCALE` cookie from `x-vercel-ip-country` (VN → `vi`). Dashboard layout wraps `I18nProvider`. |
| Login / signup / forgot-password | **No** | Auth route group has no `I18nProvider`; UI strings are hardcoded English. |
| Live store `/[slug]` | **Partial** | `[slug]/layout.tsx` has `I18nProvider` but dictionary comes from visitor cookie only. Cart drawer strings are hardcoded English. |
| Marketing site | English | Nexbet export; not wired to i18n. |
| Menu items / page blocks | Single language | One `name`, `heading`, `description` field per entity. |
| Publishing `language` field | Stored | Used for `html[lang]` and schema; not a full content locale system. |

## Product requirements (from stakeholder)

1. **Page builder** — toggle: show Vietnamese only, English only, or **both** (bilingual display).
2. **Section settings** — edit content per language (hero heading, menu grid text, etc.).
3. **Menu builder** — item name/description in VI + EN.
4. **Live store** — auto language from IP (existing cookie logic), footer language switcher, system UI (cart, buttons) translated.
5. **URLs** — optional `?lang=vi` or `/vi/{slug}` (decide in phase 2).

## Recommended architecture

### Phase 1 — System UI i18n (1–2 PRs, low risk)

- Wrap `(auth)/layout.tsx` in `I18nProvider` (same as dashboard).
- Add `cart.*`, `order.*` keys to `en.json` / `vi.json`; use `t()` in `CartDrawer`, `PaymentDrawer`, `MenuGridRender`.
- Live store: load dictionary from `NEXT_LOCALE` cookie + `publishing_settings.language` as fallback.
- Footer language switcher on live store (sets cookie, reload).

**No schema changes.**

### Phase 2 — Store content bilingual (medium)

**Option A — JSON fields (recommended for MVP)**

```sql
-- page_blocks.config already JSONB; extend shapes:
{ "heading": { "vi": "...", "en": "..." } }

-- menu_items
ALTER TABLE menu_items ADD COLUMN name_i18n jsonb;
ALTER TABLE menu_items ADD COLUMN description_i18n jsonb;
```

- `publishing_settings` add `content_locales: text[]` default `'{vi,en}'`, `display_mode: 'single' | 'bilingual'`.
- Page builder toggle writes `display_mode` + active edit locale tab.
- Render helpers: `pickLocale(obj, locale, fallbackLocale)`.

**Option B — separate rows per locale** (heavier, better for many languages later).

### Phase 3 — Page builder UX (larger)

- Global settings panel: **Languages** — checkboxes VI / EN, display mode (single vs side-by-side on live).
- Per-block settings: locale tabs (🇻🇳 / 🇬🇧) editing the same block config keys.
- Menu builder: duplicate fields or tabs per item.
- Canvas preview: locale switcher next to desktop/mobile toggle.

### Phase 4 — Live rendering rules

| `display_mode` | Live behavior |
|----------------|---------------|
| `single` | Show active locale from cookie/IP; fallback to `vi`. |
| `bilingual` | Show both (e.g. EN title / VI subtitle, or stacked). |

- Cart/checkout always uses visitor locale for system strings.
- SEO: `hreflang` alternates when bilingual published.

## Data migration

- Backfill: `{ "vi": existing_value, "en": existing_value }` for all translatable config keys.
- Publish snapshot includes full i18n config in `published_blocks`.

## Testing checklist

- [ ] VN IP → live store Vietnamese cart strings
- [ ] US IP → English
- [ ] Footer switcher overrides cookie
- [ ] Bilingual mode shows both languages on menu items
- [ ] Single-locale mode hides empty secondary locale

## Out of scope (later)

- Auto-translate (Google / DeepL API)
- More than 2 languages
- Per-locale custom domains

## Suggested order of work

1. Fix production domains + preview (current PR).
2. Phase 1 — auth + cart i18n + live footer switcher.
3. Phase 2 schema + migration + render helpers.
4. Phase 3 page builder UI.
5. Phase 4 bilingual display modes + SEO.
