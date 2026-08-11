/**
 * Page template presets.
 * Each is a starting arrangement of blocks (and optional theme) applied when the
 * user picks a template from the Templates panel. Blocks remain fully editable.
 *
 * Placeholder images live in /public/templates/ — see public/templates/README.md
 */

import {
  BlockType,
  defaultHeroConfig,
  defaultTextImageConfig,
  defaultContactConfig,
  defaultMenuGridConfig,
  defaultQRCodeConfig,
  type ThemeSettings,
} from './types'

type TemplateBlockConfig = Partial<
  | typeof defaultHeroConfig
  | typeof defaultTextImageConfig
  | typeof defaultContactConfig
  | typeof defaultMenuGridConfig
  | typeof defaultQRCodeConfig
>

export interface TemplateBlock {
  type: BlockType
  config?: TemplateBlockConfig
  /** Scroll anchor on the live page, e.g. "menu" → id="menu" */
  block_anchor_id?: string
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

/** Public folder paths — served at /templates/<filename> */
const img = (filename: string) => `/templates/${filename}`

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
          border_radius: 'md',
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
          card_border_radius: 'md',
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

  // ─── Street Food — Bún Chả Hà Nội 36 ───────────────────────────────────────
  {
    id: 'street_food',
    label: 'pageBuilder.templatesData.street_food.label',
    description: 'pageBuilder.templatesData.street_food.description',
    theme: {
      primary_color: '#E85D26',
      background_color: '#FFFFFF',
      text_color: '#111111',
      font_family: 'Inter',
      heading_font_family: 'Bebas Neue',
    },
    blocks: [
      {
        type: 'hero',
        config: {
          layout: 'overlay',
          height: 'custom',
          min_height: 520,
          content_align: 'center',
          heading: 'Bún Chả Hà Nội 36',
          body: 'Thơm lửa than hồng — đậm vị Hà Nội. Thịt nướng than, nước chấm gia truyền, bún tươi mỗi sáng. Mở cửa 10:00 – 22:00.',
          image_url: img('street-food-hero.jpg'),
          image_position: 'center',
          overlay_opacity: 55,
          text_color: '#FFFFFF',
          cta: {
            label: 'Gọi món',
            action: 'url',
            value: '/order',
            style: 'filled',
            color: '#E85D26',
            open_in_new_tab: false,
          },
          cta_secondary: {
            label: 'Xem thực đơn',
            action: 'anchor',
            value: 'menu',
            style: 'outlined',
            color: '#FFFFFF',
          },
        },
      },
      {
        type: 'text_image',
        config: {
          layout: 'img_right',
          heading: 'Công thức ba đời',
          body: 'Từ 1987, gia đình chúng tôi giữ nguyên cách ướp thịt và pha nước chấm. Mỗi suất bún chả đều nướng ngay tại quầy — không hàng sẵn, không đông lạnh.',
          image_url: img('street-food-about.jpg'),
          aspect_ratio: '4_3',
          image_fit: 'cover',
          background: 'solid',
          background_color: '#FFF8F3',
          padding: 'spacious',
          border_radius: 'md',
          content_align: 'left',
          cta: null,
        },
      },
      {
        type: 'menu_grid',
        block_anchor_id: 'menu',
        config: {
          layout: 'list',
          heading: 'Thực đơn',
          description: 'Món chính · Khai vị · Đồ uống',
          selection_mode: 'category',
          show_category_tabs: true,
          tabs_layout: 'horizontal',
          show_image: true,
          show_description: true,
          show_price: true,
          background_color: '#FFFFFF',
          text_color: '#111111',
          card_background_color: '#FFFFFF',
          card_text_color: '#111111',
          card_border_color: '#E5E5E5',
          card_border_radius: 'md',
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
          background_color: '#1A1A1A',
          text_color: '#FFFFFF',
        },
      },
    ],
  },

  // ─── Garden Café — Lá Café ─────────────────────────────────────────────────
  {
    id: 'garden_cafe',
    label: 'pageBuilder.templatesData.garden_cafe.label',
    description: 'pageBuilder.templatesData.garden_cafe.description',
    theme: {
      primary_color: '#5C7A5C',
      background_color: '#FAFAF8',
      text_color: '#2D3B2D',
      font_family: 'Nunito',
      heading_font_family: 'Lora',
    },
    blocks: [
      {
        type: 'hero',
        config: {
          layout: 'split',
          height: 'custom',
          min_height: 480,
          content_align: 'left',
          heading: 'Lá Café',
          body: 'Cà phê specialty · Bánh ngọt handmade. Không gian xanh mát giữa lòng phố — ngồi lại, thở chậm, nhấp một ly cà phê rang mộc.',
          image_url: img('garden-cafe-hero.jpg'),
          split_image_side: 'left',
          split_bg_color: '#F0F4EF',
          split_text_color: '#2D3B2D',
          cta: {
            label: 'Gọi món',
            action: 'url',
            value: '/order',
            style: 'filled',
            color: '#5C7A5C',
            open_in_new_tab: false,
          },
        },
      },
      {
        type: 'text_image',
        config: {
          layout: 'stacked',
          heading: 'Hạt cà từ Đà Lạt',
          body: 'Chúng tôi rang từng mẻ nhỏ, pha bằng phin và pour-over. Bánh ngọt làm mới mỗi sáng — không chất bảo quản, không kem tủ.',
          image_url: img('garden-cafe-about.jpg'),
          aspect_ratio: '16_9',
          image_fit: 'cover',
          background: 'solid',
          background_color: '#F0F4EF',
          padding: 'spacious',
          border_radius: 'md',
          content_align: 'center',
          cta: null,
        },
      },
      {
        type: 'menu_grid',
        block_anchor_id: 'menu',
        config: {
          layout: '3col',
          heading: 'Thực đơn',
          description: 'Cà phê · Trà · Bánh ngọt',
          selection_mode: 'category',
          show_category_tabs: true,
          tabs_layout: 'horizontal',
          show_image: true,
          show_description: true,
          show_price: true,
          background_color: '#FAFAF8',
          text_color: '#2D3B2D',
          card_background_color: '#FFFFFF',
          card_text_color: '#111111',
          card_border_color: '#E8EDE8',
          card_border_radius: 'md',
        },
      },
      {
        type: 'qr_code',
        config: {
          target: 'custom',
          custom_url: '/order',
          size: 'md',
          label: 'Quét để gọi món tại bàn',
          show_download: true,
          background_color: '#F0F4EF',
          qr_color: '#5C7A5C',
          text_color: '#2D3B2D',
          alignment: 'center',
          border_radius: '2xl',
        },
      },
    ],
  },

  // ─── Heritage Kitchen — Cơm Niêu Sài Gòn ──────────────────────────────────
  {
    id: 'heritage_kitchen',
    label: 'pageBuilder.templatesData.heritage_kitchen.label',
    description: 'pageBuilder.templatesData.heritage_kitchen.description',
    theme: {
      primary_color: '#8B4513',
      background_color: '#FFFBF7',
      text_color: '#3D2B1F',
      font_family: 'Lato',
      heading_font_family: 'Playfair Display',
    },
    blocks: [
      {
        type: 'hero',
        config: {
          layout: 'overlay',
          height: 'custom',
          min_height: 500,
          content_align: 'center',
          heading: 'Cơm Niêu Sài Gòn',
          body: 'Cơm niêu rang muối · Món dân · Hương vị xưa. Nấu trong nồi đất, ăn bằng muỗng gỗ — như bữa cơm nhà xưa.',
          image_url: img('heritage-hero.jpg'),
          image_position: 'center',
          overlay_opacity: 45,
          text_color: '#FFFFFF',
          cta: {
            label: 'Gọi món',
            action: 'url',
            value: '/order',
            style: 'filled',
            color: '#8B4513',
            open_in_new_tab: false,
          },
        },
      },
      {
        type: 'text_image',
        config: {
          layout: 'img_left',
          heading: 'Từ căn bếp nhỏ ở Chợ Lớn',
          body: 'Mẹ tôi bán cơm niêu từ năm 1972. Hôm nay, con cháu vẫn nấu đúng cách rang muối, đúng lửa nhỏ — không máy móc, không vội.',
          image_url: img('heritage-about.jpg'),
          aspect_ratio: '4_3',
          image_fit: 'cover',
          background: 'solid',
          background_color: '#F5EDE4',
          padding: 'spacious',
          border_radius: 'md',
          content_align: 'left',
          cta: null,
        },
      },
      {
        type: 'menu_grid',
        block_anchor_id: 'menu',
        config: {
          layout: 'list',
          heading: 'Thực đơn',
          description: 'Cơm niêu · Món mặn · Canh · Tráng miệng',
          selection_mode: 'category',
          show_category_tabs: true,
          tabs_layout: 'horizontal',
          show_image: true,
          show_description: true,
          show_price: true,
          background_color: '#FFFBF7',
          text_color: '#3D2B1F',
          card_background_color: '#FFFFFF',
          card_text_color: '#111111',
          card_border_color: '#E8DDD0',
          card_border_radius: 'md',
        },
      },
      {
        type: 'contact',
        config: {
          layout: 'vertical',
          show_map: true,
          map_height: 'medium',
          show_hours: true,
          show_phone: true,
          show_address: true,
          show_email: false,
          background: 'solid',
          background_color: '#3D2B1F',
          text_color: '#F5EDE4',
        },
      },
    ],
  },

  // ─── Fast Casual — Roll & Bowl ─────────────────────────────────────────────
  {
    id: 'fast_casual',
    label: 'pageBuilder.templatesData.fast_casual.label',
    description: 'pageBuilder.templatesData.fast_casual.description',
    theme: {
      primary_color: '#FF6B35',
      background_color: '#FFFFFF',
      text_color: '#111111',
      font_family: 'Inter',
      heading_font_family: 'Poppins',
    },
    blocks: [
      {
        type: 'hero',
        config: {
          layout: 'text_only',
          height: 'custom',
          min_height: 380,
          content_align: 'center',
          heading: 'Roll & Bowl',
          body: 'Fresh rolls · Rice bowls · Ready in 5 min. Gọi món trên điện thoại, nhận món tại quầy. Không chờ, không phức tạp.',
          text_only_bg: 'gradient',
          text_only_color: '#FF6B35',
          text_only_color_end: '#FF8C42',
          text_color: '#FFFFFF',
          cta: {
            label: 'Gọi món ngay',
            action: 'url',
            value: '/order',
            style: 'filled',
            color: '#FFFFFF',
            open_in_new_tab: false,
          },
        },
      },
      {
        type: 'menu_grid',
        block_anchor_id: 'menu',
        config: {
          layout: '2col',
          heading: 'Chọn món',
          description: '',
          selection_mode: 'category',
          show_category_tabs: true,
          tabs_layout: 'horizontal',
          show_image: true,
          show_description: false,
          show_price: true,
          background_color: '#FFFFFF',
          text_color: '#111111',
          card_background_color: '#FFFFFF',
          card_text_color: '#111111',
          card_border_color: '#EEEEEE',
          card_border_radius: 'md',
        },
      },
      {
        type: 'qr_code',
        config: {
          target: 'custom',
          custom_url: '/order',
          size: 'lg',
          label: 'Quét QR — gọi món nhanh',
          show_download: true,
          background_color: '#FFFFFF',
          qr_color: '#FF6B35',
          text_color: '#111111',
          alignment: 'center',
          border_radius: '2xl',
        },
      },
      {
        type: 'contact',
        config: {
          layout: 'map_left',
          show_map: true,
          map_height: 'small',
          show_hours: true,
          show_phone: true,
          show_address: true,
          show_email: false,
          background: 'solid',
          background_color: '#FFFFFF',
          text_color: '#111111',
        },
      },
    ],
  },
]
