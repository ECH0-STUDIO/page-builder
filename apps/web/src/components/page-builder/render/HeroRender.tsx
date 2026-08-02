'use client'

/**
 * HeroRender — shared between editor canvas and live page.
 *
 * Layouts:
 *  - overlay    → Full-width image + dark overlay (opacity-controlled)
 *  - split      → Two-column: content pane (custom bg/text) + image pane, side configurable
 *  - text_only  → Solid or gradient background, no image
 *  - centered   → Legacy alias for overlay (uses overlay_opacity)
 *
 * height:
 *  - custom     → content height, optional min_height (px)
 *  - fullscreen → min-height 100vh
 */

import type { ContentAlign, HeroConfig, CtaButton } from '../types'
import type { BlockContentInset } from '../block-section-style'
import { contentInsetStyle } from '../block-section-style'
import { ctaHref, ctaOpensNewTab } from '../cta-utils'
import { resolveHeroHeight } from '../hero-utils'
import { getCtaClassName, getCtaInlineStyle } from '../cta-styles'
import { pickLocale, toSupportedLocale, type SupportedLocale } from '@/i18n/locale'
import { getTypography } from './typography'
import Image from 'next/image'
import { type PreviewLayout, isForcedMobileLayout } from './preview-layout'
import { usePreviewLayout } from '../puck/PreviewLayoutContext'

function resolveAlign(config: HeroConfig): ContentAlign {
  if (config.content_align === 'left' || config.content_align === 'right' || config.content_align === 'center') {
    return config.content_align
  }
  // Defaults by layout
  if (config.layout === 'split') return 'left'
  return 'center'
}

function justifyForAlign(align: ContentAlign): React.CSSProperties['justifyContent'] {
  if (align === 'left') return 'flex-start'
  if (align === 'right') return 'flex-end'
  return 'center'
}

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

function CtaRow({
  config,
  brandColor,
  locale,
  align,
}: {
  config: HeroConfig
  brandColor: string
  locale: SupportedLocale
  align: ContentAlign
}) {
  if (!config.cta && !config.cta_secondary) return null
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '12px',
        marginTop: '36px',
        justifyContent: justifyForAlign(align),
      }}
    >
      {config.cta && <CtaLink cta={config.cta} brandColor={brandColor} locale={locale} />}
      {config.cta_secondary && <CtaLink cta={config.cta_secondary} brandColor={brandColor} locale={locale} />}
    </div>
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
  const ctxLayout = usePreviewLayout()
  const layout: PreviewLayout =
    (ctxLayout !== 'responsive' ? ctxLayout : undefined)
    ?? previewLayout
    ?? (isMobilePreview ? 'mobile' : undefined)
    ?? 'responsive'
  const mobileLayout = isForcedMobileLayout(layout)
  const align = resolveAlign(config)

  const heading = pickLocale(config.heading, activeLocale) || businessName || 'Welcome'
  const body = pickLocale(config.body, activeLocale)
  const textColor = config.text_color === 'auto' ? '#ffffff' : config.text_color
  const typography = getTypography(mobileLayout)
  const isFullscreen = resolveHeroHeight(config.height) === 'fullscreen'
  const customMinHeight =
    !isFullscreen && typeof config.min_height === 'number' && config.min_height > 0
      ? config.min_height
      : null

  const objectPos =
    config.image_position === 'top'    ? 'top'
    : config.image_position === 'bottom' ? 'bottom'
    : 'center'

  const heightBase: React.CSSProperties = isFullscreen
    ? { minHeight: '100vh' }
    : customMinHeight
      ? { minHeight: `${customMinHeight}px` }
      : {}
  const inset = contentInsetStyle(contentInset ?? { padding_top: 0, padding_right: 0, padding_bottom: 0, padding_left: 0 })

  const contentBlock = (color: string, opts?: { maxWidth?: string }) => (
    <div style={{ textAlign: align, maxWidth: opts?.maxWidth ?? '800px', width: '100%' }}>
      <h1 style={{ color, ...typography.h1, margin: 0, wordBreak: 'break-word' }}>{heading}</h1>
      {body && (
        <p
          style={{
            color,
            ...typography.bodyMd,
            marginTop: '12px',
            whiteSpace: 'pre-wrap',
            maxWidth: '600px',
            marginLeft: align === 'center' ? 'auto' : align === 'right' ? 'auto' : 0,
            marginRight: align === 'center' ? 'auto' : align === 'left' ? 'auto' : 0,
          }}
        >
          {body}
        </p>
      )}
      <CtaRow config={config} brandColor={brandColor} locale={activeLocale} align={align} />
    </div>
  )

  // ── Text only ──────────────────────────────────────────────────────────────
  if (config.layout === 'text_only') {
    const fromColor = config.text_only_color ?? '#1a1a2e'
    const toColor   = config.text_only_color_end ?? '#0f3460'
    const bg = (config.text_only_bg ?? 'gradient') === 'solid'
      ? fromColor
      : `linear-gradient(135deg, ${fromColor} 0%, ${toColor} 100%)`

    return (
      <section
        style={{
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: justifyForAlign(align),
          ...heightBase,
          ...inset,
        }}
      >
        {contentBlock(textColor, { maxWidth: '760px' })}
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
          {contentBlock(panelTxt, { maxWidth: '100%' })}
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
  // Black dimmer under content. 0% = no overlay; 100% = fully black.
  const rawOpacity = Number.isFinite(config.overlay_opacity) ? config.overlay_opacity : 0
  const overlayOpacity = Math.min(100, Math.max(0, rawOpacity)) / 100

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
        <Image
          src={config.image_url}
          alt={heading}
          fill
          style={{ objectFit: 'cover', objectPosition: objectPos, zIndex: 0 }}
          sizes="100vw"
        />
      )}
      {overlayOpacity > 0 && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            backgroundColor: '#000000',
            opacity: overlayOpacity,
            pointerEvents: 'none',
          }}
        />
      )}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: justifyForAlign(align),
        width: '100%',
        boxSizing: 'border-box',
        ...(isFullscreen ? { minHeight: '100vh' } : customMinHeight ? { minHeight: `${customMinHeight}px` } : {}),
        ...inset,
      }}>
        <div style={{ textAlign: align, maxWidth: '800px', width: '100%' }}>
          <h1 style={{ color: textColor, ...typography.h1, margin: 0, textShadow: config.image_url ? '0 2px 20px rgba(0,0,0,0.3)' : 'none', wordBreak: 'break-word' }}>{heading}</h1>
          {body && (
            <p
              style={{
                color: textColor,
                ...typography.bodyMd,
                marginTop: '12px',
                whiteSpace: 'pre-wrap',
                maxWidth: '600px',
                marginLeft: align === 'center' ? 'auto' : align === 'right' ? 'auto' : 0,
                marginRight: align === 'center' ? 'auto' : align === 'left' ? 'auto' : 0,
              }}
            >
              {body}
            </p>
          )}
          <CtaRow config={config} brandColor={brandColor} locale={activeLocale} align={align} />
        </div>
      </div>
    </section>
  )
}
