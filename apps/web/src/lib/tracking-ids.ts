/**
 * Normalize / validate third-party tracking IDs before save and script injection.
 * Rejects whitespace-only values and characters that would break inline scripts.
 */

function trimOrEmpty(raw: string | null | undefined): string {
  return typeof raw === 'string' ? raw.trim() : ''
}

/** GA4 (G-), Universal Analytics (UA-), Google Ads (AW-), Google Tags (GT-). */
const GA_ID_RE = /^(G-[A-Z0-9]+|UA-\d{4,}-\d+|AW-[A-Z0-9]+|GT-[A-Z0-9]+)$/i

/** Meta / Facebook pixel — digits only, typically 15–16. */
const FB_PIXEL_RE = /^\d{5,20}$/

/** TikTok pixel — usually starts with C followed by alphanumerics. */
const TIKTOK_PIXEL_RE = /^C[A-Z0-9]{10,30}$/i

/** Google Search Console verification token (meta content value). */
const GSC_RE = /^[A-Za-z0-9_-]{8,100}$/

export function normalizeGoogleAnalyticsId(raw: string | null | undefined): string | null {
  const v = trimOrEmpty(raw)
  if (!v) return null
  return GA_ID_RE.test(v) ? v.toUpperCase() : null
}

export function isValidGoogleAnalyticsId(raw: string | null | undefined): boolean {
  const v = trimOrEmpty(raw)
  return v.length === 0 || GA_ID_RE.test(v)
}

export function normalizeFacebookPixelId(raw: string | null | undefined): string | null {
  const v = trimOrEmpty(raw)
  if (!v) return null
  return FB_PIXEL_RE.test(v) ? v : null
}

export function isValidFacebookPixelId(raw: string | null | undefined): boolean {
  const v = trimOrEmpty(raw)
  return v.length === 0 || FB_PIXEL_RE.test(v)
}

export function normalizeTikTokPixelId(raw: string | null | undefined): string | null {
  const v = trimOrEmpty(raw)
  if (!v) return null
  return TIKTOK_PIXEL_RE.test(v) ? v : null
}

export function isValidTikTokPixelId(raw: string | null | undefined): boolean {
  const v = trimOrEmpty(raw)
  return v.length === 0 || TIKTOK_PIXEL_RE.test(v)
}

export function normalizeGscVerification(raw: string | null | undefined): string | null {
  const v = trimOrEmpty(raw)
  if (!v) return null
  // Allow pasting the full meta tag; extract content="..."
  const fromTag = v.match(/content\s*=\s*["']([^"']+)["']/i)?.[1]?.trim()
  const token = fromTag || v
  return GSC_RE.test(token) ? token : null
}

export function isValidGscVerification(raw: string | null | undefined): boolean {
  const v = trimOrEmpty(raw)
  if (!v) return true
  const fromTag = v.match(/content\s*=\s*["']([^"']+)["']/i)?.[1]?.trim()
  return GSC_RE.test(fromTag || v)
}

export interface TrackingIds {
  googleAnalyticsId: string | null
  facebookPixelId: string | null
  tiktokPixelId: string | null
  gscVerification: string | null
}

export function resolveTrackingIds(input: {
  google_analytics_id?: string | null
  facebook_pixel_id?: string | null
  tiktok_pixel_id?: string | null
  gsc_verification?: string | null
} | null | undefined): TrackingIds {
  return {
    googleAnalyticsId: normalizeGoogleAnalyticsId(input?.google_analytics_id),
    facebookPixelId: normalizeFacebookPixelId(input?.facebook_pixel_id),
    tiktokPixelId: normalizeTikTokPixelId(input?.tiktok_pixel_id),
    gscVerification: normalizeGscVerification(input?.gsc_verification),
  }
}
