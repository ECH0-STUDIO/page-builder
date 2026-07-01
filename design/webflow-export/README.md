# Webflow marketing export

Drop the **full** Webflow code export here before running `pnpm sync:marketing`.

Expected top-level HTML pages:

- `index.html`
- `blog.html`
- `detail_blog.html`
- `features.html`
- `pricing.html`
- `contact.html`

Plus `css/`, `js/`, and `images/` folders.

If `blog.html` is missing from the export, `pnpm sync:marketing` auto-generates a fallback from `index.html`.
