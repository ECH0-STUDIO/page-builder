/**
 * How page blocks lay out in the page builder canvas vs the live site.
 *
 * - responsive: live site — Tailwind sm/md/lg follow the visitor's viewport
 * - desktop:    editor desktop toggle — force desktop layout inside the canvas
 * - mobile:     editor mobile toggle — force mobile layout
 */
export type PreviewLayout = 'responsive' | 'desktop' | 'mobile'

export function isForcedMobileLayout(layout?: PreviewLayout): boolean {
  return layout === 'mobile'
}

export function isForcedDesktopLayout(layout?: PreviewLayout): boolean {
  return layout === 'desktop'
}

export function menuGridColClass(layout: PreviewLayout | undefined, blockLayout: string): string {
  const desktop: Record<string, string> = {
    '2col': 'grid-cols-2',
    '3col': 'grid-cols-3',
    list: 'grid-cols-1',
  }
  const responsive: Record<string, string> = {
    '2col': 'grid-cols-1 sm:grid-cols-2',
    '3col': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    list: 'grid-cols-1',
  }
  if (layout === 'mobile') return 'grid-cols-1'
  if (layout === 'desktop') return desktop[blockLayout] ?? 'grid-cols-3'
  return responsive[blockLayout] ?? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
}

/** Horizontal padding classes for section blocks */
export function sectionPaddingClass(layout?: PreviewLayout, desktop = 'px-6', mobile = 'px-4'): string {
  if (layout === 'mobile') return mobile
  if (layout === 'desktop') return desktop
  return `${mobile} md:${desktop}`
}
