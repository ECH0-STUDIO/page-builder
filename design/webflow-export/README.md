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

If `blog.html` (or other pages) are missing, `/blog` will fall back to `/#blog` on the homepage instead of serving a dedicated listing page.
