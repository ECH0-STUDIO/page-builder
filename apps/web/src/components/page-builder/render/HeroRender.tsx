/**
 * HeroRender — shared between editor canvas and live page.
 *
 * Layouts:
 *  - overlay    → Full-width image + dark overlay (opacity-controlled)
 *  - split      → Two-column: content pane (custom bg/text) + image pane, side configurable
 *  - text_only  → Solid or gradient background, no image
 *  - centered   → Legacy alias for overlay at 40% opacity
 *
 * height:
 *  - custom     → padY drives height (no min-height)
 *  - medium     → min-height 60vh
 *  - fullscreen → min-height 100vh
 */

import type { HeroConfig, CtaButton } from '../types'
import { ctaHref } from '../cta-utils'
import Image from 'next/image'

function CtaLink({ cta, textColor }: { cta: CtaButton; textColor: string }) {
  const href = ctaHref(cta)
  const base = 'inline-block px-7 py-3.5 rounded-full font-semibold text-sm tracking-wide transition-opacity hover:opacity-90 select-none'
  const isLight = textColor === '#ffffff' || textColor === 'white'
  const styles: Record<typeof cta.style, React.CSSProperties> = {
    filled:   { backgroundColor: textColor, color: isLight ? '#111' : '#fff' },
    outlined: { border: `2px solid ${textColor}`, color: textColor, backgroundColor: 'transparent' },
    text:     { textDecoration: 'underline', textUnderlineOffset: '4px', color: textColor, paddingLeft: 0, paddingRight: 0 },
  }
  return <a href={href} className={base} style={styles[cta.style]}>{cta.label}</a>
}

export function HeroRender({ config, businessName }: { config: HeroConfig; businessName?: string }) {
  const heading   = config.heading || businessName || 'Welcome'
  const textColor = config.text_color === 'auto' ? '#ffffff' : config.text_color
  const padY      = config.section_padding_y ?? 80

  const objectPos =
    config.image_position === 'top'    ? 'top'
    : config.image_position === 'bottom' ? 'bottom'
    : 'center'

  const heightBase: React.CSSProperties =
    config.height === 'fullscreen' ? { minHeight: '100vh' }
    : config.height === 'medium'   ? { minHeight: '60vh' }
    : {}

  // ── Text only ──────────────────────────────────────────────────────────────
  if (config.layout === 'text_only') {
    const fromColor = config.text_only_color ?? '#1a1a2e'
    const toColor   = config.text_only_color_end ?? '#0f3460'
    const bg = (config.text_only_bg ?? 'gradient') === 'solid'
      ? fromColor
      : `linear-gradient(135deg, ${fromColor} 0%, ${toColor} 100%)`

    return (
      <section style={{ background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', ...heightBase, paddingTop: padY, paddingBottom: padY, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: '760px', width: '100%' }}>
          <h1 style={{ color: textColor, fontSize: 'clamp(30px,5vw,64px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', margin: 0 }}>{heading}</h1>
          {config.tagline && <p style={{ color: textColor, fontSize: '20px', opacity: 0.85, marginTop: '20px', lineHeight: 1.5 }}>{config.tagline}</p>}
          {config.body && <p style={{ color: textColor, fontSize: '16px', opacity: 0.7, marginTop: '12px', whiteSpace: 'pre-wrap', lineHeight: 1.6, maxWidth: '600px', margin: '12px auto 0' }}>{config.body}</p>}
          {(config.cta || config.cta_secondary) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '36px', justifyContent: 'center' }}>
              {config.cta && <CtaLink cta={config.cta} textColor={textColor} />}
              {config.cta_secondary && <CtaLink cta={config.cta_secondary} textColor={textColor} />}
            </div>
          )}
        </div>
      </section>
    )
  }

  // ── Split ──────────────────────────────────────────────────────────────────
  if (config.layout === 'split') {
    const panelBg  = config.split_bg_color ?? '#1a1a2e'
    const panelTxt = config.split_text_color ?? '#ffffff'
    const imageOnRight = (config.split_image_side ?? 'right') === 'right'

    const contentPane = (
      <div style={{ flex: '1 1 320px', background: panelBg, display: 'flex', alignItems: 'center', padding: `${padY}px 48px`, ...heightBase }}>
        <div>
          <h1 style={{ color: panelTxt, fontSize: 'clamp(26px,4vw,52px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0 }}>{heading}</h1>
          {config.tagline && <p style={{ color: panelTxt, fontSize: '18px', opacity: 0.8, marginTop: '16px', lineHeight: 1.5 }}>{config.tagline}</p>}
          {config.body && <p style={{ color: panelTxt, fontSize: '15px', opacity: 0.65, marginTop: '12px', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{config.body}</p>}
          {(config.cta || config.cta_secondary) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '32px' }}>
              {config.cta && <CtaLink cta={config.cta} textColor={panelTxt} />}
              {config.cta_secondary && <CtaLink cta={config.cta_secondary} textColor={panelTxt} />}
            </div>
          )}
        </div>
      </div>
    )

    const imagePane = (
      <div style={{ flex: '1 1 320px', position: 'relative', minHeight: `${Math.max(padY * 2 + 120, 300)}px`, background: '#2a2a3e' }}>
        {config.image_url
          ? <Image src={config.image_url} alt={heading} fill style={{ objectFit: 'cover', objectPosition: objectPos }} sizes="(max-width: 768px) 100vw, 50vw" />
          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', opacity: 0.2 }}>🖼️</div>
        }
      </div>
    )

    return (
      <section style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
        {imageOnRight ? <>{contentPane}{imagePane}</> : <>{imagePane}{contentPane}</>}
      </section>
    )
  }

  // ── Centered (legacy) + Overlay ─────────────────────────────────────────────
  const overlayOpacity = config.layout === 'overlay' ? config.overlay_opacity / 100 : 0.4

  return (
    <section style={{
      position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      ...heightBase,
      paddingTop: padY, paddingBottom: padY, paddingLeft: 24, paddingRight: 24,
      overflow: 'hidden',
      ...(config.image_url
        ? {}
        : { background: 'linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%)' }),
    }}>
      {config.image_url && (
        <Image src={config.image_url} alt={heading} fill style={{ objectFit: 'cover', objectPosition: objectPos }} sizes="100vw" />
      )}
      <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlayOpacity})` }} />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '800px', width: '100%' }}>
        <h1 style={{ color: textColor, fontSize: 'clamp(30px,5vw,64px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', margin: 0, textShadow: config.image_url ? '0 2px 20px rgba(0,0,0,0.3)' : 'none' }}>{heading}</h1>
        {config.tagline && <p style={{ color: textColor, fontSize: '20px', opacity: 0.9, marginTop: '20px', lineHeight: 1.5 }}>{config.tagline}</p>}
        {config.body && <p style={{ color: textColor, fontSize: '15px', opacity: 0.75, marginTop: '12px', whiteSpace: 'pre-wrap', lineHeight: 1.6, maxWidth: '600px', margin: '12px auto 0' }}>{config.body}</p>}
        {(config.cta || config.cta_secondary) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '36px', justifyContent: 'center' }}>
            {config.cta && <CtaLink cta={config.cta} textColor={textColor} />}
            {config.cta_secondary && <CtaLink cta={config.cta_secondary} textColor={textColor} />}
          </div>
        )}
      </div>
    </section>
  )
}
