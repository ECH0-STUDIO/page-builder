'use client'

/**
 * TextImageRender — shared between editor canvas and live page.
 *
 * Fixes:
 *  - text_only / stacked: padding drives exact block height, no extra min-height whitespace
 *  - CTA: full action support (url / tel / email / anchor)
 *  - gradient background: uses config.gradient_from / gradient_to
 *  - image border radius: uses config.border_radius
 *  - content_align centers/right-aligns the whole text block within the section
 *  - aspect_ratio is respected via a single relative + aspect-ratio wrapper
 */

import type { TextImageConfig, CtaButton, BorderRadius } from '../types'
import { ctaHref, ctaOpensNewTab } from '../cta-utils'
import { getCtaClassName, getCtaInlineStyle } from '../cta-styles'
import { pickLocale, toSupportedLocale, type SupportedLocale } from '@/i18n/locale'
import { getTypography } from './typography'
import Image from 'next/image'
import { type PreviewLayout, isForcedMobileLayout } from './preview-layout'
import { usePreviewLayout } from '../puck/PreviewLayoutContext'

function CtaLink({ cta, brandColor, locale }: { cta: CtaButton; brandColor: string; locale: SupportedLocale }) {
  const href = ctaHref(cta)
  const newTab = ctaOpensNewTab(cta)
  return (
    <a
      href={href}
      className={`${getCtaClassName(cta.style)} mt-6`}
      style={getCtaInlineStyle(cta, brandColor)}
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {pickLocale(cta.label, locale)}
    </a>
  )
}

const ASPECT: Record<string, string> = {
  square: '1/1',
  '4_3':  '4/3',
  '16_9': '16/9',
}

function resolveAspectRatio(config: TextImageConfig): string {
  if (config.aspect_ratio !== 'free') {
    return ASPECT[config.aspect_ratio] ?? '4/3'
  }
  const w = config.aspect_ratio_width ?? 4
  const h = config.aspect_ratio_height ?? 3
  if (w <= 0 || h <= 0) return '4/3'
  return `${w}/${h}`
}

const RADIUS: Record<BorderRadius, string> = {
  none: '0px',
  sm:   '4px',
  md:   '12px',
  lg:   '20px',
  xl:   '32px',
  full: '9999px',
}

interface TextImageRenderProps {
  config: TextImageConfig
  isMobilePreview?: boolean
  previewLayout?: PreviewLayout
  locale?: string
}

export function TextImageRender({
  config,
  isMobilePreview,
  previewLayout,
  locale,
  brandColor = '#E85D26',
  defaultTextColor = '#111111',
}: TextImageRenderProps & { brandColor?: string; defaultTextColor?: string }) {
  const activeLocale = toSupportedLocale(locale)
  const heading = pickLocale(config.heading, activeLocale)
  const body = pickLocale(config.body, activeLocale)
  const ctxLayout = usePreviewLayout()
  // Prefer live PreviewLayoutContext over baked props (props can be stale on first viewport toggle)
  const layout: PreviewLayout =
    (ctxLayout !== 'responsive' ? ctxLayout : undefined)
    ?? previewLayout
    ?? (isMobilePreview ? 'mobile' : undefined)
    ?? 'responsive'
  const radius   = RADIUS[config.border_radius ?? 'md']
  const forceMobile = isForcedMobileLayout(layout)
  const typography = getTypography(forceMobile)

  const isTextOnly = config.layout === 'text_only'
  const isStacked  = config.layout === 'stacked'
  const isImgOnly  = config.layout === 'img_only'
  const isReverse  = config.layout === 'img_right'
  // Side-by-side layouts stack on forced mobile preview and on narrow viewports (CSS below)
  const isSideBySide = !isStacked && !isTextOnly && !isImgOnly
  const stackLayout = !isSideBySide || forceMobile

  const align =
    config.content_align === 'left' || config.content_align === 'right' || config.content_align === 'center'
      ? config.content_align
      : isTextOnly
        ? 'center'
        : 'left'
  const justify =
    align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'

  // Single relative + aspect-ratio box so Next/Image fill respects the ratio on live + editor
  // (including img_only — previously hardcoded to 16/6 and ignored the dimension control)
  const aspect = resolveAspectRatio(config)
  const imageEl = config.image_url && !isTextOnly && (
    <div
      className={isSideBySide ? 'ti-media' : undefined}
      style={{
        flex: '0 0 auto',
        width: stackLayout ? '100%' : 'min(45%, 480px)',
        position: 'relative',
        aspectRatio: aspect,
        overflow: 'hidden',
        borderRadius: radius,
        background: '#f0f0f0',
        flexShrink: 0,
        alignSelf: stackLayout ? 'stretch' : undefined,
      }}
    >
      <Image
        src={config.image_url}
        alt=""
        fill
        style={{
          objectFit: config.image_fit === 'contain' ? 'contain' : 'cover',
        }}
        sizes={stackLayout ? '100vw' : '(max-width: 768px) 100vw, 50vw'}
      />
    </div>
  )

  const textEl = !isImgOnly && (
    <div
      className={isSideBySide ? 'ti-copy' : undefined}
      style={{
        flex: stackLayout ? '0 1 auto' : '1 1 280px',
        minWidth: 0,
        // Full width when stacked so text-align centers within the section
        width: stackLayout ? '100%' : undefined,
        maxWidth: isTextOnly ? '760px' : undefined,
        textAlign: align,
        alignSelf: stackLayout
          ? (align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'stretch')
          : undefined,
      }}
    >
      {heading && (
        <h2 style={{
          ...typography.h2,
          color: defaultTextColor,
          margin: 0,
        }}>
          {heading}
        </h2>
      )}
      {body && (
        <p style={{
          ...typography.bodyMd,
          color: `${defaultTextColor}99`,
          marginTop: heading ? '16px' : 0,
          whiteSpace: 'pre-wrap',
        }}>
          {body}
        </p>
      )}
      {!heading && !body && (
        <p style={{ color: '#ccc', fontSize: '15px', fontStyle: 'italic' }}>Add heading or body text in the settings panel.</p>
      )}
      {config.cta && (
        <div style={{ display: 'flex', justifyContent: justify }}>
          <CtaLink cta={config.cta} brandColor={brandColor} locale={activeLocale} />
        </div>
      )}
    </div>
  )

  const innerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: stackLayout ? 'column' : 'row',
    flexWrap: stackLayout ? 'nowrap' : 'wrap',
    gap: isTextOnly || isImgOnly ? '0' : '40px',
    alignItems: stackLayout
      ? (align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'stretch')
      : 'center',
    justifyContent: isTextOnly || isImgOnly ? justify : 'flex-start',
    maxWidth: isTextOnly ? '760px' : isImgOnly ? '100%' : '1100px',
    margin: '0 auto',
    width: '100%',
  }

  return (
    <section style={{ width: '100%' }}>
      {/* Live responsive: stack side-by-side layouts and give copy full width on narrow screens */}
      {isSideBySide && !forceMobile && (
        <style>{`
          @media (max-width: 767px) {
            .ti-row-side {
              flex-direction: column !important;
              flex-wrap: nowrap !important;
              align-items: stretch !important;
            }
            .ti-row-side > .ti-media,
            .ti-row-side > .ti-copy {
              width: 100% !important;
              max-width: 100% !important;
              flex: 0 1 auto !important;
              align-self: stretch !important;
            }
          }
        `}</style>
      )}
      <div
        className={isSideBySide && !forceMobile ? 'ti-row-side' : undefined}
        style={innerStyle}
      >
        {isReverse ? <>{textEl}{imageEl}</> : <>{imageEl}{textEl}</>}
      </div>
    </section>
  )
}
