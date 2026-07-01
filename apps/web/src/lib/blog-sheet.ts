/** Webflow CMS export column order when gviz does not expose column labels. */
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

type GvizRow = { c: ({ v?: unknown; f?: string } | null)[] | null }

function rowCells(row: GvizRow | undefined): string[] {
  return (
    row?.c?.map((cell) => {
      if (!cell) return ''
      if (cell.f) return String(cell.f).trim()
      if (cell.v != null) return String(cell.v).trim()
      return ''
    }) ?? []
  )
}

function isHeaderRow(cells: string[]): boolean {
  return cells[0] === 'Name' && cells[1] === 'Slug'
}

/**
 * Google Sheets gviz puts row 1 labels in `table.cols` — data rows never include the header.
 * Some exports duplicate the header as the first data row; skip that when detected.
 */
export function resolveSheetHeaders(
  cols: { label?: string | null }[],
  rows: GvizRow[],
): {
  headers: string[]
  dataStart: number
} {
  const colLabels = cols.map((col) => col.label?.trim() ?? '')
  const hasColHeaders = colLabels[0] === 'Name' && colLabels[1] === 'Slug'

  if (hasColHeaders) {
    const firstRow = rowCells(rows[0])
    const dataStart = isHeaderRow(firstRow) ? 1 : 0
    return { headers: colLabels, dataStart }
  }

  const firstRow = rowCells(rows[0])
  if (isHeaderRow(firstRow)) {
    return { headers: firstRow, dataStart: 1 }
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

  // Webflow locale collections may omit publish dates on re-export
  const collectionId = row['Collection ID']?.trim().toLowerCase()
  return collectionId === 'vi' || collectionId === 'en'
}
