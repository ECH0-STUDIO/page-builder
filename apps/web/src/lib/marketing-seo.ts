import type { BlogPost } from '@/lib/blog'
import type { SupportedLocale } from '@/i18n/locale'
import { escapeHtml } from '@/lib/marketing-blog-html'
import { getMarketingBaseUrl } from '@/lib/site-urls'

export type MarketingSeoOverrides = {
  title?: string
  description?: string
  image?: string
  canonicalPath?: string
  blogPost?: BlogPost
}

type PageSeo = {
  title: Record<SupportedLocale, string>
  description: Record<SupportedLocale, string>
  schema: 'home' | 'page' | 'blog' | 'blog-post'
}

const MARKETING_PAGE_SEO: Record<string, PageSeo> = {
  index: {
    title: {
      vi: 'Eatery VN — Nâng tầm cửa hàng của bạn',
      en: 'Eatery — Elevate your store online',
    },
    description: {
      vi: 'Tạo Menu, QR thanh toán, website và nhận order trong vài bước. Không chi phí hàng tháng — bắt đầu miễn phí với Eatery VN.',
      en: 'Create your menu, payment QR, website, and take orders in a few steps. No monthly fees — start free with Eatery.',
    },
    schema: 'home',
  },
  features: {
    title: {
      vi: 'Tính năng — Eatery VN',
      en: 'Features — Eatery',
    },
    description: {
      vi: 'Khám phá page builder, thực đơn số, QR bàn, in menu và các công cụ giúp cửa hàng F&B vận hành trực tuyến.',
      en: 'Explore the page builder, digital menus, table QR codes, print menus, and tools that help food businesses go digital.',
    },
    schema: 'page',
  },
  pricing: {
    title: {
      vi: 'Bảng giá — Eatery VN',
      en: 'Pricing — Eatery',
    },
    description: {
      vi: 'Mô hình credit linh hoạt: bắt đầu miễn phí, chỉ trả khi cần tên miền riêng hoặc tính năng premium.',
      en: 'Flexible credit-based pricing: start free and only pay when you need a custom domain or premium add-ons.',
    },
    schema: 'page',
  },
  contact: {
    title: {
      vi: 'Liên hệ — Eatery VN',
      en: 'Contact — Eatery',
    },
    description: {
      vi: 'Liên hệ đội ngũ Eatery VN để được tư vấn thiết lập trang số và thực đơn QR cho cửa hàng của bạn.',
      en: 'Contact the Eatery team for help setting up your digital menu page and QR workflow.',
    },
    schema: 'page',
  },
  blog: {
    title: {
      vi: 'Tin tức & bài viết — Eatery VN',
      en: 'News & articles — Eatery',
    },
    description: {
      vi: 'Tin tức, hướng dẫn và mẹo sử dụng Eatery để vận hành cửa hàng ẩm thực trực tuyến hiệu quả hơn.',
      en: 'News, guides, and tips for running your food business online with Eatery.',
    },
    schema: 'blog',
  },
  detail_blog: {
    title: {
      vi: 'Bài viết — Eatery VN',
      en: 'Article — Eatery',
    },
    description: {
      vi: 'Đọc bài viết trên blog Eatery VN.',
      en: 'Read an article on the Eatery blog.',
    },
    schema: 'blog-post',
  },
}

export function resolveMarketingPageSlug(pathname: string): string {
  if (!pathname || pathname === '/') return 'index'
  if (pathname.startsWith('/blog/')) return 'detail_blog'
  if (pathname === '/blog') return 'blog'
  return pathname.replace(/^\//, '').split('/')[0] || 'index'
}

function setMeta(html: string, attr: 'name' | 'property', key: string, value: string): string {
  if (!value) return html
  const escaped = escapeHtml(value)
  const primary = new RegExp(
    `<meta[^>]+${attr}=["']${key}["'][^>]*>`,
    'i',
  )
  const replacement = `<meta ${attr}="${key}" content="${escaped}">`
  if (primary.test(html)) {
    return html.replace(primary, replacement)
  }
  return html.replace(/<\/head>/i, `  ${replacement}\n</head>`)
}

function organizationSchema(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Eatery VN',
    url: baseUrl,
    logo: `${baseUrl}/logo-icon.png`,
    email: 'hello@ech0.work',
  }
}

function buildSchema(
  slug: string,
  locale: SupportedLocale,
  seo: PageSeo,
  baseUrl: string,
  overrides: MarketingSeoOverrides,
): object | object[] {
  const org = organizationSchema(baseUrl)
  const pageUrl = `${baseUrl}${overrides.canonicalPath ?? (slug === 'index' ? '/' : `/${slug}`)}`

  if (seo.schema === 'home') {
    return [
      org,
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: locale === 'vi' ? 'Eatery VN' : 'Eatery',
        url: baseUrl,
        inLanguage: locale,
        publisher: { '@type': 'Organization', name: 'Eatery VN' },
      },
    ]
  }

  if (seo.schema === 'blog') {
    return [
      org,
      {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: seo.title[locale],
        description: seo.description[locale],
        url: `${baseUrl}/blog`,
        inLanguage: locale,
      },
    ]
  }

  if (seo.schema === 'blog-post' && overrides.blogPost) {
    const post = overrides.blogPost
    return [
      org,
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.summary,
        image: post.thumbnail || undefined,
        datePublished: post.publishedAt,
        author: post.author
          ? { '@type': 'Person', name: post.author }
          : { '@type': 'Organization', name: 'Eatery VN' },
        inLanguage: locale,
        mainEntityOfPage: `${baseUrl}/blog/${post.slug}`,
        publisher: {
          '@type': 'Organization',
          name: 'Eatery VN',
          logo: { '@type': 'ImageObject', url: `${baseUrl}/logo-icon.png` },
        },
      },
    ]
  }

  return [
    org,
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: overrides.title ?? seo.title[locale],
      description: overrides.description ?? seo.description[locale],
      url: pageUrl,
      inLanguage: locale,
    },
  ]
}

export function applyMarketingSeo(
  html: string,
  slug: string,
  locale: SupportedLocale,
  overrides: MarketingSeoOverrides = {},
): string {
  const seo = MARKETING_PAGE_SEO[slug] ?? MARKETING_PAGE_SEO.index
  const baseUrl = getMarketingBaseUrl()

  const title =
    overrides.title ??
    (slug === 'detail_blog' && overrides.blogPost
      ? `${overrides.blogPost.title} | ${locale === 'vi' ? 'Eatery VN' : 'Eatery'}`
      : seo.title[locale])

  const description =
    overrides.description ??
    (slug === 'detail_blog' && overrides.blogPost?.summary
      ? overrides.blogPost.summary
      : seo.description[locale])

  const image = overrides.image ?? overrides.blogPost?.thumbnail ?? `${baseUrl}/logo-icon.png`

  let out = html
  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`)
  out = setMeta(out, 'name', 'description', description)
  out = setMeta(out, 'property', 'og:title', title)
  out = setMeta(out, 'property', 'og:description', description)
  out = setMeta(out, 'property', 'og:url', `${baseUrl}${overrides.canonicalPath ?? (slug === 'index' ? '/' : `/${slug}`)}`)
  out = setMeta(out, 'property', 'og:image', image)
  out = setMeta(out, 'name', 'twitter:title', title)
  out = setMeta(out, 'name', 'twitter:description', description)
  out = setMeta(out, 'name', 'twitter:image', image)

  const schema = buildSchema(slug, locale, seo, baseUrl, overrides)
  const schemaJson = JSON.stringify(schema).replace(/</g, '\\u003c')
  out = out.replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '')
  out = out.replace(
    /<\/head>/i,
    `  <script type="application/ld+json">${schemaJson}</script>\n</head>`,
  )

  return out
}
