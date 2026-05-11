'use client'

/**
 * ViewTracker — silently fires a single POST to /api/view/[slug] on mount.
 * No cookies, no personal data — just increments the daily visit counter.
 */

import { useEffect } from 'react'

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    // Fire-and-forget — don't await, don't show errors to visitors
    fetch(`/api/view/${slug}`, { method: 'POST' }).catch(() => {})
  }, [slug])

  return null
}
