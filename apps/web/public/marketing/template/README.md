# Eatery page template images

Place template placeholder photos in **this folder** on your machine:

```text
apps/web/public/marketing/template/
```

Full path on your Mac:

```text
/Users/mac/page-builder/apps/web/public/marketing/template/
```

They are served at `/marketing/template/<filename>` on the live site.

## Expected files

| Filename | Template | Used in |
|----------|----------|---------|
| `street-food-hero.jpg` | Street Food | Hero (overlay) |
| `street-food-about.jpg` | Street Food | About section |
| `garden-cafe-hero.jpg` | Garden Café | Hero (split) |
| `garden-cafe-about.jpg` | Garden Café | About section |
| `heritage-hero.jpg` | Heritage Kitchen | Hero (overlay) |
| `heritage-about.jpg` | Heritage Kitchen | About section |

**Fast Casual** uses a text-only hero — no image required.

This folder also contains Webflow marketing HTML (`style-guide.html`, etc.) — the JPG/PNG files sit alongside those; that is fine.

After adding images locally, **commit and push** so the cloud build can see them.
