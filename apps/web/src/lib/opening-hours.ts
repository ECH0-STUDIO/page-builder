/**
 * Opening-hours helpers for dine-in ordering.
 * Hours are stored as naive local strings; interpret in Asia/Ho_Chi_Minh
 * until businesses have an explicit timezone field.
 */

export type OpeningHoursEntry = {
  day: string
  open: boolean
  from: string
  to: string
}

export const BUSINESS_TIMEZONE = 'Asia/Ho_Chi_Minh'

const DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const

function parseHm(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  return hours * 60 + minutes
}

/** Weekday key + minutes-since-midnight in the business timezone. */
export function getZonedDayAndMinutes(
  now: Date = new Date(),
  timeZone: string = BUSINESS_TIMEZONE,
): { dayKey: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)

  const weekday = parts.find(p => p.type === 'weekday')?.value ?? 'Mon'
  const hour = Number(parts.find(p => p.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find(p => p.type === 'minute')?.value ?? '0')

  const weekdayMap: Record<string, string> = {
    Sun: 'sunday',
    Mon: 'monday',
    Tue: 'tuesday',
    Wed: 'wednesday',
    Thu: 'thursday',
    Fri: 'friday',
    Sat: 'saturday',
  }

  return {
    dayKey: weekdayMap[weekday] ?? DAY_KEYS[now.getUTCDay()] ?? 'monday',
    minutes: hour * 60 + minute,
  }
}

export function normalizeOpeningHours(raw: unknown): OpeningHoursEntry[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row): OpeningHoursEntry | null => {
      if (!row || typeof row !== 'object') return null
      const r = row as Record<string, unknown>
      const day = typeof r.day === 'string' ? r.day.toLowerCase() : ''
      if (!day) return null
      return {
        day,
        open: Boolean(r.open),
        from: typeof r.from === 'string' ? r.from : '',
        to: typeof r.to === 'string' ? r.to : '',
      }
    })
    .filter((row): row is OpeningHoursEntry => row != null)
}

/**
 * Whether the business accepts orders right now.
 * - Empty / missing hours → open (don't lock stores that never set hours)
 * - Day marked closed → closed
 * - Same-day window: from inclusive, to exclusive
 * - Overnight (to <= from): open from `from` through midnight, and midnight through `to`
 */
export function isBusinessOpenNow(
  hours: OpeningHoursEntry[] | null | undefined,
  now: Date = new Date(),
  timeZone: string = BUSINESS_TIMEZONE,
): boolean {
  const normalized = normalizeOpeningHours(hours)
  if (normalized.length === 0) return true

  const { dayKey, minutes } = getZonedDayAndMinutes(now, timeZone)
  const today = normalized.find(h => h.day === dayKey)
  if (!today || !today.open) return false

  const from = parseHm(today.from)
  const to = parseHm(today.to)
  if (from == null || to == null) return today.open

  if (from === to) return true // treat identical times as 24h open that day

  if (to > from) {
    return minutes >= from && minutes < to
  }

  // Overnight: e.g. 22:00 → 02:00
  return minutes >= from || minutes < to
}

/** Today's hours entry for display (may be closed). */
export function getTodayHours(
  hours: OpeningHoursEntry[] | null | undefined,
  now: Date = new Date(),
  timeZone: string = BUSINESS_TIMEZONE,
): OpeningHoursEntry | null {
  const normalized = normalizeOpeningHours(hours)
  if (normalized.length === 0) return null
  const { dayKey } = getZonedDayAndMinutes(now, timeZone)
  return normalized.find(h => h.day === dayKey) ?? null
}

export function formatHoursRange(entry: OpeningHoursEntry | null): string | null {
  if (!entry || !entry.open) return null
  if (!entry.from || !entry.to) return null
  return `${entry.from} – ${entry.to}`
}
