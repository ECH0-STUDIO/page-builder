/**
 * Page Builder — shared type definitions
 */

// ─── Block types ──────────────────────────────────────────────────────────────

export type BlockType = 'hero' | 'text_image' | 'contact' | 'menu_grid' | 'qr_code'

// ─── Spacing ──────────────────────────────────────────────────────────────────

export interface BlockSpacing {
  padding_top: number
  padding_right: number
  padding_bottom: number
  padding_left: number
  margin_top: number
  margin_bottom: number
}

export const defaultSpacing: BlockSpacing = {
  padding_top: 0,
  padding_right: 0,
  padding_bottom: 0,
  padding_left: 0,
  margin_top: 0,
  margin_bottom: 0,
}

/** Default horizontal inset applied on the section shell for content blocks. */
export const SECTION_SIDE_PADDING = 24

/** Natural outer spacing defaults per block type (matches each block's built-in design rhythm) */
export const BLOCK_DEFAULT_SPACING: Partial<Record<BlockType, BlockSpacing>> = {
  hero: { padding_top: 64, padding_right: SECTION_SIDE_PADDING, padding_bottom: 64, padding_left: SECTION_SIDE_PADDING, margin_top: 0, margin_bottom: 0 },
  text_image: { padding_top: 64, padding_right: SECTION_SIDE_PADDING, padding_bottom: 64, padding_left: SECTION_SIDE_PADDING, margin_top: 0, margin_bottom: 0 },
  // Contact / menu / QR — vertical + horizontal rhythm on the section shell
  contact: { padding_top: 64, padding_right: SECTION_SIDE_PADDING, padding_bottom: 64, padding_left: SECTION_SIDE_PADDING, margin_top: 0, margin_bottom: 0 },
  menu_grid: { padding_top: 64, padding_right: SECTION_SIDE_PADDING, padding_bottom: 64, padding_left: SECTION_SIDE_PADDING, margin_top: 0, margin_bottom: 0 },
  qr_code: { padding_top: 48, padding_right: SECTION_SIDE_PADDING, padding_bottom: 48, padding_left: SECTION_SIDE_PADDING, margin_top: 0, margin_bottom: 0 },
}

// ─── Google Fonts curated list ────────────────────────────────────────────────

export const GOOGLE_FONTS: { name: string; category: string }[] = [
  // Modern / clean
  { name: 'Inter', category: 'Sans-serif' },
  { name: 'DM Sans', category: 'Sans-serif' },
  { name: 'Plus Jakarta Sans', category: 'Sans-serif' },
  { name: 'Outfit', category: 'Sans-serif' },
  { name: 'Space Grotesk', category: 'Sans-serif' },
  { name: 'Figtree', category: 'Sans-serif' },
  { name: 'Work Sans', category: 'Sans-serif' },
  // Classic neutral
  { name: 'Roboto', category: 'Sans-serif' },
  { name: 'Open Sans', category: 'Sans-serif' },
  { name: 'Lato', category: 'Sans-serif' },
  { name: 'Nunito', category: 'Sans-serif' },
  { name: 'Poppins', category: 'Sans-serif' },
  { name: 'Montserrat', category: 'Sans-serif' },
  { name: 'Raleway', category: 'Sans-serif' },
  { name: 'Mulish', category: 'Sans-serif' },
  { name: 'Barlow', category: 'Sans-serif' },
  // Display
  { name: 'Oswald', category: 'Display' },
  { name: 'Bebas Neue', category: 'Display' },
  { name: 'Anton', category: 'Display' },
  { name: 'Syne', category: 'Display' },
  { name: 'Bricolage Grotesque', category: 'Display' },
  // Serif
  { name: 'Playfair Display', category: 'Serif' },
  { name: 'Merriweather', category: 'Serif' },
  { name: 'Lora', category: 'Serif' },
  { name: 'PT Serif', category: 'Serif' },
  { name: 'EB Garamond', category: 'Serif' },
  // Script
  { name: 'Dancing Script', category: 'Script' },
  { name: 'Pacifico', category: 'Script' },
  { name: 'Caveat', category: 'Script' },
  { name: 'Sacramento', category: 'Script' },
]

// ─── Base block ───────────────────────────────────────────────────────────────

export interface PageBlock {
  id: string
  business_id: string
  type: BlockType
  sort_order: number
  visible: boolean
  config: HeroConfig | TextImageConfig | ContactConfig | MenuGridConfig | QRCodeConfig
  spacing: BlockSpacing
  custom_css: string
  /** User-defined scroll anchor id, e.g. "menu" → id="menu" on live page */
  block_anchor_id?: string | null
  created_at?: string
  updated_at?: string
}

// ─── CTA helper ───────────────────────────────────────────────────────────────

export type CtaAction = 'url' | 'tel' | 'anchor' | 'email'
export type CtaStyle = 'filled' | 'outlined' | 'text'

export interface CtaButton {
  label: string
  action: CtaAction
  value: string
  style: CtaStyle
  /** Custom button colour; null/undefined = use brand colour from theme */
  color?: string | null
  /** When action is url, open link in a new browser tab */
  open_in_new_tab?: boolean
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export type HeroLayout = 'centered' | 'split' | 'overlay' | 'text_only'
export type BlockHeight = 'custom' | 'fullscreen'
export type ImagePosition = 'top' | 'center' | 'bottom'
export type SplitImageSide = 'left' | 'right'

export interface HeroConfig {
  layout: HeroLayout
  heading: string
  tagline: string
  body: string
  image_url: string
  image_position: ImagePosition
  overlay_opacity: number
  cta: CtaButton | null
  cta_secondary: CtaButton | null
  text_color: 'auto' | string
  height: BlockHeight
  /** @deprecated Use block spacing (outer padding) instead */
  section_padding_y?: number
  /** --- Split layout specific --- */
  /** Which side the image sits on in the Split layout */
  split_image_side: SplitImageSide
  /** Background colour for the text pane in the Split layout */
  split_bg_color: string
  /** Text colour for the text pane in the Split layout (overrides text_color for split) */
  split_text_color: string
  /** --- Text-only layout specific --- */
  text_only_bg: 'solid' | 'gradient'
  text_only_color: string
  text_only_color_end: string
}

export const defaultHeroConfig: HeroConfig = {
  layout: 'overlay',
  heading: '',
  tagline: '',
  body: '',
  image_url: '',
  image_position: 'center',
  overlay_opacity: 40,
  cta: null,
  cta_secondary: null,
  text_color: 'auto',
  height: 'custom',
  split_image_side: 'right',
  split_bg_color: '#1a1a2e',
  split_text_color: '#ffffff',
  text_only_bg: 'gradient',
  text_only_color: '#1a1a2e',
  text_only_color_end: '#0f3460',
}

// ─── Text + Image ─────────────────────────────────────────────────────────────

export type TextImageLayout = 'img_left' | 'img_right' | 'stacked' | 'text_only' | 'img_only'
export type AspectRatio = 'square' | '4_3' | '16_9' | 'free'
export type ImageFit = 'cover' | 'contain'
export type BlockBackground = 'transparent' | 'solid' | 'gradient'
export type PaddingSize = 'compact' | 'normal' | 'spacious'

export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface TextImageConfig {
  layout: TextImageLayout
  heading: string
  body: string
  cta: CtaButton | null
  image_url: string
  aspect_ratio: AspectRatio
  /** Custom ratio width when aspect_ratio === 'free' */
  aspect_ratio_width?: number
  /** Custom ratio height when aspect_ratio === 'free' */
  aspect_ratio_height?: number
  image_fit: ImageFit
  background: BlockBackground
  background_color: string
  /** gradient start colour (used when background === 'gradient') */
  gradient_from: string
  /** gradient end colour (used when background === 'gradient') */
  gradient_to: string
  padding: PaddingSize
  /** image corner radius level */
  border_radius: BorderRadius
}

export const defaultTextImageConfig: TextImageConfig = {
  layout: 'img_left',
  heading: '',
  body: '',
  cta: null,
  image_url: '',
  aspect_ratio: '4_3',
  aspect_ratio_width: 4,
  aspect_ratio_height: 3,
  image_fit: 'cover',
  background: 'transparent',
  background_color: '#f9f9f9',
  gradient_from: '#f8f8f8',
  gradient_to: '#e8e8e8',
  padding: 'normal',
  border_radius: 'md',
}

// ─── Contact ──────────────────────────────────────────────────────────────────

export type MapHeight = 'small' | 'medium' | 'large'
export type ContactLayout = 'vertical' | 'map_left'

export interface ContactConfig {
  layout: ContactLayout
  show_map: boolean
  map_height: MapHeight
  show_phone: boolean
  show_email: boolean
  show_address: boolean
  show_hours: boolean
  socials_shown: string[]
  /** section background colour */
  background_color: string
  /** labels/heading colour */
  text_color: string
}

export const defaultContactConfig: ContactConfig = {
  layout: 'vertical',
  show_map: true,
  map_height: 'medium',
  show_phone: true,
  show_email: true,
  show_address: true,
  show_hours: true,
  socials_shown: ['facebook', 'instagram', 'zalo'],
  background_color: '#f8f8f8',
  text_color: '#111111',
}

// ─── Menu Grid (Phase 5) ──────────────────────────────────────────────────────

export interface MenuGridConfig {
  category_ids: string[]         // empty = all categories
  layout: '2col' | '3col' | 'list'
  show_image: boolean
  show_description: boolean
  show_price: boolean
  show_unavailable_badge: boolean
  /** Section heading shown above the grid (optional) */
  heading: string
  /** Show tabs/buttons to filter by category on the live page */
  show_category_tabs: boolean
  /** Section background colour */
  background_color: string
  /** Heading + text colour */
  text_color: string
  /** Description shown below heading */
  description?: string
  /** Selection mode: 'category' (default) or 'custom_items' */
  selection_mode?: 'category' | 'custom_items'
  /** Array of item IDs to show when selection_mode is 'custom_items' */
  item_ids?: string[]
  /** Layout for tabs on desktop (horizontal scroll vs sidebar) */
  tabs_layout?: 'horizontal' | 'sidebar'
  /** Paginate items on the live page */
  pagination_enabled?: boolean
  /** Items shown per page when pagination is enabled */
  items_per_page?: number
}

export const defaultMenuGridConfig: MenuGridConfig = {
  category_ids: [],
  layout: '3col',
  show_image: true,
  show_description: true,
  show_price: true,
  show_unavailable_badge: true,
  heading: '',
  show_category_tabs: true,
  background_color: '#ffffff',
  text_color: '#111111',
  description: '',
  selection_mode: 'category',
  item_ids: [],
  tabs_layout: 'sidebar',
  pagination_enabled: false,
  items_per_page: 12,
}

// ─── QR Code Block ────────────────────────────────────────────────────────────

export interface QRCodeConfig {
  /** 'payment' = generates VietQR, 'custom' = user-defined URL */
  target: 'payment' | 'custom'
  custom_url: string
  size: 'sm' | 'md' | 'lg'
  label: string
  show_download: boolean
  background_color: string
  background_image?: string
  /** QR module (foreground) colour */
  qr_color: string
  /** Label text colour */
  text_color: string
  alignment: 'left' | 'center' | 'right'
  border_radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
}

export const defaultQRCodeConfig: QRCodeConfig = {
  target: 'payment',
  custom_url: '',
  size: 'md',
  label: 'Scan to pay',
  show_download: true,
  background_color: '#ffffff',
  qr_color: '#111111',
  text_color: '#111111',
  alignment: 'center',
  border_radius: '2xl',
}



// ─── Navbar ───────────────────────────────────────────────────────────────────

export interface NavLink {
  label: string
  href: string
  anchor: boolean   // true = scroll to #section-id on the same page
  /** External URL only — open in a new browser tab */
  open_in_new_tab?: boolean
}

export interface NavbarConfig {
  links: NavLink[]
  logo_type: 'business_name' | 'logo_image'
  sticky: boolean
  background_color: string
  text_color: string
}

export const defaultNavbarConfig: NavbarConfig = {
  links: [],
  logo_type: 'business_name',
  sticky: true,
  background_color: '#ffffff',
  text_color: '#111111',
}

// ─── Footer ───────────────────────────────────────────────────────────────────

export interface FooterConfig {
  show_business_name: boolean
  copyright_text: string
  background_color: string
  background_image?: string
  text_color: string
  padding_top: number
  padding_right: number
  padding_bottom: number
  padding_left: number
}

export const defaultFooterConfig: FooterConfig = {
  show_business_name: true,
  copyright_text: 'All rights reserved.',
  background_color: '#111111',
  background_image: '',
  text_color: '#ffffff',
  padding_top: 32,
  padding_right: 24,
  padding_bottom: 32,
  padding_left: 24,
}

// ─── Publishing / Theme ───────────────────────────────────────────────────────

export interface PublishingSettings {
  id: string
  business_id: string
  published: boolean
  custom_domain: string | null
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  favicon_url: string | null
  apple_touch_icon_url: string | null
  language: string
  gsc_verification: string | null
  has_unpublished_changes: boolean | null
  google_analytics_id?: string | null
  facebook_pixel_id?: string | null
  tiktok_pixel_id?: string | null
}

export interface ThemeSettings {
  id: string
  business_id: string
  primary_color: string
  background_color: string
  /** Default body/heading text colour for sections that don't override */
  text_color: string
  font_family: string            // body / paragraph font
  heading_font_family: string | null    // h1, h2, h3 font
  navbar_config?: NavbarConfig | null
  footer_config?: FooterConfig | null
}

export const defaultThemeSettings: Omit<ThemeSettings, 'id' | 'business_id'> = {
  primary_color: '#E85D26',
  background_color: '#FFFFFF',
  text_color: '#111111',
  font_family: 'Inter',
  heading_font_family: 'Inter',
  navbar_config: null,
  footer_config: null,
}
