/**
 * Navbar link helpers — shared between editor settings and live render.
 */

import type { NavLink } from './types'

/** Resolve a nav href for use in <a href>. External hosts get https:// when missing. */
export function resolveNavHref(link: Pick<NavLink, 'href' | 'anchor'>): string {
  if (link.anchor) {
    const id = link.href.replace(/^#/, '').trim()
    return id ? `#${id}` : '#'
  }

  const trimmed = link.href.trim()
  if (!trimmed) return '#'
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed
  return `https://${trimmed}`
}

export function navLinkOpensNewTab(link: NavLink): boolean {
  return !link.anchor && (link.open_in_new_tab ?? false)
}
