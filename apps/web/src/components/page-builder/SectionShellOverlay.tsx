import type { CSSProperties, ReactNode } from 'react'

/** Pure black dimmer (rgba) — never inherits / blends with theme page background. */
export function SectionShellOverlay({ opacity }: { opacity: number }) {
  const parsed = Number(opacity)
  const alpha = Math.min(100, Math.max(0, Number.isFinite(parsed) ? parsed : 0)) / 100
  if (alpha <= 0) return null
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        backgroundColor: `rgba(0, 0, 0, ${alpha})`,
        pointerEvents: 'none',
      }}
    />
  )
}

export function sectionShellContentStyle(overlayOpacity: number): CSSProperties | undefined {
  if (overlayOpacity <= 0) return undefined
  return { position: 'relative', zIndex: 1 }
}

export function SectionShellContent({
  overlayOpacity,
  children,
}: {
  overlayOpacity: number
  children: ReactNode
}) {
  const style = sectionShellContentStyle(overlayOpacity)
  if (!style) return <>{children}</>
  return <div style={style}>{children}</div>
}
