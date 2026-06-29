/**
 * Page template presets.
 * Each is a starting arrangement of blocks applied when the user
 * picks a template from the TemplatePicker on a blank page.
 */

import {
  BlockType,
  defaultHeroConfig,
  defaultTextImageConfig,
  defaultContactConfig,
  defaultMenuGridConfig,
} from './types'

export interface TemplateBlock {
  type: BlockType
  config?: Partial<typeof defaultHeroConfig | typeof defaultTextImageConfig | typeof defaultContactConfig | typeof defaultMenuGridConfig>
}

export interface PageTemplate {
  id: string
  label: string
  description: string
  blocks: TemplateBlock[]
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'full_experience',
    label: 'pageBuilder.templatesData.full_experience.label',
    description: 'pageBuilder.templatesData.full_experience.description',
    blocks: [
      { type: 'hero', config: { layout: 'overlay', height: 'fullscreen', heading: 'Experience the Extraordinary', tagline: 'Authentic flavours, crafted with passion.', overlay_opacity: 50 } },
      { type: 'text_image', config: { layout: 'img_right', heading: 'Our Story', body: 'Share the history of your restaurant here. Search engines love rich, keyword-relevant text about your local business, your ingredients, and your chef. This helps you rank higher in local searches.' } },
      { type: 'menu_grid', config: { layout: 'list', heading: 'Signature Dishes', description: 'Hand-picked favourites curated by our head chef.', selection_mode: 'category' } },
      { type: 'menu_grid', config: { layout: '3col', heading: 'Explore Our Menu', show_category_tabs: true } },
      { type: 'contact', config: { show_map: true, show_hours: true, map_height: 'large' } },
    ],
  },
  {
    id: 'visual_menu',
    label: 'pageBuilder.templatesData.visual_menu.label',
    description: 'pageBuilder.templatesData.visual_menu.description',
    blocks: [
      { type: 'hero', config: { layout: 'centered', height: 'medium', heading: 'Our Menu', tagline: 'Order directly from our kitchen to your table.' } },
      { type: 'menu_grid', config: { layout: '3col', show_category_tabs: true, show_description: true } },
      { type: 'contact', config: { show_map: false, show_hours: true } },
    ],
  },
  {
    id: 'link_in_bio',
    label: 'pageBuilder.templatesData.link_in_bio.label',
    description: 'pageBuilder.templatesData.link_in_bio.description',
    blocks: [
      { type: 'hero', config: { layout: 'centered', height: 'custom', section_padding_y: 40, heading: 'Quick Links', tagline: 'Find us online or order for pickup.' } },
      { type: 'text_image', config: { layout: 'text_only', background: 'transparent', heading: 'Order Now', body: 'Tap below to see our full menu.' } },
      { type: 'contact', config: { show_map: false, show_hours: false, show_phone: false, show_email: false, socials_shown: ['instagram', 'tiktok', 'facebook'] } },
    ],
  },
  {
    id: 'blank',
    label: 'pageBuilder.templatesData.blank.label',
    description: 'pageBuilder.templatesData.blank.description',
    blocks: [],
  },
]
