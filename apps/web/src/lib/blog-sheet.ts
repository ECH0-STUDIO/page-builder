/** Webflow CMS export column order when the header row is missing from the sheet. */
export const WEBFLOW_BLOG_HEADERS = [
  'Name',
  'Slug',
  'Collection ID',
  'Locale ID',
  'Item ID',
  'Archived',
  'Draft',
  'Created On',
  'Updated On',
  'Published On',
  'Date',
  'Thumbnail',
  'Summary',
  'Avatar',
  'Author',
  'Role',
  'Social First',
  'Social Second',
  'Social Third',
  'Category',
  'Reading',
  'Overview',
] as const

function isHeaderRow(cells: string[]): boolean {
  return cells[0] === 'Name' && cells[1] === 'Slug'
}

export function resolveSheetHeaders(rows: { c: ({ v?: unknown; f?: string } | null)[] | null }[]): {
  headers: string[]
  dataStart: number
} {
  const first =
    rows[0]?.c?.map((c) => {
      if (!c) return ''
      if (c.f) return String(c.f).trim()
      if (c.v != null) return String(c.v).trim()
      return ''
    }) ?? []

  if (isHeaderRow(first)) {
    return { headers: first, dataStart: 1 }
  }

  return { headers: [...WEBFLOW_BLOG_HEADERS], dataStart: 0 }
}

export function isPublishedBlogRow(row: Record<string, string>): boolean {
  if (row.Archived?.toUpperCase() === 'TRUE') return false
  if (row.Draft?.toUpperCase() === 'TRUE') return false
  if (!row.Slug?.trim() || !row.Name?.trim()) return false

  const publishedOn = row['Published On']?.trim()
  const date = row.Date?.trim()
  if (publishedOn || date) return true

  // Allow locale-tagged rows even when publish dates were not re-exported
  const collectionId = row['Collection ID']?.trim().toLowerCase()
  return collectionId === 'vi' || collectionId === 'en'
}
