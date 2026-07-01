# Eatery Webflow export (source of truth)

**Do not edit files here by hand** unless you are updating the Webflow design.

The marketing site is served as **raw Webflow HTML** — not React components.

## First-time setup (required)

Copy your Webflow export from Downloads, then sync:

```bash
pnpm import:eatery-export "/Users/mac/Downloads/Eatery Marketing Website"
```

Or manually:

```bash
rm -rf design/webflow-export/*
cp -R ~/Downloads/Eatery\ Marketing\ Website/* design/webflow-export/
pnpm sync:marketing
rm -rf apps/web/.next
pnpm dev
```

## Expected pages

- `index.html` — homepage (Vietnamese default content)
- `blog.html`, `detail_blog.html`
- `features.html`, `pricing.html`, `contact.html`
- `css/`, `js/`, `images/`

If you see **Nexbet** or **Temlis** branding, you have the wrong export folder.

## After Webflow design changes

Re-export from Webflow, then run `pnpm import:eatery-export` again.
