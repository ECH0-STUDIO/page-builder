import type { BlogPost } from '@/lib/blog'
import type { SupportedLocale } from '@/i18n/locale'
import {
  BLOG_META_LABELS,
  BLOG_SECTION_COPY,
  marketingPathForLocale,
} from '@/lib/marketing-locale'

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function hideClass(empty: boolean): string {
  return empty ? ' hide' : ''
}

function imgTag(src: string, alt: string, className = 'img'): string {
  return `<img src="${escapeHtml(src)}" loading="lazy" alt="${escapeHtml(alt)}" class="${className}">`
}

function buildBlogCard(post: BlogPost, itemClass: string, locale: SupportedLocale): string {
  const pillLabel = post.category || post.date
  const href = marketingPathForLocale(`/blog/${post.slug}`, locale)
  return `<div role="listitem" class="${itemClass}">
  <a href="${escapeHtml(href)}" class="blog-item w-inline-block">
    <div class="blog_img${hideClass(!post.thumbnail)}">
      ${post.thumbnail ? imgTag(post.thumbnail, post.title) : ''}
      <div class="hero-cms_date${hideClass(!pillLabel)}">
        <div class="pill-item">
          <div>${escapeHtml(pillLabel)}</div>
        </div>
      </div>
    </div>
    <div class="blog_item_content">
      <h3 class="h5 text-style-2lines">${escapeHtml(post.title)}</h3>
      <div${hideClass(!post.summary)}>${escapeHtml(post.summary)}</div>
    </div>
  </a>
</div>`
}

const BLOG_CAROUSEL_LIST_RE =
  /<div role="list" class="blog_list swiper-wrapper w-dyn-items">[\s\S]*?<\/div>(?=\s*<\/div>\s*<div class="arrows_group)/

const BLOG_CAROUSEL_LIST_RE_ALT =
  /<div role="list" class="blog_list swiper-wrapper w-dyn-items">[\s\S]*?<\/div>(?=\s*<\/div>\s*<\/div>\s*<div class="arrows_group)/

function replaceBlogCarouselList(html: string, replacement: string): string {
  if (BLOG_CAROUSEL_LIST_RE.test(html)) {
    return html.replace(BLOG_CAROUSEL_LIST_RE, replacement)
  }
  if (BLOG_CAROUSEL_LIST_RE_ALT.test(html)) {
    return html.replace(BLOG_CAROUSEL_LIST_RE_ALT, replacement)
  }
  return html
}

export function injectBlogCarousel(html: string, posts: BlogPost[], locale: SupportedLocale): string {
  if (!BLOG_CAROUSEL_LIST_RE.test(html) && !BLOG_CAROUSEL_LIST_RE_ALT.test(html)) {
    return html
  }

  if (posts.length === 0) {
    return replaceBlogCarouselList(
      html,
      '<div role="list" class="blog_list swiper-wrapper w-dyn-items"></div>',
    )
  }

  const items = posts
    .map((post) => buildBlogCard(post, 'blog-slide swiper-slide w-dyn-item', locale))
    .join('\n                    ')
  return replaceBlogCarouselList(
    html,
    `<div role="list" class="blog_list swiper-wrapper w-dyn-items">\n                    ${items}\n                  </div>`,
  )
}

/** Inject posts into any Webflow CMS collection list that uses blog-item cards. */
export function injectBlogCollection(html: string, posts: BlogPost[], locale: SupportedLocale): string {
  if (html.includes('blog_list swiper-wrapper')) {
    return injectBlogCarousel(html, posts, locale)
  }

  let replaced = false
  return html.replace(
    /<div role="list" class="([^"]*w-dyn-items[^"]*)">([\s\S]*?)<\/div>/g,
    (full, listClass: string, inner: string) => {
      if (replaced || !inner.includes('w-dyn-item')) return full
      replaced = true

      const itemClassMatch = inner.match(/<div role="listitem" class="([^"]*)"/)
      const itemClass = itemClassMatch?.[1] ?? 'w-dyn-item'
      if (posts.length === 0) {
        return `<div role="list" class="${listClass}"></div>`
      }

      const items = posts.map((post) => buildBlogCard(post, itemClass, locale)).join('\n                    ')
      return `<div role="list" class="${listClass}">\n                    ${items}\n                  </div>`
    },
  )
}

function fillMetadataRow(html: string, post: BlogPost, locale: SupportedLocale): string {
  const labels = BLOG_META_LABELS[locale]
  const values = [post.date, post.category, post.reading]
  const items = labels
    .map((label, index) => {
      const value = values[index] ?? ''
      if (!value) {
        return `<div cms="content-item" class="hide"><div class="text-base">${label}</div><div class="spacer-tiny"></div><div class="text-sm"></div></div>`
      }
      return `<div cms="content-item"><div class="text-base">${label}</div><div class="spacer-tiny"></div><div class="text-sm">${escapeHtml(value)}</div></div>`
    })
    .join('\n                  ')

  return html.replace(
    /<div class="hero-cms_data">[\s\S]*?<\/div>\s*(?=<div cms="content-item" class="text-rich-text)/,
    `<div class="hero-cms_data">\n                  ${items}\n                </div>\n                `,
  )
}

function injectBlogSectionCopy(html: string, locale: SupportedLocale): string {
  const copy = BLOG_SECTION_COPY[locale]
  let out = html

  // Homepage blog section (`id="blog"`)
  out = out.replace(
    /<section id="blog"[\s\S]*?<div animation="badge"[^>]*>\s*<div>[^<]*<\/div>/,
    (match) => match.replace(/<div>[^<]*<\/div>/, `<div>${copy.badge}</div>`),
  )
  out = out.replace(
    /(<section id="blog"[\s\S]*?<h2[^>]*>)[^<]*(<\/h2>)/,
    `$1${escapeHtml(copy.title)}$2`,
  )
  out = out.replace(
    /(<section id="blog"[\s\S]*?<div animation="description"[^>]*>)[^<]*(<\/div>)/,
    `$1${escapeHtml(copy.description)}$2`,
  )

  // Related-posts carousel on article pages (`section_blog` without `id="blog"`)
  out = out.replace(
    /<section class="section_blog">[\s\S]*?<div animation="badge"[^>]*>\s*<div>[^<]*<\/div>/,
    (match) => match.replace(/<div>[^<]*<\/div>/, `<div>${copy.badge}</div>`),
  )
  out = out.replace(
    /(<section class="section_blog">[\s\S]*?<h2[^>]*>)[^<]*(<\/h2>)/,
    `$1${escapeHtml(copy.title)}$2`,
  )
  out = out.replace(
    /(<section class="section_blog">[\s\S]*?<div animation="description"[^>]*>)[^<]*(<\/div>)/,
    `$1${escapeHtml(copy.description)}$2`,
  )
  return out
}

function setSocialLinks(html: string, links: [string, string, string]): string {
  const hasAny = links.some(Boolean)
  let out = html.replace(
    /(<div class="hero-cms_social)([^"]*)(")/,
    `$1${hasAny ? '$2' : '$2 hide'}$3`,
  )

  let index = 0
  out = out.replace(
    /<a href="#" class="author-social-item w-inline-block">/g,
    () => {
      const url = links[index++] ?? ''
      if (!url) return `<a href="#" class="author-social-item w-inline-block hide">`
      return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="author-social-item w-inline-block">`
    },
  )
  return out
}

function replaceHeroImageBlock(html: string, post: BlogPost): string {
  const heroPill = post.category || post.date
  const block = post.thumbnail
    ? `<div cms="item" class="hero-cms_img">
                ${imgTag(post.thumbnail, post.title)}
                  <div class="hero-cms_date${hideClass(!heroPill)}">
                    <div class="pill-item">
                      <div>${escapeHtml(heroPill)}</div>
                    </div>
                  </div>
                </div>`
    : `<div cms="item" class="hero-cms_img hide"></div>`

  return html.replace(
    /<div cms="item" class="hero-cms_img">[\s\S]*?<\/div>\s*(?=<div cms="item" class="hero-cms_data-author">)/,
    block,
  )
}

export function renderBlogDetailHtml(
  html: string,
  post: BlogPost,
  relatedPosts: BlogPost[],
  locale: SupportedLocale,
): string {
  let out = injectBlogSectionCopy(html, locale)
  const shareLabel = BLOG_SECTION_COPY[locale].shareArticle

  // Hero header: title + summary (remove w-dyn-bind-empty so Webflow CSS does not hide them)
  out = out.replace(
    /<div cms="item" class="hero-cms_header">[\s\S]*?<\/div>\s*(?=<div cms="item" class="hero-cms_img">)/,
    `<div cms="item" class="hero-cms_header">
                  <h1 class="h5">${escapeHtml(post.title)}</h1>
                  <div class="text-color-secondary${hideClass(!post.summary)}">${post.summary ? escapeHtml(post.summary) : ''}</div>
                </div>
                `,
  )

  out = replaceHeroImageBlock(out, post)

  // Author block
  const hasAuthor = Boolean(post.author || post.avatar)
  out = out.replace(
    /<div class="hero-cms_author">/,
    `<div class="hero-cms_author${hideClass(!hasAuthor)}">`,
  )
  if (post.avatar) {
    out = out.replace(
      /<div class="author-avatar"><img[^>]*>/,
      `<div class="author-avatar">${imgTag(post.avatar, post.author || post.title, '')}`,
    )
  } else {
    out = out.replace(/<div class="author-avatar">/, `<div class="author-avatar hide">`)
  }
  out = out.replace(
    /(<div class="hero-cms_author">[\s\S]*?<div>\s*)<div class="w-dyn-bind-empty">[^<]*<\/div>/,
    `$1<div>${post.author ? escapeHtml(post.author) : ''}</div>`,
  )
  out = out.replace(
    /(<div class="hero-cms_author">[\s\S]*?<div class="text-sm text-color-secondary) w-dyn-bind-empty("[^>]*>)[^<]*(<\/div>)/,
    `$1${post.role ? '"' : ' hide"'}>${post.role ? escapeHtml(post.role) : ''}$3`,
  )

  out = setSocialLinks(out, [post.socialFirst, post.socialSecond, post.socialThird])
  out = out.replace(
    /<div class="text-sm text-color-secondary">(?:Share article|Chia sẻ bài viết)<\/div>/,
    `<div class="text-sm text-color-secondary">${escapeHtml(shareLabel)}</div>`,
  )

  out = fillMetadataRow(out, post, locale)

  out = out.replace(
    /<div cms="content-item" class="text-rich-text w-dyn-bind-empty w-richtext"><\/div>/,
    `<div cms="content-item" class="text-rich-text w-richtext">${post.body}</div>`,
  )
  if (!post.body) {
    out = out.replace(
      /<div cms="content-item" class="text-rich-text w-dyn-bind-empty w-richtext"><\/div>/,
      `<div cms="content-item" class="text-rich-text w-richtext hide"></div>`,
    )
  }

  // Related posts carousel (exclude current)
  const related = relatedPosts.filter((p) => p.slug !== post.slug)
  out = injectBlogCarousel(out, related, locale)

  return out
}

export function renderMarketingIndexHtml(
  html: string,
  posts: BlogPost[],
  locale: SupportedLocale,
): string {
  return injectBlogCarousel(injectBlogSectionCopy(html, locale), posts, locale)
}

export function renderBlogListHtml(
  html: string,
  posts: BlogPost[],
  locale: SupportedLocale,
): string {
  let out = injectBlogSectionCopy(html, locale)
  out = injectBlogCollection(out, posts, locale)
  out = out.replace(/<div class="w-dyn-empty">[\s\S]*?<\/div>/gi, '')
  return out
}
