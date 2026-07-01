export type BlogPost = {
  slug: string
  title: string
  /** Short summary (Webflow "Summary" column). */
  summary: string
  /** Alias for summary — used by sitemap and legacy callers. */
  excerpt: string
  publishedAt: string
  /** Display date from the "Date" column (falls back to Published On). */
  date: string
  author: string
  role: string
  avatar: string
  thumbnail: string
  category: string
  reading: string
  socialFirst: string
  socialSecond: string
  socialThird: string
  /** Rich HTML body (Webflow "Overview" column). */
  body: string
}

type GvizCell = { v: string | number | null; f?: string } | null

/** Default sheet for Eatery marketing blog (override with BLOG_GOOGLE_SHEET_ID). */
export const DEFAULT_BLOG_SHEET_ID = '1tZQ1YEW-NnShU7yTZqNYRhO13EpBxwyOqAVqLvgNdUg'

/**
 * Google Sheet: Webflow CMS export (row 1 = header).
 *
 * Expected columns: Name, Slug, Archived, Draft, Published On, Date,
 * Thumbnail, Summary, Avatar, Author, Role, Social First/Second/Third,
 * Category, Reading, Overview
 *
 * Share sheet: Anyone with the link can view.
 * Set BLOG_GOOGLE_SHEET_ID in env to override the default sheet.
 */
function getSheetId(): string {
  return process.env.BLOG_GOOGLE_SHEET_ID?.trim() || DEFAULT_BLOG_SHEET_ID
}

function cellValue(cell: GvizCell): string {
  if (!cell) return ''
  if (cell.f) return String(cell.f).trim()
  if (cell.v != null) return String(cell.v).trim()
  return ''
}

function parseGvizDate(value: string): string {
  const match = value.match(/^Date\((\d+),(\d+),(\d+)\)$/)
  if (!match) return value
  const year = match[1]
  const month = String(Number(match[2]) + 1).padStart(2, '0')
  const day = String(Number(match[3])).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toIsoDate(publishedOn: string, date: string): string {
  const raw = publishedOn || date
  if (!raw) return new Date().toISOString().slice(0, 10)
  const parsed = parseGvizDate(raw)
  if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) return parsed
  const d = new Date(parsed)
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return new Date().toISOString().slice(0, 10)
}

function toDisplayDate(publishedOn: string, date: string): string {
  const raw = date || publishedOn
  if (!raw) return ''
  const parsed = parseGvizDate(raw)
  if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
    const d = new Date(`${parsed}T12:00:00`)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }
  return parsed
}

function parseGvizRows(json: {
  table: {
    rows: { c: GvizCell[] }[]
  }
}): BlogPost[] {
  const rows = json.table.rows
  if (rows.length < 2) return []

  const headers = rows[0].c.map((c) => cellValue(c))

  return rows
    .slice(1)
    .map((row) => {
      const record: Record<string, string> = {}
      row.c.forEach((cell, index) => {
        const key = headers[index]
        if (key) record[key] = cellValue(cell)
      })
      return record
    })
    .filter((row) => row.Slug && row.Name)
    .filter((row) => row.Archived?.toUpperCase() !== 'TRUE')
    .filter((row) => row.Draft?.toUpperCase() !== 'TRUE')
    .map((row) => {
      const summary = row.Summary ?? ''
      return {
        slug: row.Slug.trim(),
        title: row.Name.trim(),
        summary,
        excerpt: summary,
        publishedAt: toIsoDate(row['Published On'] ?? '', row.Date ?? ''),
        date: toDisplayDate(row['Published On'] ?? '', row.Date ?? ''),
        author: row.Author?.trim() ?? '',
        role: row.Role?.trim() ?? '',
        avatar: row.Avatar?.trim() ?? '',
        thumbnail: row.Thumbnail?.trim() ?? '',
        category: row.Category?.trim() ?? '',
        reading: row.Reading?.trim() ?? '',
        socialFirst: row['Social First']?.trim() ?? '',
        socialSecond: row['Social Second']?.trim() ?? '',
        socialThird: row['Social Third']?.trim() ?? '',
        body: row.Overview?.trim() ?? '',
      }
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const sheetId = getSheetId()

  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`)

    const text = await res.text()
    const jsonText = text
      .replace(/^\/\*[\s\S]*?\*\/\s*/, '')
      .replace(/^.*google\.visualization\.Query\.setResponse\(/, '')
      .replace(/\);?\s*$/, '')
    const json = JSON.parse(jsonText)
    return parseGvizRows(json)
  } catch (err) {
    console.error('getBlogPosts: failed to load sheet', sheetId, err)
    return []
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const posts = await getBlogPosts()
  return posts.find((p) => p.slug === slug) ?? null
}
