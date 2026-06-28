# Multi-locale landing pages

One page tree, multiple languages. Visitors see **one locale at a time** (never side-by-side).

## Editor UX

- **Global locale bar** above the canvas (not in Publish bar).
- Default locales: **Vietnamese + English** (included).
- **Add language** → extra locales cost **20 credits/month** each (server-enforced on unlock).
- Switching locale changes which translation you edit; layout/images/prices stay shared.

## Copy-on-write

1. First edit in the **primary locale** (first tab, default `vi`) copies text to all other enabled locales.
2. Editing another locale marks that field as **customized** for that locale only.
3. Further primary-locale edits update only locales that are still linked (not customized).

## Per-locale fields

| Area | Per-locale | Shared (all languages) |
|------|------------|-------------------------|
| Hero / text blocks | heading, tagline, body, CTA labels | images, layout, colors, spacing |
| Navbar | link labels | hrefs, logo image, sticky, colors |
| Footer | copyright text | show business name, colors |
| Menu grid block | section heading, description | layout, category filter IDs, display toggles |
| QR block | label under QR | target URL, colors, download toggle |
| Menu items | name, description, **visible on menu** | price, image, tags, variants |
| Menu categories | name, **visible on menu** | sort order |
| SEO (global settings) | meta title, meta description, OG image | favicon, webclip, GSC, analytics IDs |
| Variant options | label (future) | price delta |

## Suggested additions (later)

- Per-locale **QR / custom URL** if you run different campaigns per market.
- Per-locale **business hours label** (hours data usually shared).
- **hreflang** + URLs `/{slug}/vi`, `/{slug}/en`.

## Publishing tab

SEO/branding/analytics tags live only in **Page Builder → Theme (global settings)**. Publishing covers URL, go-live, domain, analytics chart.

## System UI (kept)

- Dashboard/auth/cart strings via `I18nProvider` + dictionaries.
- Live store footer language switcher + cookie/IP default.
