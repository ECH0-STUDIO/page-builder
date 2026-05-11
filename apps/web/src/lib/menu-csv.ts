/**
 * menu-csv.ts — Menu CSV import/export utilities
 *
 * CSV columns (order must match):
 *   category, name, description, price, available
 *
 * Rules:
 *  - First row is the header (case-insensitive)
 *  - price must be a non-negative number
 *  - available must be 'true' or 'false' (default: true if empty)
 *  - Empty name rows are skipped
 *  - Categories are auto-created if they don't exist
 *  - Items matched by (category + name, case-insensitive) — updates if found, inserts if new
 */

export const CSV_HEADERS = ['category', 'name', 'description', 'price', 'available', 'options'] as const
export type CsvHeader = typeof CSV_HEADERS[number]

export interface CsvRow {
  category: string
  name: string
  description: string
  price: number
  available: boolean
  optionsStr?: string
}

export interface CsvValidationError {
  row: number   // 1-indexed (after header)
  column: string
  message: string
}

export interface CsvParseResult {
  rows: CsvRow[]
  errors: CsvValidationError[]
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function buildMenuCsv(
  categories: { id: string; name: string }[],
  items: { id: string; category_id: string; name: string; description: string | null; price: number; available: boolean }[],
  variantGroups: { id: string; item_id: string; name: string; required: boolean }[] = [],
  variantOptions: { group_id: string; label: string; price_delta: number }[] = []
): string {
  const lines: string[] = [CSV_HEADERS.join(',')]

  for (const cat of categories) {
    const catItems = items.filter(i => i.category_id === cat.id)
    for (const item of catItems) {
      // Build options string
      // Format: "Size (Required): Small (+0), Large (+10) | Milk: Whole (+0), Oat (+5)"
      const itemGroups = variantGroups.filter(g => g.item_id === item.id)
      let optionsStr = ''
      if (itemGroups.length > 0) {
        optionsStr = itemGroups.map(g => {
          const gOpts = variantOptions.filter(o => o.group_id === g.id)
          const optsStr = gOpts.map(o => `${o.label} (+${o.price_delta})`).join(', ')
          return `${g.name}${g.required ? ' (Required)' : ''}: ${optsStr}`
        }).join(' | ')
      }

      lines.push([
        csvEscape(cat.name),
        csvEscape(item.name),
        csvEscape(item.description ?? ''),
        item.price.toString(),
        item.available ? 'true' : 'false',
        csvEscape(optionsStr)
      ].join(','))
    }
  }

  return lines.join('\n')
}

function csvEscape(value: string): string {
  // Wrap in quotes if value contains comma, quote, or newline
  if (/[,"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// ─── Parse ────────────────────────────────────────────────────────────────────

export function parseMenuCsv(csvText: string): CsvParseResult {
  const rows: CsvRow[] = []
  const errors: CsvValidationError[] = []

  const lines = splitCsvLines(csvText.trim())
  if (lines.length === 0) {
    return { rows: [], errors: [{ row: 0, column: 'header', message: 'CSV file is empty' }] }
  }

  // Validate headers
  const headerLine = parseCsvLine(lines[0])
  const normalizedHeaders = headerLine.map(h => h.trim().toLowerCase())
  const missingHeaders = CSV_HEADERS.filter(h => h !== 'options' && !normalizedHeaders.includes(h))
  if (missingHeaders.length > 0) {
    return {
      rows: [],
      errors: [{
        row: 0,
        column: 'header',
        message: `Missing required columns: ${missingHeaders.join(', ')}. Download the sample CSV for the correct format.`,
      }],
    }
  }

  // Map header positions (supports any column order)
  const colIndex: Record<CsvHeader, number> = {
    category:    normalizedHeaders.indexOf('category'),
    name:        normalizedHeaders.indexOf('name'),
    description: normalizedHeaders.indexOf('description'),
    price:       normalizedHeaders.indexOf('price'),
    available:   normalizedHeaders.indexOf('available'),
    options:     normalizedHeaders.indexOf('options'),
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const rowNum = i  // 1-indexed display
    const cols = parseCsvLine(lines[i])

    const get = (h: CsvHeader) => (cols[colIndex[h]] ?? '').trim()

    // Skip blank rows
    if (cols.every(c => c.trim() === '')) continue

    const name = get('name')
    if (!name) {
      errors.push({ row: rowNum, column: 'name', message: 'Name is required' })
      continue
    }

    const category = get('category')
    if (!category) {
      errors.push({ row: rowNum, column: 'category', message: 'Category is required' })
      continue
    }

    const priceRaw = get('price')
    const price = parseFloat(priceRaw)
    if (isNaN(price) || price < 0) {
      errors.push({ row: rowNum, column: 'price', message: `Invalid price: "${priceRaw}"` })
      continue
    }

    const availableRaw = get('available').toLowerCase()
    const available = availableRaw === '' || availableRaw === 'true' || availableRaw === '1'

    const optionsStr = colIndex.options >= 0 ? get('options') : undefined

    rows.push({ category, name, description: get('description'), price, available, optionsStr })
  }

  return { rows, errors }
}

// ─── Merge diff ───────────────────────────────────────────────────────────────

export interface ParsedOption {
  label: string
  priceDelta: number
}
export interface ParsedVariantGroup {
  name: string
  required: boolean
  options: ParsedOption[]
}

export function parseOptionsString(str: string): ParsedVariantGroup[] {
  if (!str) return []
  const groups: ParsedVariantGroup[] = []
  
  const groupStrs = str.split('|')
  for (const gStr of groupStrs) {
    const trimmed = gStr.trim()
    if (!trimmed) continue
    
    const colonIdx = trimmed.indexOf(':')
    if (colonIdx === -1) continue
    
    let gName = trimmed.slice(0, colonIdx).trim()
    let required = false
    if (gName.toLowerCase().endsWith('(required)')) {
      required = true
      gName = gName.slice(0, -'(required)'.length).trim()
    }
    
    const optsStr = trimmed.slice(colonIdx + 1).trim()
    const optStrs = optsStr.split(',')
    const options: ParsedOption[] = []
    
    for (const optStr of optStrs) {
      const oTrimmed = optStr.trim()
      if (!oTrimmed) continue
      
      const match = oTrimmed.match(/^(.*?)\s*\(\s*([+-]?\d+(?:\.\d+)?)\s*\)$/)
      if (match) {
        options.push({ label: match[1].trim(), priceDelta: parseFloat(match[2]) })
      } else {
        options.push({ label: oTrimmed, priceDelta: 0 })
      }
    }
    
    if (gName && options.length > 0) {
      groups.push({ name: gName, required, options })
    }
  }
  
  return groups
}

export interface MergeResult {
  toCreate: { categoryName: string; name: string; description: string; price: number; available: boolean; parsedOptions?: ParsedVariantGroup[] }[]
  toUpdate: { id: string; name: string; description: string; price: number; available: boolean; parsedOptions?: ParsedVariantGroup[] }[]
  newCategories: string[]  // category names to auto-create
  stats: { added: number; updated: number; unchanged: number }
}

export function computeMerge(
  csvRows: CsvRow[],
  existingCategories: { id: string; name: string }[],
  existingItems: { id: string; category_id: string; name: string; description: string | null; price: number; available: boolean }[],
  existingVariantGroups: { id: string; item_id: string; name: string; required: boolean }[] = [],
  existingVariantOptions: { group_id: string; label: string; price_delta: number }[] = []
): MergeResult {
  const toCreate: MergeResult['toCreate'] = []
  const toUpdate: MergeResult['toUpdate'] = []
  const newCategoryNames: string[] = []
  let unchanged = 0

  // Build lookup maps (case-insensitive)
  const catMap = new Map(existingCategories.map(c => [c.name.toLowerCase(), c]))
  const itemKey = (catId: string, name: string) => `${catId}::${name.toLowerCase()}`
  const itemMap = new Map(existingItems.map(i => [itemKey(i.category_id, i.name), i]))

  // Collect new categories (deduplicated)
  const seenNewCats = new Set<string>()
  for (const row of csvRows) {
    const catLower = row.category.toLowerCase()
    if (!catMap.has(catLower) && !seenNewCats.has(catLower)) {
      seenNewCats.add(catLower)
      newCategoryNames.push(row.category)
    }
  }

  for (const row of csvRows) {
    const catLower = row.category.toLowerCase()
    const cat = catMap.get(catLower)

    if (!cat) {
      // Category doesn't exist yet → will be created → queue item for create
      const parsedOptions = row.optionsStr !== undefined ? parseOptionsString(row.optionsStr) : undefined
      toCreate.push({ categoryName: row.category, name: row.name, description: row.description, price: row.price, available: row.available, parsedOptions })
      continue
    }

    const existing = itemMap.get(itemKey(cat.id, row.name))
    if (!existing) {
      const parsedOptions = row.optionsStr !== undefined ? parseOptionsString(row.optionsStr) : undefined
      toCreate.push({ categoryName: row.category, name: row.name, description: row.description, price: row.price, available: row.available, parsedOptions })
    } else {
      // Check if anything changed
      const itemGroups = existingVariantGroups.filter(g => g.item_id === existing.id)
      let existingOptionsStr = ''
      if (itemGroups.length > 0) {
        existingOptionsStr = itemGroups.map(g => {
          const gOpts = existingVariantOptions.filter(o => o.group_id === g.id)
          const optsStr = gOpts.map(o => `${o.label} (+${o.price_delta})`).join(', ')
          return `${g.name}${g.required ? ' (Required)' : ''}: ${optsStr}`
        }).join(' | ')
      }

      const optionsChanged = row.optionsStr !== undefined && row.optionsStr.trim() !== existingOptionsStr
      
      const changed =
        existing.description !== (row.description || null) ||
        existing.price !== row.price ||
        existing.available !== row.available ||
        optionsChanged

      if (changed) {
        const parsedOptions = optionsChanged ? parseOptionsString(row.optionsStr || '') : undefined
        toUpdate.push({ id: existing.id, name: row.name, description: row.description, price: row.price, available: row.available, parsedOptions })
      } else {
        unchanged++
      }
    }
  }

  return {
    toCreate,
    toUpdate,
    newCategories: newCategoryNames,
    stats: { added: toCreate.length, updated: toUpdate.length, unchanged },
  }
}

// ─── Sample CSV ───────────────────────────────────────────────────────────────

export const SAMPLE_CSV = `category,name,description,price,available
Starters,Spring Rolls,"Crispy vegetable spring rolls, served with sweet chilli sauce",45000,true
Starters,Soup of the Day,Ask your server for today's selection,35000,true
Main Course,Grilled Salmon,Atlantic salmon fillet with seasonal vegetables,185000,true
Main Course,Beef Pho,Traditional Vietnamese noodle soup with rare beef,75000,true
Desserts,Mango Sticky Rice,Thai-style with coconut cream,55000,true
`

// ─── CSV line parser (handles quoted fields) ──────────────────────────────────

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

function splitCsvLines(text: string): string[] {
  // Split on newlines that are not inside quoted fields
  const lines: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
      current += ch
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (current) lines.push(current)
      current = ''
      if (ch === '\r' && text[i + 1] === '\n') i++
    } else {
      current += ch
    }
  }
  if (current) lines.push(current)
  return lines
}
