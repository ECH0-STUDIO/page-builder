'use client'

import type { ReactNode } from 'react'
import type { Config } from '@puckeditor/core'
import type { Business } from '@/lib/business'
import type { MenuCategory, MenuItem } from '@/app/actions/menu'
import type { PageBlock } from '../types'
import {
  defaultContactConfig,
  defaultHeroConfig,
  defaultMenuGridConfig,
  defaultQRCodeConfig,
  defaultTextImageConfig,
} from '../types'
import { defaultSpacingSize } from '../spacing-presets'
import { HeroSettings } from '../blocks/HeroBlock'
import { TextImageSettings } from '../blocks/TextImageBlock'
import { ContactSettings } from '../blocks/ContactBlock'
import { MenuGridSettings } from '../blocks/MenuGridBlock'
import { QRCodeSettings } from '../blocks/QRCodeBlock'
import { spacingSizeField, visibleField } from './shared-fields'
import {
  renderContactBlock,
  renderHeroBlock,
  renderMenuGridBlock,
  renderQrCodeBlock,
  renderTextImageBlock,
  type PuckRenderContext,
} from './block-render'
import type { PuckBlockProps } from './adapters'
import type { ThemeSettings, NavbarConfig, FooterConfig } from '../types'
import { defaultNavbarConfig, defaultFooterConfig } from '../types'
import { buildThemeStyle, resolveThemeTokens } from '../theme-tokens'
import { NavbarRender } from '../render/NavbarRender'
import { FooterRender } from '../render/FooterRender'
import { CartProvider } from '../render/CartContext'

export interface PuckConfigContext {
  business: Business
  blocks: PageBlock[]
  categories: MenuCategory[]
  items: MenuItem[]
  brandColor: string
  defaultTextColor: string
  renderCtx: PuckRenderContext
  theme: ThemeSettings | null
  navbarConfig: NavbarConfig
  footerConfig: FooterConfig
  headingFont: string
  bodyFont: string
  t: (key: string) => string
}

function configField(
  render: (props: {
    value: Record<string, unknown>
    onChange: (value: Record<string, unknown>) => void
  }) => React.ReactNode,
) {
  return {
    type: 'custom' as const,
    label: 'Content',
    render: ({
      value,
      onChange,
    }: {
      value: Record<string, unknown>
      onChange: (v: Record<string, unknown>) => void
    }) => render({ value: value ?? {}, onChange }),
  }
}

export function createPuckConfig(ctx: PuckConfigContext): Config {
  const {
    business,
    blocks,
    categories,
    items,
    brandColor,
    renderCtx,
    theme,
    navbarConfig,
    footerConfig,
    headingFont,
    bodyFont,
    t,
  } = ctx

  return {
    root: {
      fields: {},
      render: (props: { children?: ReactNode }) => {
        const { children } = props
        return (
        <CartProvider>
          <div
            style={{
              ...buildThemeStyle(theme),
              fontFamily: `'${bodyFont}', sans-serif`,
              minHeight: '100%',
            }}
          >
            <style
              dangerouslySetInnerHTML={{
                __html: `h1,h2,h3,h4,h5,h6{font-family:'${headingFont}',sans-serif!important;}`,
              }}
            />
            <NavbarRender
              config={navbarConfig}
              businessName={business.name}
              logoUrl={business.logo_url ?? undefined}
              inEditor
            />
            {children}
            <FooterRender
              config={footerConfig}
              businessName={business.name}
              inEditor
            />
          </div>
        </CartProvider>
        )
      },
    },
    categories: {
      sections: { title: 'Sections', components: ['hero', 'text_image', 'contact', 'menu_grid', 'qr_code'] },
    },
    components: {
      hero: {
        label: 'Hero',
        defaultProps: {
          id: '',
          spacingSize: defaultSpacingSize(),
          visible: true,
          blockId: '',
          anchorId: '',
          customCss: '',
          config: { ...defaultHeroConfig },
        },
        fields: {
          spacingSize: spacingSizeField(t),
          visible: visibleField(t),
          config: configField(({ value, onChange }) => (
            <HeroSettings
              config={{ ...defaultHeroConfig, ...value } as import('../types').HeroConfig}
              businessId={business.id}
              blocks={blocks}
              brandColor={brandColor}
              onChange={c => onChange(c as unknown as Record<string, unknown>)}
            />
          )),
        },
        render: props => renderHeroBlock(props as unknown as PuckBlockProps, renderCtx),
      },
      text_image: {
        label: 'Text + Image',
        defaultProps: {
          id: '',
          spacingSize: defaultSpacingSize(),
          visible: true,
          blockId: '',
          anchorId: '',
          customCss: '',
          config: { ...defaultTextImageConfig },
        },
        fields: {
          spacingSize: spacingSizeField(t),
          visible: visibleField(t),
          config: configField(({ value, onChange }) => (
            <TextImageSettings
              config={{ ...defaultTextImageConfig, ...value } as import('../types').TextImageConfig}
              businessId={business.id}
              blocks={blocks}
              brandColor={brandColor}
              onChange={c => onChange(c as unknown as Record<string, unknown>)}
            />
          )),
        },
        render: props => renderTextImageBlock(props as unknown as PuckBlockProps, renderCtx),
      },
      contact: {
        label: 'Contact & Info',
        defaultProps: {
          id: '',
          spacingSize: defaultSpacingSize(),
          visible: true,
          blockId: '',
          anchorId: '',
          customCss: '',
          config: { ...defaultContactConfig },
        },
        fields: {
          spacingSize: spacingSizeField(t),
          visible: visibleField(t),
          config: configField(({ value, onChange }) => (
            <ContactSettings
              config={{ ...defaultContactConfig, ...value } as import('../types').ContactConfig}
              business={business}
              onChange={c => onChange(c as unknown as Record<string, unknown>)}
            />
          )),
        },
        render: props => renderContactBlock(props as unknown as PuckBlockProps, renderCtx),
      },
      menu_grid: {
        label: 'Menu / Products',
        defaultProps: {
          id: '',
          spacingSize: defaultSpacingSize(),
          visible: true,
          blockId: '',
          anchorId: '',
          customCss: '',
          config: { ...defaultMenuGridConfig },
        },
        fields: {
          spacingSize: spacingSizeField(t),
          visible: visibleField(t),
          config: configField(({ value, onChange }) => (
            <MenuGridSettings
              config={{ ...defaultMenuGridConfig, ...value } as import('../types').MenuGridConfig}
              categories={categories}
              items={items}
              onChange={c => onChange(c as unknown as Record<string, unknown>)}
            />
          )),
        },
        render: props => renderMenuGridBlock(props as unknown as PuckBlockProps, renderCtx),
      },
      qr_code: {
        label: 'QR Code',
        defaultProps: {
          id: '',
          spacingSize: defaultSpacingSize(),
          visible: true,
          blockId: '',
          anchorId: '',
          customCss: '',
          config: { ...defaultQRCodeConfig },
        },
        fields: {
          spacingSize: spacingSizeField(t),
          visible: visibleField(t),
          config: configField(({ value, onChange }) => (
            <QRCodeSettings
              config={{ ...defaultQRCodeConfig, ...value } as import('../types').QRCodeConfig}
              businessSlug={business.slug ?? undefined}
              businessId={business.id}
              onChange={c => onChange(c as unknown as Record<string, unknown>)}
            />
          )),
        },
        render: props => renderQrCodeBlock(props as unknown as PuckBlockProps, renderCtx),
      },
    },
  } as Config
}
