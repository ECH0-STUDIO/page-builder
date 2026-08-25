import type { SupportedLocale } from '@/i18n/locale'
import { escapeHtml } from '@/lib/marketing-blog-html'

/** Marketing-only GA4. Never inject on app.eateryvn.com routes. */
export const MARKETING_GA_MEASUREMENT_ID = 'G-HPWH35P906'

/** Default Open Graph / Twitter share image for marketing pages. */
export const MARKETING_OG_IMAGE_PATH = '/marketing/images/og-eateryvn.jpg'

/** Hide footer social icons until real profile URLs are ready. */
export const MARKETING_SHOW_SOCIAL_LINKS = false

const IMAGE_ALT_BY_FILE: Record<string, Record<SupportedLocale, string>> = {
  'logo-full': { vi: 'Eatery', en: 'Eatery' },
  'logo-full-white': { vi: 'Eatery', en: 'Eatery' },
  'logo-full-1-vectorized': { vi: 'Eatery', en: 'Eatery' },
  'logo-full.webp': { vi: 'Eatery', en: 'Eatery' },
  'hero-item-1': { vi: 'Giao diện Eatery trên điện thoại', en: 'Eatery mobile interface' },
  'hero-item-2': { vi: 'Giao diện Eatery trên máy tính bảng', en: 'Eatery tablet interface' },
  'hero-item-3': { vi: 'Giao diện Eatery trên máy tính', en: 'Eatery desktop interface' },
  'star_1': { vi: 'Ngôi sao đánh giá', en: 'Rating star' },
  'star': { vi: 'Ngôi sao đánh giá', en: 'Rating star' },
  'frame-2147227617': { vi: 'Hình nền trang chủ Eatery', en: 'Eatery homepage hero background' },
  'users-1': { vi: 'Khách hàng Eatery', en: 'Eatery customer' },
  'users-2': { vi: 'Khách hàng Eatery', en: 'Eatery customer' },
  'users-3': { vi: 'Khách hàng Eatery', en: 'Eatery customer' },
  'users-4': { vi: 'Khách hàng Eatery', en: 'Eatery customer' },
  'material-symbols_timer-rounded': { vi: 'Biểu tượng thời gian', en: 'Timer icon' },
  'eatery-menu-modal': { vi: 'Trình tạo thực đơn Eatery', en: 'Eatery menu builder' },
  'eatery-dish-img': { vi: 'Món ăn trên trang Eatery', en: 'Dish on an Eatery page' },
  'eatery-qr-img': { vi: 'Mã QR thanh toán Eatery', en: 'Eatery payment QR code' },
  'eatery-order-img': { vi: 'Đơn hàng bàn trên Eatery', en: 'Eatery table order screen' },
  'eatery-sign-up': { vi: 'Màn hình đăng ký Eatery', en: 'Eatery sign-up screen' },
  'eatery-business-profile': { vi: 'Hồ sơ cửa hàng trên Eatery', en: 'Eatery store profile' },
  'eatery-explore': { vi: 'Khám phá tính năng Eatery', en: 'Exploring Eatery features' },
  'eatery-creditl': { vi: 'Hệ thống credit Eatery', en: 'Eatery credit system' },
  'eatery-businesses': { vi: 'Nhiều cửa hàng trên Eatery', en: 'Multiple stores on Eatery' },
  'eatery-qr': { vi: 'Mã QR Eatery', en: 'Eatery QR code' },
  '404-image': { vi: 'Trang không tìm thấy', en: 'Page not found illustration' },
  'og-eateryvn': {
    vi: 'Logo Eatery VN với ba hình lá xanh xếp chồng cạnh chữ Eatery VN trên nền gradient mint',
    en: 'Eatery VN logo featuring three overlapping green leaf-like shapes next to the text Eatery VN on a light mint gradient background',
  },
}

function basenameFromSrc(src: string): string {
  try {
    const path = src.split('?')[0] || src
    const file = decodeURIComponent(path.split('/').pop() || '')
    return file.toLowerCase()
  } catch {
    return ''
  }
}

function lookupAlt(file: string, locale: SupportedLocale): string | null {
  if (!file) return null
  const stem = file.replace(/\.(avif|webp|png|jpe?g|svg)$/i, '')
  for (const [key, labels] of Object.entries(IMAGE_ALT_BY_FILE)) {
    if (file.includes(key) || stem.includes(key) || stem.startsWith(key)) {
      return labels[locale]
    }
  }
  // Humanize leftover filenames as a last resort
  const cleaned = stem
    .replace(/[_-]+/g, ' ')
    .replace(/\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (cleaned.length >= 3) {
    return cleaned.replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return locale === 'en' ? 'Eatery' : 'Eatery'
}

/** Fill empty alt attributes on marketing images. */
export function rewriteMarketingImageAlts(html: string, locale: SupportedLocale): string {
  return html.replace(/<img\b([^>]*)>/gi, (full, attrs: string) => {
    if (/\balt\s*=\s*["'][^"']+["']/i.test(attrs)) return full
    const src = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] ?? ''
    const alt = lookupAlt(basenameFromSrc(src), locale) ?? 'Eatery'
    if (/\balt\s*=\s*["']["']/i.test(attrs)) {
      return `<img${attrs.replace(/\balt\s*=\s*["']["']/i, `alt="${escapeHtml(alt)}"`)}>`
    }
    return `<img alt="${escapeHtml(alt)}"${attrs}>`
  })
}

export function injectMarketingAnalytics(html: string): string {
  const id = MARKETING_GA_MEASUREMENT_ID
  if (!id || html.includes(`gtag/js?id=${id}`)) return html
  const snippet = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${id}');
</script>`
  return html.replace(/<\/head>/i, `${snippet}\n</head>`)
}

export function getMarketingOgImageUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, '')}${MARKETING_OG_IMAGE_PATH}`
}
