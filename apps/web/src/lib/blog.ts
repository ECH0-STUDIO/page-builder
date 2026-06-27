export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  author: string
  body: string
}

/**
 * Google Sheet columns (row 1 = header):
 * slug | title | excerpt | date | author | body | published
 *
 * - published: TRUE or FALSE
 * - body: paragraphs separated by blank lines (use Alt+Enter in Sheets)
 * - Share sheet: File → Share → Anyone with the link can view
 *
 * Set BLOG_GOOGLE_SHEET_ID in env (the ID from the sheet URL).
 */
const FALLBACK_POSTS: BlogPost[] = [
  {
    slug: 'why-credit-based-pricing-works-for-restaurants',
    title: 'Why credit-based pricing works for restaurants',
    excerpt:
      'No monthly plans you do not use. Buy credits when you need premium features — custom domains, extra storage — and spend only what your business needs.',
    publishedAt: '2026-03-01',
    author: 'Eatery Team',
    body: `Traditional SaaS charges every restaurant the same monthly fee — whether you publish once a year or run five locations.

Eatery flips that model. The page builder, QR menus, and publishing tools are free to start. When you want premium add-ons, you buy credits and spend them only on what you use.

Custom domain? 50 credits per month while it is connected. Extra gallery storage? About 1 credit per 20 MB. No credits spent means no surprise bills.

That is especially important for seasonal businesses, new openings, and owners who want to test digital menus before committing to a big subscription.`,
  },
  {
    slug: 'launch-your-digital-menu-in-a-weekend',
    title: 'Launch your digital menu in a weekend',
    excerpt:
      'A practical checklist: photos, menu items, one hero block, and a QR code on every table.',
    publishedAt: '2026-02-15',
    author: 'Eatery Team',
    body: `You do not need an agency to go digital. Here is a weekend plan that works for most cafes and restaurants.

Friday evening: gather your best dish photos and export your current menu as a simple list with prices.

Saturday morning: create your Eatery account, add your business, and pick a page template. Drop in your hero image and top sellers first.

Saturday afternoon: build your menu categories in the dashboard and link them to your public page.

Sunday: generate table QR codes, print them, and test ordering or payment flows on your phone.

By Monday lunch service, guests can scan and browse without waiting for a printed menu.`,
  },
]

function parseGvizRows(json: {
  table: {
    cols: { label: string }[]
    rows: { c: ({ v: string | number | null } | null)[] }[]
  }
}): BlogPost[] {
  const rows = json.table.rows
  if (rows.length < 2) return []

  return rows
    .slice(1)
    .map((row) => {
      const cells = row.c.map((c) => (c?.v != null ? String(c.v) : ''))
      const [slug, title, excerpt, date, author, body, published] = cells
      return { slug, title, excerpt, date, author, body, published }
    })
    .filter((row) => row.slug && row.title && row.published?.toUpperCase() === 'TRUE')
    .map((row) => ({
      slug: row.slug.trim(),
      title: row.title.trim(),
      excerpt: row.excerpt.trim(),
      publishedAt: row.date.trim() || new Date().toISOString().slice(0, 10),
      author: row.author.trim() || 'Eatery Team',
      body: row.body.trim(),
    }))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const sheetId = process.env.BLOG_GOOGLE_SHEET_ID
  if (!sheetId) return FALLBACK_POSTS

  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=Posts`
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`)

    const text = await res.text()
    const json = JSON.parse(text.replace(/^.*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, ''))
    const posts = parseGvizRows(json)
    return posts.length > 0 ? posts : FALLBACK_POSTS
  } catch (err) {
    console.error('getBlogPosts:', err)
    return FALLBACK_POSTS
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const posts = await getBlogPosts()
  return posts.find((p) => p.slug === slug) ?? null
}

export function renderBlogBody(body: string): string[] {
  return body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
}
