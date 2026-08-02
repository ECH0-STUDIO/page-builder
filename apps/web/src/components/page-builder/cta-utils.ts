/**
 * cta-utils.ts — pure utility functions for CtaButton, usable in both
 * server components (live page render) and client components (editor).
 *
 * No 'use client' directive — this is intentionally a shared module.
 */

import type { CtaButton } from './types'

/** Normalize a URL value — external hosts get https:// when missing. */
function resolveExternalUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return '#'
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed
  return `https://${trimmed}`
}

/** Build the href string from a CtaButton for anchors, tel, mailto, or URL. */
export function ctaHref(cta: CtaButton): string {
  switch (cta.action) {
    case 'tel':    return `tel:${cta.value}`
    case 'email':  return `mailto:${cta.value}`
    case 'anchor': return `#${cta.value.replace(/^#/, '')}`
    case 'url':
    default:       return resolveExternalUrl(cta.value)
  }
}

export function ctaOpensNewTab(cta: CtaButton): boolean {
  return cta.action === 'url' && (cta.open_in_new_tab ?? false)
}
