'use client'

/**
 * ViewTracker — silently fires a single POST to /api/view/[slug] on mount.
 * No cookies, no personal data — just increments the daily visit counter
 * (optionally tagged with storefront content locale for analytics).
 */

import { useEffect } from 'react'

export function ViewTracker({
  slug,
  locale,
}: {
  slug: string
  /** Storefront content locale (e.g. en). Primary may be omitted. */
  locale?: string | null
}) {
  useEffect(() => {
    const params = new URLSearchParams()
    if (locale?.trim()) params.set('locale', locale.trim())
    const qs = params.toString()
    fetch(`/api/view/${slug}${qs ? `?${qs}` : ''}`, { method: 'POST' }).catch(() => {})
  }, [slug, locale])

  return null
}
