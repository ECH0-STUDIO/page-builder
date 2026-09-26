# Launch test runbook

Follow this on production after a launch deploy. A screen that only renders is not a pass. Each feature check has to change what the guest or owner sees, then return the screen to how it started. Smoke and the feature script last passed on 24 Sep 2026 against `main` commit `75c6274`. Homepage and order builders both use the eye icon for preview as of that commit.

Leaked-password protection is skipped on purpose. The project is on the Supabase Free plan, and that check is Pro-only.

## Rules

Do this against `https://www.eateryvn.com` and `https://app.eateryvn.com`. The published test store is `la-matcha`. Its custom domain is `https://next2zero.com`. The unpublished store used for 404 checks is `ph-dn`.

Read credentials from `apps/web/tests/auth.spec.ts` (`testEmail` / `testPassword`). Pass them as `SMOKE_EMAIL` and `SMOKE_PASSWORD`. Do not print the password. Do not commit it.

That account has two roles. A fresh login lands on **The best cafe**, slug `playwright-pub-1779084603686`, where the account is the owner. Use that business for every owner check below. **La Matcha** is a staff membership for the same login: the switcher reloads onto `/dashboard/orders`, owner links disappear, and `/dashboard/menu` redirects back to orders. Guest checks stay on `la-matcha` and `next2zero.com`. Do not expect the dashboard of La Matcha to show the owner menu.

`page.waitForURL` against the dashboard times out if it waits for the `load` event. Wait until `commit`, then give the page about four seconds to hydrate. Shadcn `Input` fields omit the `type` attribute, so `input[type="text"]` misses the business name (`#prof-name`) and the publishing slug (`#pub-slug`). The first real `type="text"` on publishing is the custom domain.

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

A page that merely paints is not a pass. Each step below has to change what the user sees, then put the screen back. Still do not save, publish, delete, invite, translate, or pay.

## 2. Guest order behavior

On desktop and at 390×844, for both `https://www.eateryvn.com/la-matcha/order` and `https://next2zero.com/order`:

1. The staff button and the search field are visible. Do not click staff.
2. Click a category other than the one already selected. The item list changes. Click back. The first list returns.
3. Read the name of the first item. Type that name into search. That item stays, and at least one other item leaves the list. Clear the search. The full list returns.
4. Click **Thêm vào đơn** / **Add to order** on one item. The cart shows `1 món` or `1 items`.
5. Open the cart. Increase quantity. The count becomes 2. Click **Xóa món** / the remove control. The cart is empty.
6. Do not press the place-order button.

On `https://www.eateryvn.com/en/la-matcha/order`, search and add-to-cart still work in English. Do not check out.

Homepage images on `www.eateryvn.com`, `www.eateryvn.com/la-matcha`, and `next2zero.com` must load in a real browser. The blog thumbnail on `ech0studio.b-cdn.net` returns 403 when the request has no Referer and 200 when the page is the referrer. That is expected.

## 3. Owner features

Log in at `https://app.eateryvn.com/login` and stay on **The best cafe**. A crash that survives reload is a failure. A single crash that a reload clears is a flake; record it and continue.

- **Orders** (`/dashboard/orders`): open **Trực tiếp** / Live and **Lịch sử** / History. Each tab shows orders or a real empty state. Do not change a status. History is owner and manager only.
- **Business** (`/dashboard/business`): `#prof-name` is `The best cafe`. Do not save.
- **Menu** (`/dashboard/menu`): categories are `div.cursor-pointer`, including Starter and Desert. Click one, then the other. The editor contents change. Do not add, edit, or delete.
- **Print menu** (`/dashboard/print-menu`): item names from the menu are in the preview. Do not start a download.
- **QR** (`/dashboard/qr`): the page HTML contains `playwright-pub-` or `thebest.com`, and the **QR Bàn** / Table tab opens. Do not regenerate.
- **Payments** (`/dashboard/payments`): the saved bank or “not set up” state is visible. Do not save.
- **Gallery** (`/dashboard/gallery`): the grid or the empty state is visible. Do not upload or delete.
- **Translations** (`/dashboard/translations`): open the first **Sửa** / Edit link. The URL becomes `/dashboard/translations/en` and text fields are present. Do not run AI translate and do not save.
- **Publishing** (`/dashboard/publishing`): `#pub-slug` is `playwright-pub-1779084603686`. Do not edit the slug, domain, or publish toggle.
- **Settings**: `/dashboard/settings` lands on security and shows the account email. Team lists members. Languages lists store locales. Localization shows language and currency. Credits shows a numeric balance. Do not save, invite, buy, or change the password.

## 3b. Staff on La Matcha

From the business switcher, choose **La Matcha** and wait for the reload.

- The sidebar has live orders and does not show **Thực đơn**, **Trình tạo trang**, or **Xuất bản**.
- Opening `/dashboard/menu` returns to `/dashboard/orders`.
- The live board shows the empty columns. **Lịch sử** is absent for staff. That is expected.
- Do not change an order.

## 4. Page builders

Both builders use a 32×32 eye icon for preview, with no visible label. The accessible name may still be “Xem trước” / “Preview”.

`https://app.eateryvn.com/dashboard/pages` is the homepage builder.

- Click the eye. The preview banner appears and the canvas is the guest homepage, not the editor sidebar.
- Close preview. The editor returns.
- The badge is **Trực tuyến** / **Live**, or **Có thay đổi** / **Changes** if a real draft already exists.
- Do not move blocks and do not publish.

`https://app.eateryvn.com/dashboard/pages?page=order` is the order builder.

- The eye sits with the copy and open-live icons.
- Click the eye. The diner order layout is shown. Close preview.
- If nothing is dirty, the badge is green **Trực tuyến** / **Live**.

## 5. Order-builder badge, then restore

Skip this if the badge is not a clean **Live** / **Trực tuyến**.

1. On the order builder Appearance tab for **The best cafe**, read the page-background color (`input[type="color"]` after the brand color). That is the second color input.
2. Fetch `https://www.eateryvn.com/playwright-pub-1779084603686/order` and keep the HTML. Do not use the La Matcha page for this check.
3. Set the background to `#00aa00` (or `#00aa33` if it is already `#00aa00`).
4. Wait until the badge says **Có thay đổi** / **Changes** and the header says **Đã lưu** / **Saved**.
5. Fetch the public order page again. It must not contain the new color. Guests still see the published snapshot.
6. Set the color back to the original value. Wait for **Đã lưu**.
7. Open **Xuất bản** / **Publish** and choose **Xuất bản trực tuyến** / **Publish to Live**. Do not choose **Lưu nháp** / **Save as Draft**.
8. The badge returns to **Trực tuyến** / **Live**. The public HTML still does not contain the probe color.

If any step fails after the color change, put the original color back, wait for save, and publish to live before stopping.

## 6. Report

Say what passed, what failed, and the production commit. Call out anything only a person can finish:

- A real PayOS payment and the webhook
- Signup, password-reset, and team-invite email in an inbox
- A push notification on a phone
- A separate manager login (staff on La Matcha is already covered by this account)
- Printing a menu from the print dialog

Those are outside this run. Do not invent a live payment or a second user to cover them.
