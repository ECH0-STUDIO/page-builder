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
 *  - custom     → content height; vertical spacing from outer padding control
 *  - fullscreen → min-height 100vh
 */

import type { HeroConfig, CtaButton } from '../types'
import type { BlockContentInset } from '../block-section-style'
import { contentInsetStyle } from '../block-section-style'
import { ctaHref, ctaOpensNewTab } from '../cta-utils'
import { resolveHeroHeight } from '../hero-utils'
import { getCtaClassName, getCtaInlineStyle } from '../cta-styles'
import { pickLocale, toSupportedLocale, type SupportedLocale } from '@/i18n/locale'
import { getTypography } from './typography'
import Image from 'next/image'
import { type PreviewLayout, isForcedMobileLayout } from './preview-layout'

function CtaLink({ cta, brandColor, locale }: { cta: CtaButton; brandColor: string; locale: SupportedLocale }) {
  const href = ctaHref(cta)
  const newTab = ctaOpensNewTab(cta)
  return (
    <a
      href={href}
      className={getCtaClassName(cta.style)}
      style={getCtaInlineStyle(cta, brandColor)}
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {pickLocale(cta.label, locale)}
    </a>
  )
}

export function HeroRender({
  config,
  businessName,
  isMobilePreview,
  previewLayout,
  locale,
  brandColor = '#E85D26',
  contentInset,
}: {
  config: HeroConfig
  businessName?: string
  isMobilePreview?: boolean
  previewLayout?: PreviewLayout
  locale?: string
  brandColor?: string
  /** Outer padding — applied inside render so backgrounds stay full-bleed */
  contentInset?: BlockContentInset
}) {
  const activeLocale = toSupportedLocale(locale)
  const layout: PreviewLayout | undefined =
    previewLayout ?? (isMobilePreview ? 'mobile' : 'responsive')
  const mobileLayout = isForcedMobileLayout(layout)

  const heading = pickLocale(config.heading, activeLocale) || businessName || 'Welcome'
  const tagline = pickLocale(config.tagline, activeLocale)
  const body = pickLocale(config.body, activeLocale)
  const textColor = config.text_color === 'auto' ? '#ffffff' : config.text_color
  const typography = getTypography(mobileLayout)
  const isFullscreen = resolveHeroHeight(config.height) === 'fullscreen'

  const objectPos =
    config.image_position === 'top'    ? 'top'
    : config.image_position === 'bottom' ? 'bottom'
    : 'center'

  const heightBase: React.CSSProperties = isFullscreen ? { minHeight: '100vh' } : {}
  const inset = contentInsetStyle(contentInset ?? { padding_top: 0, padding_right: 0, padding_bottom: 0, padding_left: 0 })

  // ── Text only ──────────────────────────────────────────────────────────────
  if (config.layout === 'text_only') {
    const fromColor = config.text_only_color ?? '#1a1a2e'
    const toColor   = config.text_only_color_end ?? '#0f3460'
    const bg = (config.text_only_bg ?? 'gradient') === 'solid'
      ? fromColor
      : `linear-gradient(135deg, ${fromColor} 0%, ${toColor} 100%)`

    return (
      <section style={{ background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', ...heightBase, ...inset }}>
        <div style={{ textAlign: 'center', maxWidth: '760px', width: '100%' }}>
          <h1 style={{ color: textColor, ...typography.h1, margin: 0, wordBreak: 'break-word' }}>{heading}</h1>
          {tagline && <p style={{ color: textColor, ...typography.bodyLg, marginTop: '20px' }}>{tagline}</p>}
          {body && <p style={{ color: textColor, ...typography.bodyMd, marginTop: '12px', whiteSpace: 'pre-wrap', maxWidth: '600px', margin: '12px auto 0' }}>{body}</p>}
          {(config.cta || config.cta_secondary) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '36px', justifyContent: 'center' }}>
              {config.cta && <CtaLink cta={config.cta} brandColor={brandColor} locale={activeLocale} />}
              {config.cta_secondary && <CtaLink cta={config.cta_secondary} brandColor={brandColor} locale={activeLocale} />}
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
      <div style={{ flex: '1 1 320px', background: panelBg, display: 'flex', alignItems: 'center', alignSelf: 'stretch' }}>
        <div style={{ width: '100%', boxSizing: 'border-box', ...inset }}>
          <h1 style={{ color: panelTxt, ...typography.h1, margin: 0, wordBreak: 'break-word' }}>{heading}</h1>
          {tagline && <p style={{ color: panelTxt, ...typography.bodyLg, marginTop: '16px' }}>{tagline}</p>}
          {body && <p style={{ color: panelTxt, ...typography.bodyMd, marginTop: '12px', whiteSpace: 'pre-wrap' }}>{body}</p>}
          {(config.cta || config.cta_secondary) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '32px' }}>
              {config.cta && <CtaLink cta={config.cta} brandColor={brandColor} locale={activeLocale} />}
              {config.cta_secondary && <CtaLink cta={config.cta_secondary} brandColor={brandColor} locale={activeLocale} />}
            </div>
          )}
        </div>
      </div>
    )

    const imagePane = (
      <div style={{ flex: '1 1 320px', position: 'relative', minHeight: isFullscreen ? '100%' : '300px', background: '#2a2a3e' }}>
        {config.image_url
          ? <Image src={config.image_url} alt={heading} fill style={{ objectFit: 'cover', objectPosition: objectPos }} sizes="(max-width: 768px) 100vw, 50vw" />
          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', opacity: 0.2 }}>🖼️</div>
        }
      </div>
    )

    return (
      <section style={{ display: 'flex', flexWrap: 'wrap', width: '100%', alignItems: 'stretch', ...heightBase }}>
        {imageOnRight ? <>{contentPane}{imagePane}</> : <>{imagePane}{contentPane}</>}
      </section>
    )
  }

  // ── Centered (legacy) + Overlay ─────────────────────────────────────────────
  const overlayOpacity = config.layout === 'overlay' ? config.overlay_opacity / 100 : 0.4

  return (
    <section
      className="overflow-hidden"
      style={{
        position: 'relative',
        ...heightBase,
        ...(config.image_url
          ? {}
          : { background: 'linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%)' }),
      }}
    >
      {config.image_url && (
        <Image src={config.image_url} alt={heading} fill style={{ objectFit: 'cover', objectPosition: objectPos }} sizes="100vw" />
      )}
      <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlayOpacity})` }} />
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        boxSizing: 'border-box',
        ...inset,
      }}>
      <div style={{ textAlign: 'center', maxWidth: '800px', width: '100%' }}>
        <h1 style={{ color: textColor, ...typography.h1, margin: 0, textShadow: config.image_url ? '0 2px 20px rgba(0,0,0,0.3)' : 'none', wordBreak: 'break-word' }}>{heading}</h1>
        {tagline && <p style={{ color: textColor, ...typography.bodyLg, marginTop: '20px' }}>{tagline}</p>}
        {body && <p style={{ color: textColor, ...typography.bodyMd, marginTop: '12px', whiteSpace: 'pre-wrap', maxWidth: '600px', margin: '12px auto 0' }}>{body}</p>}
        {(config.cta || config.cta_secondary) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '36px', justifyContent: 'center' }}>
            {config.cta && <CtaLink cta={config.cta} brandColor={brandColor} locale={activeLocale} />}
            {config.cta_secondary && <CtaLink cta={config.cta_secondary} brandColor={brandColor} locale={activeLocale} />}
          </div>
        )}
      </div>
      </div>
    </section>
  )
}
