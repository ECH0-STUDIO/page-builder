/**
 * Block type registry — maps each BlockType to:
 *  - label, description, icon name
 *  - default config
 *  - whether it's available (some are Phase-5 placeholders)
 */

import {
  BlockType,
  HeroConfig, TextImageConfig, ContactConfig,
  MenuGridConfig, QRCodeConfig,
  defaultHeroConfig, defaultTextImageConfig, defaultContactConfig,
  defaultMenuGridConfig, defaultQRCodeConfig,
} from './types'

export interface BlockMeta {
  type: BlockType
  label: string
  description: string
  icon: string
  phase: 4 | 5
  defaultConfig:
    | HeroConfig
    | TextImageConfig
    | ContactConfig
    | MenuGridConfig
    | QRCodeConfig
}

export const BLOCK_REGISTRY: BlockMeta[] = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'Cover image, headline, tagline, and call to action.',
    icon: 'Sparkles',
    phase: 4,
    defaultConfig: defaultHeroConfig,
  },
  {
    type: 'text_image',
    label: 'Text + Image',
    description: 'About us, promotions, or any story block.',
    icon: 'AlignLeft',
    phase: 4,
    defaultConfig: defaultTextImageConfig,
  },
  {
    type: 'contact',
    label: 'Contact & Info',
    description: 'Map, hours, phone, email and social icons.',
    icon: 'MapPin',
    phase: 4,
    defaultConfig: defaultContactConfig,
  },
  {
    type: 'menu_grid',
    label: 'Menu / Products',
    description: 'Auto-pulls your menu items into a grid or list.',
    icon: 'Grid3x3',
    phase: 5,
    defaultConfig: defaultMenuGridConfig,
  },
  {
    type: 'qr_code',
    label: 'QR Code',
    description: 'Scannable QR linking to your page or a custom URL.',
    icon: 'QrCode',
    phase: 5,
    defaultConfig: defaultQRCodeConfig,
  },
]

export function getBlockMeta(type: BlockType): BlockMeta {
  return BLOCK_REGISTRY.find(b => b.type === type) ?? BLOCK_REGISTRY[0]
}

export function getDefaultConfig(type: BlockType) {
  return getBlockMeta(type).defaultConfig
}
