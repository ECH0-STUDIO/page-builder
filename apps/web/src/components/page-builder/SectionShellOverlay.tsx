import type { CSSProperties, ReactNode } from 'react'

/** Black dimmer layer for section shells that support background-image overlays. */
export function SectionShellOverlay({ opacity }: { opacity: number }) {
  if (opacity <= 0) return null
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        backgroundColor: '#000000',
        opacity: Math.min(100, Math.max(0, opacity)) / 100,
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
