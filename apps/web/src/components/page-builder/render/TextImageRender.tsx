/**
 * TextImageRender — shared between editor canvas and live page.
 *
 * Fixes:
 *  - text_only / stacked: padding drives exact block height, no extra min-height whitespace
 *  - CTA: full action support (url / tel / email / anchor)
 *  - gradient background: uses config.gradient_from / gradient_to
 *  - image border radius: uses config.border_radius
 */

import type { TextImageConfig, CtaButton, BorderRadius } from '../types'
import { ctaHref } from '../cta-utils'
import { getCtaClassName, getCtaInlineStyle } from '../cta-styles'
import { pickLocale, toSupportedLocale, type SupportedLocale } from '@/i18n/locale'
import { getTypography } from './typography'
import Image from 'next/image'
import { type PreviewLayout, isForcedMobileLayout } from './preview-layout'

function CtaLink({ cta, brandColor, locale }: { cta: CtaButton; brandColor: string; locale: SupportedLocale }) {
  const href = ctaHref(cta)
  return (
    <a href={href} className={`${getCtaClassName(cta.style)} mt-6`} style={getCtaInlineStyle(cta, brandColor)}>
      {pickLocale(cta.label, locale)}
    </a>
  )
}

const PADDING: Record<string, React.CSSProperties> = {
  compact:  { padding: '32px 24px' },
  normal:   { padding: '64px 24px' },
  spacious: { padding: '100px 24px' },
}

const ASPECT: Record<string, string> = {
  square: '1/1',
  '4_3':  '4/3',
  '16_9': '16/9',
  free:   'auto',
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
  const layout: PreviewLayout | undefined =
    previewLayout ?? (isMobilePreview ? 'mobile' : 'responsive')
  const padStyle = PADDING[config.padding] ?? PADDING.normal
  const radius   = RADIUS[config.border_radius ?? 'md']
  const typography = getTypography(isForcedMobileLayout(layout))

  // ── Background ─────────────────────────────────────────────────────────────
  const bgStyle: React.CSSProperties =
    config.background === 'solid'
      ? { backgroundColor: config.background_color }
      : config.background === 'gradient'
      ? { background: `linear-gradient(135deg, ${config.gradient_from ?? '#f8f8f8'} 0%, ${config.gradient_to ?? '#e8e8e8'} 100%)` }
      : { backgroundColor: '#ffffff' }

  const isTextOnly = config.layout === 'text_only'
  const isStacked  = config.layout === 'stacked'
  const isImgOnly  = config.layout === 'img_only'
  const isReverse  = config.layout === 'img_right'

  // ── Image element ──────────────────────────────────────────────────────────
  const imageEl = config.image_url && !isTextOnly && (
    <div style={{
      flex: '0 0 auto',
      width: isStacked || isImgOnly ? '100%' : 'min(45%, 480px)',
      // Use the chosen aspect ratio — NOT a fixed height — to avoid whitespace
      aspectRatio: isImgOnly ? '16/6' : (ASPECT[config.aspect_ratio] ?? '4/3'),
      overflow: 'hidden',
      borderRadius: radius,
      background: '#f0f0f0',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}>
        <Image
          src={config.image_url}
          alt=""
          fill
          style={{
            objectFit: config.image_fit === 'contain' ? 'contain' : 'cover',
          }}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    </div>
  )

  // ── Text element ───────────────────────────────────────────────────────────
  const textEl = !isImgOnly && (
    <div style={{
      // text_only: shrink to content; stacked/side-by-side: flex grow
      flex: isTextOnly ? '0 1 auto' : '1 1 280px',
      minWidth: 0,
      textAlign: isTextOnly ? 'center' : 'left',
    }}>
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
      {config.cta && <CtaLink cta={config.cta} brandColor={brandColor} locale={activeLocale} />}
    </div>
  )

  // ── Outer container ────────────────────────────────────────────────────────
  // Key fix: do NOT set a fixed min-height on stacked/text_only —
  // let padding + content determine the actual height naturally.
  const innerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isStacked || isTextOnly ? 'column' : 'row',
    flexWrap: isStacked || isTextOnly ? 'nowrap' : 'wrap',
    gap: isTextOnly ? '0' : '40px',
    alignItems: isTextOnly ? 'center' : isStacked ? 'flex-start' : 'center',
    justifyContent: isTextOnly ? 'center' : 'flex-start',
    maxWidth: isTextOnly ? '760px' : '1100px',
    margin: '0 auto',
  }

  return (
    <section style={{ ...bgStyle, ...padStyle }}>
      <div style={innerStyle}>
        {isReverse ? <>{textEl}{imageEl}</> : <>{imageEl}{textEl}</>}
      </div>
    </section>
  )
}
