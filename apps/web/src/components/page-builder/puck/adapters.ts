/**
 * Convert between Supabase page_blocks and Puck editor data.
 */

import type { Data, ComponentData } from '@puckeditor/core'
import { getDefaultConfig } from '../registry'
import {
  defaultSpacingSize,
  inferSpacingSize,
  spacingFromSize,
  type SectionSize,
} from '../spacing-presets'
import type { HeroConfig, BlockType, PageBlock, NavbarConfig, FooterConfig } from '../types'
import { defaultNavbarConfig, defaultFooterConfig } from '../types'
import {
  CHROME_BLOCK_TYPES,
  SITE_FOOTER,
  SITE_NAVBAR,
  SITE_FOOTER_ID,
  SITE_NAVBAR_ID,
  type ChromeBlockType,
} from './constants'

export const PUCK_BLOCK_TYPES = [
  'hero',
  'text_image',
  'contact',
  'menu_grid',
  'qr_code',
] as const satisfies readonly BlockType[]

export type PuckBlockType = (typeof PUCK_BLOCK_TYPES)[number]

const META_KEYS = new Set([
  'id',
  'spacingSize',
  'visible',
  'blockId',
  'anchorId',
  'customCss',
  'config',
  'layout',
  'height',
])

export interface PuckBlockMeta {
  spacingSize: SectionSize
  visible: boolean
  blockId: string
  anchorId: string
  customCss: string
}

export type PuckBlockProps = PuckBlockMeta & Record<string, unknown>

export interface PuckChromeConfigs {
  navbarConfig: NavbarConfig
  footerConfig: FooterConfig
}

function isPuckBlockType(type: string): type is PuckBlockType {
  return (PUCK_BLOCK_TYPES as readonly string[]).includes(type)
}

function isChromeBlockType(type: string): type is ChromeBlockType {
  return (CHROME_BLOCK_TYPES as readonly string[]).includes(type)
}

function splitProps(type: BlockType, props: PuckBlockProps): {
  meta: PuckBlockMeta
  config: PageBlock['config']
} {
  const {
    spacingSize = defaultSpacingSize(),
    visible = true,
    blockId = '',
    anchorId = '',
    customCss = '',
    config: nestedConfig,
    layout: topLayout,
    height: topHeight,
    ...rest
  } = props

  const defaults = getDefaultConfig(type) as unknown as Record<string, unknown>
  const config = {
    ...defaults,
    ...(nestedConfig as Record<string, unknown> | undefined),
    ...rest,
  } as unknown as PageBlock['config']

  if (type === 'hero') {
    const hero = config as HeroConfig
    if (topLayout !== undefined) hero.layout = topLayout as HeroConfig['layout']
    if (topHeight !== undefined) hero.height = topHeight as HeroConfig['height']
  }

  return {
    meta: {
      spacingSize: spacingSize as SectionSize,
      visible: Boolean(visible),
      blockId: String(blockId),
      anchorId: String(anchorId),
      customCss: String(customCss),
    },
    config,
  }
}

function mergeProps(
  block: PageBlock,
  spacingSize: SectionSize,
): PuckBlockProps & { id: string } {
  const base: PuckBlockProps & { id: string } = {
    id: block.id,
    spacingSize,
    visible: block.visible,
    blockId: block.id,
    anchorId: block.block_anchor_id ?? '',
    customCss: block.custom_css ?? '',
    config: block.config,
  }

  if (block.type === 'hero') {
    const hero = block.config as HeroConfig
    base.layout = hero.layout
    base.height = hero.height
  }

  return base
}

function chromeProps(config: NavbarConfig | FooterConfig, id: string) {
  return { id, config }
}

export function pageBlocksToPuckData(
  blocks: PageBlock[],
  chrome?: Partial<PuckChromeConfigs>,
): Data {
  const navbarConfig = chrome?.navbarConfig ?? defaultNavbarConfig
  const footerConfig = chrome?.footerConfig ?? defaultFooterConfig

  const content: ComponentData[] = [
    { type: SITE_NAVBAR, props: chromeProps(navbarConfig, SITE_NAVBAR_ID) },
    ...blocks.map(block => {
      const spacingSize = inferSpacingSize(
        block.type,
        block.spacing,
        block.type === 'hero' ? (block.config as HeroConfig) : undefined,
      )
      return {
        type: block.type,
        props: mergeProps(block, spacingSize),
      }
    }),
    { type: SITE_FOOTER, props: chromeProps(footerConfig, SITE_FOOTER_ID) },
  ]

  return {
    content,
    root: { props: {} },
  }
}

export function extractChromeFromData(data: Data): PuckChromeConfigs {
  let navbarConfig = defaultNavbarConfig
  let footerConfig = defaultFooterConfig

  for (const item of data.content ?? []) {
    if (item.type === SITE_NAVBAR) {
      navbarConfig = { ...defaultNavbarConfig, ...(item.props?.config as NavbarConfig) }
    }
    if (item.type === SITE_FOOTER) {
      footerConfig = { ...defaultFooterConfig, ...(item.props?.config as FooterConfig) }
    }
  }

  return { navbarConfig, footerConfig }
}

/** Keep header/footer bookends even if Puck omits them after an operation. */
export function ensureChromeBlocks(data: Data, chrome: PuckChromeConfigs): Data {
  const middle = (data.content ?? []).filter(
    item => item.type !== SITE_NAVBAR && item.type !== SITE_FOOTER,
  )

  return {
    ...data,
    content: [
      { type: SITE_NAVBAR, props: chromeProps(chrome.navbarConfig, SITE_NAVBAR_ID) },
      ...middle,
      { type: SITE_FOOTER, props: chromeProps(chrome.footerConfig, SITE_FOOTER_ID) },
    ],
  }
}

export function puckDataToPageBlocks(
  data: Data,
  businessId: string,
): Omit<PageBlock, 'created_at' | 'updated_at'>[] {
  const content = (data.content ?? []).filter(item => !isChromeBlockType(item.type))

  return content.map((item, index) => {
    if (!isPuckBlockType(item.type)) {
      throw new Error(`Unknown Puck block type: ${item.type}`)
    }

    const type = item.type
    const props = (item.props ?? {}) as PuckBlockProps & { id?: string }
    const { meta, config } = splitProps(type, props)
    const puckItemId = props.id || props.blockId

    const heroConfig = type === 'hero' ? (config as HeroConfig) : undefined
    const resolvedId = resolvePageBlockId(meta.blockId || puckItemId)

    return {
      id: resolvedId,
      business_id: businessId,
      type,
      sort_order: index,
      visible: meta.visible,
      config,
      spacing: spacingFromSize(type, meta.spacingSize, heroConfig),
      custom_css: meta.customCss,
      block_anchor_id: meta.anchorId || null,
    }
  })
}

export function makeTempBlockId(): string {
  return `temp-${Math.random().toString(36).slice(2)}`
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Puck uses `{type}-{uuid}` ids; Supabase `page_blocks.id` is a plain UUID. */
export function resolvePageBlockId(raw: string | undefined | null): string {
  if (!raw) return makeTempBlockId()
  if (raw.startsWith('temp-')) return raw
  if (UUID_RE.test(raw)) return raw

  const puckPrefixed = raw.match(
    /^[a-z_]+-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i,
  )
  if (puckPrefixed) return puckPrefixed[1]

  return makeTempBlockId()
}

export function stripMetaFromProps(props: PuckBlockProps): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (!META_KEYS.has(key)) out[key] = value
  }
  return out
}
