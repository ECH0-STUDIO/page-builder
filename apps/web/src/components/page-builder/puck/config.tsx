'use client'

import type { ReactNode } from 'react'
import type { MutableRefObject } from 'react'
import type { Config } from '@puckeditor/core'
import type { Business } from '@/lib/business'
import type { MenuCategory, MenuItem } from '@/app/actions/menu'
import type { PageBlock, ThemeSettings, NavbarConfig, FooterConfig } from '../types'
import {
  defaultContactConfig,
  defaultHeroConfig,
  defaultMenuGridConfig,
  defaultQRCodeConfig,
  defaultTextImageConfig,
  defaultNavbarConfig,
  defaultFooterConfig,
} from '../types'
import { defaultSpacingSize } from '../spacing-presets'
import { HeroSettings } from '../blocks/HeroBlock'
import { TextImageSettings } from '../blocks/TextImageBlock'
import { ContactSettings } from '../blocks/ContactBlock'
import { MenuGridSettings } from '../blocks/MenuGridBlock'
import { QRCodeSettings } from '../blocks/QRCodeBlock'
import { NavbarSettings } from '../blocks/NavbarBlock'
import { FooterSettings } from '../blocks/FooterBlock'
import {
  spacingSizeField,
  visibleField,
  heroLayoutField,
  heroHeightField,
} from './shared-fields'
import {
  renderContactBlock,
  renderHeroBlock,
  renderMenuGridBlock,
  renderQrCodeBlock,
  renderSiteFooter,
  renderSiteNavbar,
  renderTextImageBlock,
  type PuckRenderContext,
} from './block-render'
import type { PuckBlockProps } from './adapters'
import { buildThemeStyle } from '../theme-tokens'
import { CartProvider } from '../render/CartContext'
import { LiveStoreCart } from '../render/LiveStoreCart'
import type { PaymentSettings } from '@/lib/vietqr-utils'
import { SITE_FOOTER, SITE_NAVBAR, SITE_FOOTER_ID, SITE_NAVBAR_ID } from './constants'

export interface PuckShellState {
  business: Business
  theme: ThemeSettings | null
  navbarConfig: NavbarConfig
  footerConfig: FooterConfig
  headingFont: string
  bodyFont: string
  categories: MenuCategory[]
  items: MenuItem[]
  brandColor: string
  previewInteractive: boolean
  paymentSettings: PaymentSettings | null
}

export interface PuckEditorRefs {
  getShell: () => PuckShellState
  getBlocks: () => PageBlock[]
  getRenderCtx: () => PuckRenderContext
  t: (key: string) => string
}

const CHROME_PERMISSIONS = {
  delete: false,
  drag: false,
  duplicate: false,
  insert: false,
}

function legacyConfigField(
  t: (key: string) => string,
  render: (props: {
    value: Record<string, unknown>
    onChange: (value: Record<string, unknown>) => void
  }) => React.ReactNode,
) {
  return {
    type: 'custom' as const,
    label: t('puck.content'),
    render: ({
      value,
      onChange,
    }: {
      value: Record<string, unknown>
      onChange: (v: Record<string, unknown>) => void
    }) => <div className="puck-legacy-fields">{render({ value: value ?? {}, onChange })}</div>,
  }
}

/** Stable Puck config — reads live editor state via refs to avoid remounting on every edit. */
export function createStablePuckConfig(refs: MutableRefObject<PuckEditorRefs>): Config {
  const t = (key: string) => refs.current.t(key)

  return {
    root: {
      fields: {},
      render: (props: { children?: ReactNode }) => {
        const { children } = props
        const shell = refs.current.getShell()
        const { theme, headingFont, bodyFont } = shell

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
              {children}
              {shell.previewInteractive && (
                <LiveStoreCart
                  businessId={shell.business.id}
                  paymentSettings={shell.paymentSettings ?? {}}
                  previewMode
                  contained
                />
              )}
            </div>
          </CartProvider>
        )
      },
    },
    categories: {
      sections: {
        title: t('puck.sections'),
        components: ['hero', 'text_image', 'contact', 'menu_grid', 'qr_code'],
      },
      chrome: {
        title: 'Chrome',
        components: [SITE_NAVBAR, SITE_FOOTER],
        visible: false,
      },
    },
    components: {
      [SITE_NAVBAR]: {
        label: t('pageBuilder.header'),
        permissions: CHROME_PERMISSIONS,
        defaultProps: {
          id: SITE_NAVBAR_ID,
          config: { ...defaultNavbarConfig },
        },
        fields: {
          config: legacyConfigField(t, ({ value, onChange }) => {
            const shell = refs.current.getShell()
            return (
              <NavbarSettings
                config={{ ...defaultNavbarConfig, ...value } as NavbarConfig}
                businessId={shell.business.id}
                blocks={refs.current.getBlocks()}
                onChange={c => onChange(c as unknown as Record<string, unknown>)}
              />
            )
          }),
        },
        render: props =>
          renderSiteNavbar(props as unknown as PuckBlockProps, refs.current.getRenderCtx()),
      },
      [SITE_FOOTER]: {
        label: t('pageBuilder.footer'),
        permissions: CHROME_PERMISSIONS,
        defaultProps: {
          id: SITE_FOOTER_ID,
          config: { ...defaultFooterConfig },
        },
        fields: {
          config: legacyConfigField(t, ({ value, onChange }) => {
            const shell = refs.current.getShell()
            return (
              <FooterSettings
                config={{ ...defaultFooterConfig, ...value } as FooterConfig}
                businessId={shell.business.id}
                onChange={c => onChange(c as unknown as Record<string, unknown>)}
              />
            )
          }),
        },
        render: props =>
          renderSiteFooter(props as unknown as PuckBlockProps, refs.current.getRenderCtx()),
      },
      hero: {
        label: t('pageBuilder.blocks.hero.label'),
        defaultProps: {
          id: '',
          spacingSize: defaultSpacingSize(),
          visible: true,
          blockId: '',
          anchorId: '',
          customCss: '',
          layout: defaultHeroConfig.layout,
          height: defaultHeroConfig.height,
          config: { ...defaultHeroConfig },
        },
        fields: {
          spacingSize: spacingSizeField(t),
          visible: visibleField(t),
          layout: heroLayoutField(t),
          height: heroHeightField(t),
          config: legacyConfigField(t, ({ value, onChange }) => {
            const shell = refs.current.getShell()
            return (
              <HeroSettings
                config={{ ...defaultHeroConfig, ...value } as import('../types').HeroConfig}
                businessId={shell.business.id}
                blocks={refs.current.getBlocks()}
                brandColor={shell.brandColor}
                omitLayout
                omitHeight
                onChange={c => onChange(c as unknown as Record<string, unknown>)}
              />
            )
          }),
        },
        render: props => renderHeroBlock(props as unknown as PuckBlockProps, refs.current.getRenderCtx()),
      },
      text_image: {
        label: t('pageBuilder.blocks.text_image.label'),
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
          config: legacyConfigField(t, ({ value, onChange }) => {
            const shell = refs.current.getShell()
            return (
              <TextImageSettings
                config={{ ...defaultTextImageConfig, ...value } as import('../types').TextImageConfig}
                businessId={shell.business.id}
                blocks={refs.current.getBlocks()}
                brandColor={shell.brandColor}
                onChange={c => onChange(c as unknown as Record<string, unknown>)}
              />
            )
          }),
        },
        render: props => renderTextImageBlock(props as unknown as PuckBlockProps, refs.current.getRenderCtx()),
      },
      contact: {
        label: t('pageBuilder.blocks.contact.label'),
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
          config: legacyConfigField(t, ({ value, onChange }) => {
            const shell = refs.current.getShell()
            return (
              <ContactSettings
                config={{ ...defaultContactConfig, ...value } as import('../types').ContactConfig}
                business={shell.business}
                onChange={c => onChange(c as unknown as Record<string, unknown>)}
              />
            )
          }),
        },
        render: props => renderContactBlock(props as unknown as PuckBlockProps, refs.current.getRenderCtx()),
      },
      menu_grid: {
        label: t('pageBuilder.blocks.menu_grid.label'),
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
          config: legacyConfigField(t, ({ value, onChange }) => {
            const shell = refs.current.getShell()
            return (
              <MenuGridSettings
                config={{ ...defaultMenuGridConfig, ...value } as import('../types').MenuGridConfig}
                categories={shell.categories}
                items={shell.items}
                onChange={c => onChange(c as unknown as Record<string, unknown>)}
              />
            )
          }),
        },
        render: props => renderMenuGridBlock(props as unknown as PuckBlockProps, refs.current.getRenderCtx()),
      },
      qr_code: {
        label: t('pageBuilder.blocks.qr_code.label'),
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
          config: legacyConfigField(t, ({ value, onChange }) => {
            const shell = refs.current.getShell()
            return (
              <QRCodeSettings
                config={{ ...defaultQRCodeConfig, ...value } as import('../types').QRCodeConfig}
                businessSlug={shell.business.slug ?? undefined}
                businessId={shell.business.id}
                onChange={c => onChange(c as unknown as Record<string, unknown>)}
              />
            )
          }),
        },
        render: props => renderQrCodeBlock(props as unknown as PuckBlockProps, refs.current.getRenderCtx()),
      },
    },
  } as Config
}

/** Default shell for type exports / tests */
export function defaultShellState(business: Business): PuckShellState {
  return {
    business,
    theme: null,
    navbarConfig: defaultNavbarConfig,
    footerConfig: defaultFooterConfig,
    headingFont: 'Inter',
    bodyFont: 'Inter',
    categories: [],
    items: [],
    brandColor: '#E85D26',
    previewInteractive: false,
    paymentSettings: null,
  }
}
