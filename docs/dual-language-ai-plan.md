# Dual language + AI translation plan

Branch: `cursor/dual-language-ai-ffbe` (from `main` @ marketing merge).  
Status: **planning locked — implementation not started**.

This replaces the older multi-locale CoW approach in `docs/bilingual-plan.md` for the product direction below. Keep `bilingual-plan.md` as historical reference only until this ships.

---

## 1. Goals

1. Optional **Vietnamese + English** content for a business (default **off**).
2. User picks **primary** language (SEO + default live URL). Secondary is text-only (Webflow-style).
3. **AI translate** with accurate **per-character credit** estimates, confirm, apply, reset, disclaimer.
4. Later: weekly AI digest on analytics; upsells on dish detail; (deferred) owner chat help & menu engineering.

Non-goals for this branch epic: menu-from-photo, page auto-draft, SEO AI pack, image AI, guest AI waiter, voice.

---

## 2. Product decisions (locked)

| Topic | Decision |
|--------|----------|
| Languages | VI + EN only |
| Dual language default | **Off** |
| Control | **Settings → Language**: enable dual + select primary |
| Primary default | Vietnamese |
| Primary switch | Swap which language owns `/{slug}` vs secondary path; **content kept**; **no warning** |
| Secondary | Reflection of primary; **text only**; empty → **fallback to primary** live |
| Live primary URL | `/{slug}`, `/{slug}/order` |
| Live secondary URL | `/{slug}/en` or `/{slug}/vi` (the non-primary) |
| Disable dual | Hide dual UI; serve primary only; **keep secondary in DB**; secondary URLs **redirect → primary** |
| Enable dual | Show **loading/progress** while setup runs (simple progress OK) |
| Page builder / order editor | Primary \| Secondary toggle; secondary locks layout/colors/media/blocks |
| Menu | Independent **VI \| EN** tabs (not primary/secondary lock) |
| Variant labels | Dual language in v1 (group + option text); price/structure shared |
| Translate credits | `credits = max(1, ceil(chars / 200))` |
| Char count | Strip HTML; Unicode code points; only fields in job; default = empty secondary only |
| Upsells | Dish **detail** screen; ranking from order co-occurrence (no LLM v1) |
| Weekly digest | Analytics section; AI short summary; no user charge |
| Owner AI chat / menu engineering | Later |

---

## 3. Technical stack (AI)

| Layer | Choice |
|--------|--------|
| Hosting | Existing Vercel + Next.js |
| SDK | Vercel AI SDK (`ai` + `@ai-sdk/google`) |
| Translate model | **Gemini 2.5 Flash** |
| Digest model | **Gemini 2.5 Flash-Lite** (or Flash) |
| Fallback | None in v1 |
| Secrets | `GOOGLE_GENERATIVE_AI_API_KEY` (server only) |
| Optional env | `AI_TRANSLATE_MODEL`, `AI_DIGEST_MODEL` |

**Patterns**

- `generateObject` + Zod schemas only (no free-form HTML into CMS).
- Chunk large menus (e.g. ~20 items/call); one user-facing credit total from **sum of chars**.
- Estimate endpoint = char math only (no LLM). Apply = LLM + debit on full success.

**Internal COGS**

- Log `chars`, `tokens_in`, `tokens_out`, `model`, `credits_charged`, latency.
- Google cost stays cents-scale per typical job; credits (`C = 200`) provide margin.
- Users never see tokens.

---

## 4. Credits vs AI cost

### User-facing

```
chars = count(fields in scope)
credits = max(1, ceil(chars / 200))
```

- Show before confirm: “N credits to translate”.
- Debit only after successful apply.
- Reset / enable-disable dual / digest / upsells: **no** translate credits.

### Scope defaults

| Job | Default fields counted |
|-----|-------------------------|
| Page (landing) | Empty secondary text on blocks + SEO if included |
| Order editor | Empty secondary promo/custom copy |
| Menu | Empty EN or VI names/descriptions/categories/variant labels for current target language |

Overwrite-all is an explicit opt-in (counts all target fields).

### Failure policy

If any chunk fails validation or write: **do not debit**; surface error; leave DB unchanged for failed chunk (prefer all-or-nothing per job).

---

## 5. Current codebase reality

- Storefront was bilingual once, then **reverted to single-language VI MVP**.
- DB leftovers may exist (`*_i18n`, `enabled_locales`, `seo_i18n`, `visible_locales`) — audit before migrations.
- Editor is **Puck** (`PuckEditorShell`); old LocaleBar/CoW UI is gone.
- `resolveLiveLocale` forces `vi`.
- Marketing `?lang=` is **separate** — do not reuse for storefront.

Implementation is a **rebuild on Puck + current order/menu**, not a revive of deleted EditorShell.

---

## 6. Phased delivery

### Phase 0 — Branch + plan (this doc)

- [x] Branch `cursor/dual-language-ai-ffbe` from `main`
- [x] Detailed plan committed
- [ ] PR opened as draft for tracking

### Phase 1 — Settings → Language + data foundation

**1.1 Settings UI**

- New **Language** settings page (product settings).
- Fields: `dual_language_enabled` (default false), `primary_locale` (`vi` \| `en`, default `vi`).
- Enable → progress UI → server setup job → done.
- Disable → hide dual switches; primary-only UX; redirect secondary paths.

**1.2 Schema**

- Persist enable + primary on business / `publishing_settings` (prefer one clear home; migrate leftovers).
- Ensure i18n-capable storage for:
  - Block text fields
  - Order promo / custom copy
  - Menu item name/description, category name
  - Variant group + option labels
  - SEO title/description (and OG if per-locale)
- Shared: layout, colors, images, prices, variant structure, block tree, hours numbers, payments.

**1.3 Setup-on-enable job**

- Copy primary → secondary baselines where secondary empty.
- Flag business ready; unlock UI.
- Simple indeterminate or % progress is enough.

**Exit criteria:** Can toggle dual on/off; primary switchable; data round-trips; no public secondary URL yet required if Phase 2 bundles routing — prefer routing in same epic before AI.

### Phase 2 — Editors + live routing

**2.1 Page builder (Puck)**

- Primary \| Secondary toggle when dual enabled.
- Secondary: text fields only; lock layout/theme/media/add-delete/reorder.

**2.2 Order page editor**

- Same toggle + text-only lock.

**2.3 Menu**

- VI \| EN tabs when dual enabled; single language (= primary) when off.
- Variant labels editable per language.

**2.4 Live**

- Primary: `/{slug}`, `/{slug}/order`.
- Secondary: `/{slug}/en` or `/{slug}/vi` + order equivalents.
- Fallback secondary empty → primary text.
- Dual off: secondary URL → redirect primary.
- Guest language control linking to the other path.
- `hreflang` + canonical on primary; proxy/custom domain aware of path locale.
- Schema.org strings follow page locale.

**Exit criteria:** Publish VI primary + EN secondary (and reverse); menu/variants show correctly; dual off hides everything cleanly.

### Phase 3 — AI translate

**3.1 Infra**

- Install AI SDK + Google provider.
- Env keys; model env overrides.
- `estimateTranslateCredits(chars)` shared helper (`C = 200`, min 1).

**3.2 APIs**

- `estimate` — char count + credit quote (authz: owner/manager).
- `apply` — balance check → chunked Flash → Zod validate → write → debit.
- `reset` — clear secondary (or AI-filled) fields in scope; no LLM.

**3.3 UI**

- Builder / order: Translate to secondary + estimate + disclaimer + Reset.
- Menu: Translate all to current tab language + estimate + disclaimer + Reset.
- Disclaimer: translations may need manual edit.

**Exit criteria:** End-to-end translate with correct credits; failed apply does not debit; reset works.

### Phase 4 — Weekly digest

- Analytics “Last week” card.
- Cron or on-open cached generation (1 call/business/week).
- Flash-Lite; no credits.
- Inputs from existing order aggregates.

### Phase 5 — Upsells

- Dish detail: “Goes well with…” (or VI equivalent).
- Co-occurrence from completed orders; fallback featured.
- Hide if insufficient data.
- No LLM v1.

### Phase 6 — Deferred

- Owner help chat (needs KB; free; ongoing cost).
- Menu engineering (cost + logic heavy).
- Extra languages beyond VI/EN.

---

## 7. Surfaces checklist (bilingual)

| Surface | In scope |
|---------|----------|
| Settings → Language | Yes |
| Landing blocks text | Yes |
| SEO / OG per locale | Yes |
| Order promo / custom copy | Yes |
| Menu name/description/category | Yes |
| Variant group + option labels | Yes |
| Print menus | Follow-up (use current menu tab language) |
| QR image labels | Optional later |
| Schema.org | Yes (with live locale) |
| Explore blurb | If store description is shown — follow-up |
| System chrome (cart, hours labels) | Existing dict i18n by path locale |
| Marketing site | Out of scope |
| Staff push / invite emails | Later |

---

## 8. Security & abuse

- Owner/manager only for translate/reset/enable.
- Rate limit translate per business.
- Max chars per job.
- Server-only API keys.
- Never trust client-sent credit amounts — recompute server-side.

---

## 9. Test plan (high level)

- Dual off: no toggles; only primary URLs; secondary redirects.
- Dual on + primary VI: `/` Vietnamese, `/en` English with fallback.
- Dual on + primary EN: `/` English, `/vi` Vietnamese.
- Secondary cannot change layout in builder.
- Menu tabs independent; variants localize.
- Estimate matches apply debit; failure → no debit.
- Reset clears secondary; live falls back.
- Credits `ceil(chars/200)` and minimum 1.

---

## 10. Implementation order (when coding starts)

1. Migrations + types for `dual_language_enabled` / `primary_locale` + i18n fields audit  
2. Settings → Language UI + enable progress job  
3. Locale read helpers (primary, secondary, fallback)  
4. Puck + order secondary lock  
5. Menu VI/EN + variant labels  
6. Live routes + proxy + SEO hreflang  
7. AI SDK + estimate/apply/reset  
8. Digest  
9. Upsells  

Do not mix marketing-site i18n into this work.

---

## 11. Open follow-ups (non-blocking)

- Exact credit pack ↔ VND unit economics review after first production logs.
- Whether SEO is included in “translate whole page” by default.
- Print menu language selection UX.
- Labeled enable steps only if setup is slow in practice.
