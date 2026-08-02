/**
 * Convert a Google Maps share/place URL into an embeddable iframe src.
 * Falls back to null when the URL cannot be used.
 */

export function toGoogleMapsEmbedUrl(raw: string | null | undefined): string | null {
  const url = (raw ?? '').trim()
  if (!url) return null

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase()
    if (!host.includes('google.') && host !== 'maps.app.goo.gl' && host !== 'goo.gl') {
      return null
    }

    // Already an embed URL
    if (parsed.pathname.includes('/maps/embed') || parsed.searchParams.get('output') === 'embed') {
      return parsed.toString()
    }

    // Extract coordinates from @lat,lng in path
    const atMatch = parsed.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (atMatch) {
      const [, lat, lng] = atMatch
      return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
    }

    // Place / search query param
    const q =
      parsed.searchParams.get('q') ||
      parsed.searchParams.get('query') ||
      (() => {
        const placeMatch = parsed.pathname.match(/\/place\/([^/]+)/)
        return placeMatch ? decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')) : null
      })()

    if (q) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`
    }

    // Short links / unknown shape — let Maps resolve via q= full URL
    return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&output=embed`
  } catch {
    return null
  }
}

export function mapsEmbedFromBusiness(opts: {
  googleMapsUrl?: string | null
  address?: string | null
  city?: string | null
}): string | null {
  const fromUrl = toGoogleMapsEmbedUrl(opts.googleMapsUrl)
  if (fromUrl) return fromUrl

  const parts = [opts.address, opts.city].filter(Boolean)
  if (parts.length === 0) return null
  return `https://maps.google.com/maps?q=${encodeURIComponent(parts.join(', '))}&output=embed`
}
