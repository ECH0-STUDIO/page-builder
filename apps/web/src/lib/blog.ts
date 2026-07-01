import type { SupportedLocale } from '@/i18n/locale'
import { isPublishedBlogRow, resolveSheetHeaders } from '@/lib/blog-sheet'
import { collectionIdToLocale } from '@/lib/marketing-locale'

export type BlogPost = {
  slug: string
  /** Webflow Item ID — stable identifier across language variants. */
  itemId: string
  /** Webflow Collection ID locale: vi | en */
  locale: SupportedLocale
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

function toDisplayDate(publishedOn: string, date: string, locale: SupportedLocale): string {
  const raw = date || publishedOn
  if (!raw) return ''
  const parsed = parseGvizDate(raw)
  if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
    const d = new Date(`${parsed}T12:00:00`)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    }
  }
  return parsed
}

function rowToPost(row: Record<string, string>): BlogPost {
  const summary = row.Summary ?? ''
  const locale = collectionIdToLocale(row['Collection ID'] ?? '') ?? 'vi'
  return {
    slug: row.Slug.trim(),
    itemId: row['Item ID']?.trim() ?? '',
    locale,
    title: row.Name.trim(),
    summary,
    excerpt: summary,
    publishedAt: toIsoDate(row['Published On'] ?? '', row.Date ?? ''),
    date: toDisplayDate(row['Published On'] ?? '', row.Date ?? '', locale),
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
}

function parseAllPosts(json: {
  table: {
    rows: { c: GvizCell[] }[]
  }
}): BlogPost[] {
  const rows = json.table.rows
  if (rows.length < 1) return []

  const { headers, dataStart } = resolveSheetHeaders(
    rows as { c: ({ v?: unknown; f?: string } | null)[] | null }[],
  )

  return rows
    .slice(dataStart)
    .map((row) => {
      const record: Record<string, string> = {}
      row.c.forEach((cell, index) => {
        const key = headers[index]
        if (key) record[key] = cellValue(cell)
      })
      return record
    })
    .filter(isPublishedBlogRow)
    .map(rowToPost)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

let cachedPosts: BlogPost[] | null = null
let cacheTime = 0
const CACHE_MS = 60_000

async function fetchAllPosts(): Promise<BlogPost[]> {
  const now = Date.now()
  if (cachedPosts && now - cacheTime < CACHE_MS) return cachedPosts

  const sheetId = getSheetId()
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`)

  const text = await res.text()
  const jsonText = text
    .replace(/^\/\*[\s\S]*?\*\/\s*/, '')
    .replace(/^.*google\.visualization\.Query\.setResponse\(/, '')
    .replace(/\);?\s*$/, '')
  const json = JSON.parse(jsonText)
  cachedPosts = parseAllPosts(json)
  cacheTime = now
  return cachedPosts
}

export async function getBlogPosts(locale: SupportedLocale): Promise<BlogPost[]> {
  try {
    const posts = await fetchAllPosts()
    return posts.filter((post) => post.locale === locale)
  } catch (err) {
    console.error('getBlogPosts: failed to load sheet', getSheetId(), err)
    return []
  }
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    return await fetchAllPosts()
  } catch (err) {
    console.error('getAllBlogPosts: failed to load sheet', getSheetId(), err)
    return []
  }
}

export async function getBlogPost(slug: string, locale: SupportedLocale): Promise<BlogPost | null> {
  const posts = await getBlogPosts(locale)
  return posts.find((p) => p.slug === slug) ?? null
}

export async function getBlogPostByItemId(
  itemId: string,
  locale: SupportedLocale,
): Promise<BlogPost | null> {
  if (!itemId) return null
  const posts = await getBlogPosts(locale)
  return posts.find((p) => p.itemId === itemId) ?? null
}
