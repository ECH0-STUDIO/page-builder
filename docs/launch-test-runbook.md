# Launch test runbook

Follow this on production after a launch deploy. The last full pass was 24 Sep 2026 against `main` commit `d7dc482` (deployment `dpl_9XMdA3CfGwVjog3yjhgNVFJTZc3o`). That pass was 17/17 on the automated smoke, plus a read-only walk of every owner screen.

Leaked-password protection is skipped on purpose. The project is on the Supabase Free plan, and that check is Pro-only.

## Rules

Do this against `https://www.eateryvn.com` and `https://app.eateryvn.com`. The published test store is `la-matcha`. Its custom domain is `https://next2zero.com`. The unpublished store used for 404 checks is `ph-dn`.

Read credentials from `apps/web/tests/auth.spec.ts` (`testEmail` / `testPassword`). Pass them as `SMOKE_EMAIL` and `SMOKE_PASSWORD`. Do not print the password. Do not commit it.

On production, never:

- Place an order, open checkout, or call PayOS
- Click **Gọi nhân viên** / **Call staff**
- Click Save on business, menu, payments, publishing, settings, gallery, or translations
- Change the slug, custom domain, or publish flags
- Run AI translate or buy credits
- Invite or remove staff, or change the password
- Delete a business, category, item, or image

The only allowed mutation is the order-builder badge check at the end. Restore the original background color and publish before finishing. If that restore fails, stop and say so.

Do not merge older stacked pull requests (#3, #12, #14, #15, #17, #36, #66–#69, #75, #80).

## 1. Automated smoke

From `apps/web`, with dependencies installed:

```bash
PLAYWRIGHT_BASE_URL=https://www.eateryvn.com \
SMOKE_EMAIL="$SMOKE_EMAIL" \
SMOKE_PASSWORD="$SMOKE_PASSWORD" \
pnpm exec playwright test tests/production-smoke.spec.ts --timeout=180000
```

Pass means all of these are true:

- Marketing home, pricing, features, signup, and login render
- Signed-out `/dashboard` redirects to login
- `/api/cron/purge-orders` returns 401 with no secret
- `https://www.eateryvn.com/la-matcha` is the store, not a 404
- `https://www.eateryvn.com/la-matcha/order` is the order page, titled `La Matcha — Order | Eatery`
- A diner can add one item to the cart and stop. Do not check out
- `https://www.eateryvn.com/en/la-matcha/order` is the English order page
- `https://www.eateryvn.com/ph-dn` and `/ph-dn/order` are 404s, and the heading is not the broken `Không tìm thấy trang/h1>` text
- `https://next2zero.com/` is the store homepage
- `https://next2zero.com/la-matcha` redirects to the apex
- `https://next2zero.com/order` and `/en/order` are the order page
- `https://next2zero.com/templates/garden-cafe-hero.jpg` returns 200 with an image content type
- The owner can open dashboard, orders, menu, QR, publishing, settings, and credits without saving

Also confirm the billing cron exists and is locked:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://www.eateryvn.com/api/cron/billing
```

Expect `401`. `404` means the schedule from `apps/web/vercel.json` is not deployed.

## 2. Owner screens, view only

Log in at `https://app.eateryvn.com/login`. Open each URL. The page must return under 400, stay on that path, and must not show “This page couldn’t load” or “Application error”. Wait about 1.5s after navigation. One fast pass has crashed settings once; a reload that then renders is a flake, a crash that survives reload is a failure.

| Path | What to confirm |
| --- | --- |
| `/dashboard` | Overview heading and sidebar |
| `/dashboard/orders` | Live orders and history load. Do not change a status |
| `/dashboard/business` | Profile form is visible. Do not save |
| `/dashboard/menu` | Categories and items render. Do not add or delete |
| `/dashboard/print-menu` | Print preview renders. Do not download a new file if the button writes data |
| `/dashboard/qr` | QR image renders. Do not regenerate |
| `/dashboard/payments` | Payment settings render. Do not save bank details |
| `/dashboard/gallery` | Library renders. Do not upload or delete |
| `/dashboard/translations` | Locale list renders. Do not run AI translate |
| `/dashboard/publishing` | Slug, domain, and publish state render. Do not edit |
| `/dashboard/settings` | Redirects to security |
| `/dashboard/settings/security` | Email is shown. Do not change the password |
| `/dashboard/settings/team` | Member list renders. Do not invite or remove |
| `/dashboard/settings/languages` | Store languages render. Do not buy a locale |
| `/dashboard/settings/localization` | Language and currency render. Do not save |
| `/dashboard/settings/credits` | Balance renders. Do not buy credits |

## 3. Page builders

`https://app.eateryvn.com/dashboard/pages` is the homepage builder.

- Preview is a globe icon with no visible label
- Status is **Trực tuyến** / **Live**, or **Có thay đổi** / **Changes** if a real draft exists
- Do not edit or publish

`https://app.eateryvn.com/dashboard/pages?page=order` is the order builder.

- Preview is an eye icon, 32×32, with no visible “Xem trước” label. Accessible name may still be “Xem trước”
- Copy and open-live icons sit beside it
- If nothing is dirty, the badge is green **Trực tuyến** / **Live**
- Open preview, confirm the diner layout, then close it. Do not edit yet

## 4. Order-builder badge, then restore

Skip this if the badge is not a clean **Live** / **Trực tuyến**.

1. On the order builder Appearance tab, read the page-background color (`input[type="color"]` after the brand color). That is the second color input.
2. Fetch `https://www.eateryvn.com/la-matcha/order` and keep the HTML.
3. Set the background to `#00aa00` (or `#00aa33` if it is already `#00aa00`).
4. Wait until the badge says **Có thay đổi** / **Changes** and the header says **Đã lưu** / **Saved**.
5. Fetch the public order page again. It must not contain the new color. Guests still see the published snapshot.
6. Set the color back to the original value. Wait for **Đã lưu**.
7. Open **Xuất bản** / **Publish** and choose **Xuất bản trực tuyến** / **Publish to Live**. Do not choose **Lưu nháp** / **Save as Draft**.
8. The badge returns to **Trực tuyến** / **Live**. The public HTML still does not contain the probe color.

If any step fails after the color change, put the original color back, wait for save, and publish to live before stopping.

## 5. Guest order page

Desktop and a 390×844 viewport, on both:

- `https://www.eateryvn.com/la-matcha/order`
- `https://next2zero.com/order`

Confirm the staff button, the search field, category buttons, and item cards. Add one item and confirm the cart count (`1 món` or `1 items`). Close the cart. Do not place the order. Do not call staff.

Homepage images on `www.eateryvn.com`, `www.eateryvn.com/la-matcha`, and `next2zero.com` must load in a real browser. The blog thumbnail on `ech0studio.b-cdn.net` returns 403 when the request has no Referer and 200 when the page is the referrer. That is expected. Do not treat the bare request as a broken image.

## 6. Report

Say what passed, what failed, and the production commit. Call out anything only a person can finish:

- A real PayOS payment and the webhook
- Signup, password-reset, and team-invite email in an inbox
- A push notification on a phone
- A manager account and a staff account (staff should land on live orders and not see owner settings)
- Printing a menu from the print dialog

Those four are outside this run. Do not invent a live payment or a second user to cover them.
