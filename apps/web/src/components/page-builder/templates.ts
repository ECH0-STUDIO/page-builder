/**
 * Page template presets.
 * Each is a starting arrangement of blocks (and optional theme) applied when the
 * user picks a template from the TemplatePicker. Blocks remain fully editable.
 */

import {
  BlockType,
  defaultHeroConfig,
  defaultTextImageConfig,
  defaultContactConfig,
  defaultMenuGridConfig,
  type ThemeSettings,
} from './types'

export interface TemplateBlock {
  type: BlockType
  config?: Partial<typeof defaultHeroConfig | typeof defaultTextImageConfig | typeof defaultContactConfig | typeof defaultMenuGridConfig>
}

export type TemplateThemePreset = Partial<Pick<
  ThemeSettings,
  'primary_color' | 'background_color' | 'text_color' | 'font_family' | 'heading_font_family'
>>

export interface PageTemplate {
  id: string
  label: string
  description: string
  blocks: TemplateBlock[]
  /** Optional theme values applied with the blocks (still editable after). */
  theme?: TemplateThemePreset
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'eatery_default',
    label: 'pageBuilder.templatesData.eatery_default.label',
    description: 'pageBuilder.templatesData.eatery_default.description',
    theme: {
      primary_color: '#111111',
      background_color: '#FFFFFF',
      text_color: '#111111',
      font_family: 'Nunito',
      heading_font_family: 'Nunito',
    },
    blocks: [
      {
        type: 'hero',
        config: {
          layout: 'text_only',
          height: 'custom',
          min_height: 420,
          content_align: 'center',
          heading: 'Chào mừng đến quán',
          body: 'Thực đơn tươi mỗi ngày — gọi món nhanh tại bàn.',
          text_only_bg: 'solid',
          text_only_color: '#111111',
          text_only_color_end: '#111111',
          text_color: 'dark',
          cta: {
            label: 'Gọi món',
            action: 'url',
            value: '/order',
            style: 'filled',
            color: '#111111',
            open_in_new_tab: false,
          },
        },
      },
      {
        type: 'text_image',
        config: {
          layout: 'text_only',
          heading: 'Về chúng tôi',
          body: 'Không gian ấm cúng, món ngon chuẩn vị. Hãy cập nhật câu chuyện của quán tại đây.',
          background: 'solid',
          background_color: '#F5F5F5',
          padding: 'spacious',
          border_radius: 'xl',
          content_align: 'center',
          cta: null,
        },
      },
      {
        type: 'menu_grid',
        config: {
          layout: 'list',
          heading: 'Thực đơn',
          description: 'Chọn món yêu thích của bạn.',
          selection_mode: 'category',
          show_category_tabs: true,
          show_image: true,
          show_description: true,
          show_price: true,
          background_color: '#FFFFFF',
          text_color: '#111111',
          card_background_color: '#FFFFFF',
          card_text_color: '#111111',
          card_border_color: '#E5E5E5',
          card_border_radius: 'xl',
        },
      },
      {
        type: 'contact',
        config: {
          layout: 'map_left',
          show_map: true,
          map_height: 'large',
          show_hours: true,
          show_phone: true,
          show_address: true,
          show_email: false,
          background: 'solid',
          background_color: '#FAFAFA',
          text_color: '#111111',
        },
      },
    ],
  },
  {
    id: 'full_experience',
    label: 'pageBuilder.templatesData.full_experience.label',
    description: 'pageBuilder.templatesData.full_experience.description',
    blocks: [
      { type: 'hero', config: { layout: 'overlay', height: 'fullscreen', heading: 'Experience the Extraordinary', body: 'Authentic flavours, crafted with passion.', overlay_opacity: 50 } },
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
      { type: 'hero', config: { layout: 'overlay', height: 'custom', heading: 'Our Menu', body: 'Order directly from our kitchen to your table.', overlay_opacity: 40 } },
      { type: 'menu_grid', config: { layout: '3col', show_category_tabs: true, show_description: true } },
      { type: 'contact', config: { show_map: false, show_hours: true } },
    ],
  },
  {
    id: 'link_in_bio',
    label: 'pageBuilder.templatesData.link_in_bio.label',
    description: 'pageBuilder.templatesData.link_in_bio.description',
    blocks: [
      { type: 'hero', config: { layout: 'overlay', height: 'custom', heading: 'Quick Links', body: 'Find us online or order for pickup.', overlay_opacity: 40 } },
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
