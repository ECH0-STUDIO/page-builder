/**
 * Page template presets.
 * Each is a starting arrangement of blocks (and optional theme) applied when the
 * user picks a template from the Templates panel. Blocks remain fully editable.
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

export const DEFAULT_PAGE_TEMPLATE_ID = 'eatery_default'

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: DEFAULT_PAGE_TEMPLATE_ID,
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
          text_color: '#FFFFFF',
          cta: {
            label: 'Gọi món',
            action: 'url',
            value: '/order',
            style: 'filled',
            color: '#FFFFFF',
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
]
