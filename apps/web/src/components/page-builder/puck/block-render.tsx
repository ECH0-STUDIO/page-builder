'use client'

import type { CSSProperties, ReactNode } from 'react'
import { scopeCSS } from '@/lib/scope-css'
import type { BlockType, PageBlock, NavbarConfig, FooterConfig } from '../types'
import type { HeroConfig } from '../types'
import { defaultNavbarConfig, defaultFooterConfig } from '../types'
import { getBlockSurfaceLayers } from '../block-section-style'
import { spacingFromSize } from '../spacing-presets'
import type { PuckBlockProps } from './adapters'
import { stripMetaFromProps } from './adapters'
import { getDefaultConfig } from '../registry'
import { HeroRender } from '../render/HeroRender'
import { TextImageRender } from '../render/TextImageRender'
import { ContactRender } from '../render/ContactRender'
import { MenuGridRender } from '../render/MenuGridRender'
import type { MenuGridData } from '../render/MenuGridRender'
import { QRCodeRender } from '../render/QRCodeRender'
import { NavbarRender } from '../render/NavbarRender'
import { FooterRender } from '../render/FooterRender'
import type { Business } from '@/lib/business'
import type { PaymentSettings } from '@/lib/vietqr-utils'
import { resolveThemeTokens } from '../theme-tokens'
import { cn } from '@/lib/utils'

export interface PuckRenderContext {
  business: Business
  menuGridData: MenuGridData
  brandColor?: string
  defaultTextColor?: string
  qrDownloadLabel?: string
  previewInteractive?: boolean
}

function propsToPageBlock(type: BlockType, props: PuckBlockProps, businessId: string): PageBlock {
  const defaults = getDefaultConfig(type)
  const nested = (props.config ?? {}) as Record<string, unknown>
  const config = { ...defaults, ...nested, ...stripMetaFromProps(props) } as PageBlock['config']
  if (type === 'hero') {
    const hero = config as HeroConfig
    if (props.layout !== undefined) hero.layout = props.layout as HeroConfig['layout']
    if (props.height !== undefined) hero.height = props.height as HeroConfig['height']
  }
  const heroConfig = type === 'hero' ? (config as HeroConfig) : undefined

  return {
    id: props.blockId || 'puck-preview',
    business_id: businessId,
    type,
    sort_order: 0,
    visible: props.visible !== false,
    config,
    spacing: spacingFromSize(type, props.spacingSize ?? 'medium', heroConfig),
    custom_css: props.customCss ?? '',
    block_anchor_id: props.anchorId || null,
  }
}

export function PuckBlockShell({
  type,
  props,
  ctx,
  children,
}: {
  type: BlockType
  props: PuckBlockProps
  ctx: PuckRenderContext
  children: ReactNode
}) {
  const block = propsToPageBlock(type, props, ctx.business.id)
  const { margin, shell, contentInset } = getBlockSurfaceLayers(block)
  const hidden = props.visible === false

  return (
    <div style={margin} className={cn(hidden && 'opacity-50')}>
      {block.custom_css && (
        <style
          dangerouslySetInnerHTML={{
            __html: scopeCSS(block.custom_css, `[data-block-id="${block.id}"]`),
          }}
        />
      )}
      <div data-block-id={block.id} style={shell as CSSProperties}>
        {children}
      </div>
    </div>
  )
}

export function renderHeroBlock(props: PuckBlockProps, ctx: PuckRenderContext) {
  const block = propsToPageBlock('hero', props, ctx.business.id)
  const { contentInset } = getBlockSurfaceLayers(block)
  const tokens = resolveThemeTokens({ primary_color: ctx.brandColor })
  const config = block.config as HeroConfig

  return (
    <PuckBlockShell type="hero" props={props} ctx={ctx}>
      <HeroRender
        config={config}
        businessName={ctx.business.name}
        brandColor={ctx.brandColor ?? tokens.brandColor}
        contentInset={contentInset}
      />
    </PuckBlockShell>
  )
}

export function renderTextImageBlock(props: PuckBlockProps, ctx: PuckRenderContext) {
  const block = propsToPageBlock('text_image', props, ctx.business.id)
  const tokens = resolveThemeTokens({ primary_color: ctx.brandColor, text_color: ctx.defaultTextColor })

  return (
    <PuckBlockShell type="text_image" props={props} ctx={ctx}>
      <TextImageRender
        config={block.config as import('../types').TextImageConfig}
        brandColor={ctx.brandColor ?? tokens.brandColor}
        defaultTextColor={ctx.defaultTextColor ?? tokens.pageText}
      />
    </PuckBlockShell>
  )
}

export function renderContactBlock(props: PuckBlockProps, ctx: PuckRenderContext) {
  const block = propsToPageBlock('contact', props, ctx.business.id)

  return (
    <PuckBlockShell type="contact" props={props} ctx={ctx}>
      <ContactRender config={block.config as import('../types').ContactConfig} business={ctx.business} />
    </PuckBlockShell>
  )
}

export function renderMenuGridBlock(props: PuckBlockProps, ctx: PuckRenderContext) {
  const block = propsToPageBlock('menu_grid', props, ctx.business.id)
  const tokens = resolveThemeTokens({ primary_color: ctx.brandColor })

  return (
    <PuckBlockShell type="menu_grid" props={props} ctx={ctx}>
      <MenuGridRender
        config={block.config as import('../types').MenuGridConfig}
        data={ctx.menuGridData}
        brandColor={ctx.brandColor ?? tokens.brandColor}
      />
    </PuckBlockShell>
  )
}

export function renderQrCodeBlock(
  props: PuckBlockProps,
  ctx: PuckRenderContext & { paymentSettings?: PaymentSettings | null },
) {
  const block = propsToPageBlock('qr_code', props, ctx.business.id)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const targetUrl = ctx.business.slug ? `${origin}/${ctx.business.slug}` : ''

  return (
    <PuckBlockShell type="qr_code" props={props} ctx={ctx}>
      <QRCodeRender
        config={block.config as import('../types').QRCodeConfig}
        targetUrl={targetUrl}
        paymentSettings={ctx.paymentSettings ?? ctx.business.payment_settings}
        downloadLabel={ctx.qrDownloadLabel}
      />
    </PuckBlockShell>
  )
}

export function renderSiteNavbar(props: PuckBlockProps, ctx: PuckRenderContext) {
  const config = { ...defaultNavbarConfig, ...(props.config as NavbarConfig) }
  const inEditor = !ctx.previewInteractive

  return (
    <NavbarRender
      config={config}
      businessName={ctx.business.name}
      logoUrl={ctx.business.logo_url ?? undefined}
      inEditor={inEditor}
    />
  )
}

export function renderSiteFooter(props: PuckBlockProps, ctx: PuckRenderContext) {
  const config = { ...defaultFooterConfig, ...(props.config as FooterConfig) }
  const inEditor = !ctx.previewInteractive

  return (
    <FooterRender config={config} businessName={ctx.business.name} inEditor={inEditor} />
  )
}
