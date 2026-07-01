import type { BlogPost } from '@/lib/blog'

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

function setMetaContent(html: string, attr: 'name' | 'property', key: string, value: string): string {
  if (!value) return html
  const escaped = escapeHtml(value)
  const primary = new RegExp(
    `<meta[^>]+${attr}=["']${key}["'][^>]+content=["'][^"']*["'][^>]*>`,
    'i',
  )
  const alt = new RegExp(
    `<meta[^>]+content=["'][^"']*["'][^>]+${attr}=["']${key}["'][^>]*>`,
    'i',
  )
  const replacement = `<meta ${attr}="${key}" content="${escaped}">`
  if (primary.test(html)) return html.replace(primary, replacement)
  if (alt.test(html)) return html.replace(alt, replacement)
  return html.replace(/<\/head>/i, `  ${replacement}\n</head>`)
}

function replaceFirst(
  html: string,
  pattern: RegExp,
  value: string,
  { raw = false }: { raw?: boolean } = {},
): string {
  const content = raw ? value : escapeHtml(value)
  return html.replace(pattern, (_match, open: string, _inner: string, close: string) => `${open}${content}${close}`)
}

function buildBlogCarouselItem(post: BlogPost): string {
  const pillLabel = post.category || post.date
  return `<div role="listitem" class="blog-slide swiper-slide w-dyn-item">
  <a href="/blog/${escapeHtml(post.slug)}" class="blog-item w-inline-block">
    <div class="blog_img${hideClass(!post.thumbnail)}">
      <img src="${escapeHtml(post.thumbnail)}" loading="lazy" alt="${escapeHtml(post.title)}" class="img">
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

const CAROUSEL_LIST_RE = /<div role="list" class="blog_list swiper-wrapper w-dyn-items">[\s\S]*?<\/div>/

export function injectBlogCarousel(html: string, posts: BlogPost[]): string {
  if (posts.length === 0) return html
  const items = posts.map(buildBlogCarouselItem).join('\n                    ')
  return html.replace(
    CAROUSEL_LIST_RE,
    `<div role="list" class="blog_list swiper-wrapper w-dyn-items">\n                    ${items}\n                  </div>`,
  )
}

function fillContentItem(html: string, label: string, value: string): string {
  const re = new RegExp(
    `(<div cms="content-item")([^>]*)(>\\s*<div class="text-base">${label}<\\/div>\\s*<div class="spacer-tiny"><\\/div>\\s*<div class="text-sm w-dyn-bind-empty">)([\\s\S]*?)(<\\/div>\\s*<\\/div>)`,
    'i',
  )
  return html.replace(re, (_match, open: string, attrs: string, middle: string, _old: string, close: string) => {
    const hide = !value ? ' hide' : ''
    const classAttr = attrs.includes('class=')
      ? attrs.replace(/class="([^"]*)"/, `class="$1${hide}"`)
      : `${attrs} class="${hide.trim()}"`
    return `${open}${classAttr}${middle}${value ? escapeHtml(value) : ''}${close}`
  })
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

export function renderBlogDetailHtml(html: string, post: BlogPost, relatedPosts: BlogPost[]): string {
  let out = html
  const pageTitle = `${post.title} | Eatery`

  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`)
  out = setMetaContent(out, 'name', 'description', post.summary)
  out = setMetaContent(out, 'property', 'og:title', pageTitle)
  out = setMetaContent(out, 'property', 'og:description', post.summary)
  out = setMetaContent(out, 'name', 'twitter:title', pageTitle)
  out = setMetaContent(out, 'name', 'twitter:description', post.summary)
  if (post.thumbnail) {
    out = setMetaContent(out, 'property', 'og:image', post.thumbnail)
    out = setMetaContent(out, 'name', 'twitter:image', post.thumbnail)
  }

  // Hero header: title + summary
  out = replaceFirst(
    out,
    /(<div cms="item" class="hero-cms_header">\s*<h1 class="h5 w-dyn-bind-empty">)([\s\S]*?)(<\/h1>)/,
    post.title,
  )
  out = out.replace(
    /(<div cms="item" class="hero-cms_header">[\s\S]*?<div class="text-color-secondary w-dyn-bind-empty)([^"]*)(">)([\s\S]*?)(<\/div>)/,
    (_m, open: string, classes: string, end: string, _inner: string, close: string) =>
      `${open}${classes}${post.summary ? '' : ' hide'}${end}${post.summary ? escapeHtml(post.summary) : ''}${close}`,
  )

  // Hero thumbnail
  if (post.thumbnail) {
    out = out.replace(
      /(<div cms="item" class="hero-cms_img"><img[^>]*class="[^"]*w-dyn-bind-empty[^"]*"[^>]*)/,
      `<div cms="item" class="hero-cms_img"><img src="${escapeHtml(post.thumbnail)}" loading="lazy" alt="${escapeHtml(post.title)}" class="img`,
    )
  } else {
    out = out.replace(/<div cms="item" class="hero-cms_img"/, `<div cms="item" class="hero-cms_img hide"`)
  }

  const heroPill = post.category || post.date
  out = replaceFirst(
    out,
    /(<div cms="item" class="hero-cms_img">[\s\S]*?<div class="hero-cms_date">\s*<div class="pill-item">\s*<div>)([\s\S]*?)(<\/div>)/,
    heroPill,
  )
  out = out.replace(
    /(<div cms="item" class="hero-cms_img">[\s\S]*?<div class="hero-cms_date)([^"]*)(")/,
    `$1${heroPill ? '$2' : '$2 hide'}$3`,
  )

  // Author block
  const hasAuthor = Boolean(post.author || post.avatar)
  out = out.replace(
    /<div class="hero-cms_author">/,
    `<div class="hero-cms_author${hideClass(!hasAuthor)}">`,
  )
  if (post.avatar) {
    out = out.replace(
      /(<div class="author-avatar"><img[^>]*class="[^"]*w-dyn-bind-empty[^"]*"[^>]*)/,
      `<div class="author-avatar"><img src="${escapeHtml(post.avatar)}" loading="lazy" alt="${escapeHtml(post.author || post.title)}" class="`,
    )
  } else {
    out = out.replace(/<div class="author-avatar">/, `<div class="author-avatar hide">`)
  }
  out = replaceFirst(
    out,
    /(<div class="hero-cms_author">[\s\S]*?<div>\s*<div class="w-dyn-bind-empty">)([\s\S]*?)(<\/div>)/,
    post.author,
  )
  out = out.replace(
    /(<div class="hero-cms_author">[\s\S]*?<div class="text-sm text-color-secondary w-dyn-bind-empty)([^"]*)(">)([\s\S]*?)(<\/div>)/,
    (_m, open: string, classes: string, end: string, _inner: string, close: string) =>
      `${open}${classes}${post.role ? '' : ' hide'}${end}${post.role ? escapeHtml(post.role) : ''}${close}`,
  )

  out = setSocialLinks(out, [post.socialFirst, post.socialSecond, post.socialThird])

  // Metadata row + body
  out = fillContentItem(out, 'Date', post.date)
  out = fillContentItem(out, 'Category', post.category)
  out = fillContentItem(out, 'Reading time', post.reading)

  out = out.replace(
    /(<div cms="content-item" class="text-rich-text w-dyn-bind-empty w-richtext">)([\s\S]*?)(<\/div>)/,
    `$1${post.body}$3`,
  )
  out = out.replace(
    /<div cms="content-item" class="text-rich-text w-dyn-bind-empty w-richtext/,
    `<div cms="content-item" class="text-rich-text w-richtext${hideClass(!post.body)}`,
  )

  // Related posts carousel (exclude current)
  const related = relatedPosts.filter((p) => p.slug !== post.slug)
  out = injectBlogCarousel(out, related)

  return out
}

export function renderMarketingIndexHtml(html: string, posts: BlogPost[]): string {
  return injectBlogCarousel(html, posts)
}
