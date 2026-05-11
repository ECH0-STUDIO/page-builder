/**
 * cta-utils.ts — pure utility functions for CtaButton, usable in both
 * server components (live page render) and client components (editor).
 *
 * No 'use client' directive — this is intentionally a shared module.
 */

import type { CtaButton } from './types'

/** Build the href string from a CtaButton for anchors, tel, mailto, or URL. */
export function ctaHref(cta: CtaButton): string {
  switch (cta.action) {
    case 'tel':    return `tel:${cta.value}`
    case 'email':  return `mailto:${cta.value}`
    case 'anchor': return `#${cta.value.replace(/^#/, '')}`
    default:       return cta.value
  }
}
