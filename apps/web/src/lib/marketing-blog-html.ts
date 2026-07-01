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

function imgTag(src: string, alt: string, className = 'img'): string {
  return `<img src="${escapeHtml(src)}" loading="lazy" alt="${escapeHtml(alt)}" class="${className}">`
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

function buildBlogCard(post: BlogPost, itemClass: string): string {
  const pillLabel = post.category || post.date
  return `<div role="listitem" class="${itemClass}">
  <a href="/blog/${escapeHtml(post.slug)}" class="blog-item w-inline-block">
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

const CAROUSEL_LIST_RE = /<div role="list" class="blog_list swiper-wrapper w-dyn-items">[\s\S]*?<\/div>/

export function injectBlogCarousel(html: string, posts: BlogPost[]): string {
  if (posts.length === 0) {
    return html.replace(
      /<div role="list" class="blog_list swiper-wrapper w-dyn-items">[\s\S]*?<\/div>/,
      '<div role="list" class="blog_list swiper-wrapper w-dyn-items"></div>',
    )
  }
  const items = posts
    .map((post) => buildBlogCard(post, 'blog-slide swiper-slide w-dyn-item'))
    .join('\n                    ')
  return html.replace(
    CAROUSEL_LIST_RE,
    `<div role="list" class="blog_list swiper-wrapper w-dyn-items">\n                    ${items}\n                  </div>`,
  )
}

/** Inject posts into any Webflow CMS collection list that uses blog-item cards. */
export function injectBlogCollection(html: string, posts: BlogPost[]): string {
  if (html.includes('blog_list swiper-wrapper')) {
    return injectBlogCarousel(html, posts)
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

      const items = posts.map((post) => buildBlogCard(post, itemClass)).join('\n                    ')
      return `<div role="list" class="${listClass}">\n                    ${items}\n                  </div>`
    },
  )
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function fillContentItem(html: string, label: string, value: string): string {
  const labelRe = escapeRegExp(label)
  const blockRe = new RegExp(
    `<div cms="content-item"([^>]*)>\\s*<div class="text-base">${labelRe}<\\/div>\\s*<div class="spacer-tiny"><\\/div>\\s*<div class="text-sm w-dyn-bind-empty">[^<]*<\\/div>\\s*<\\/div>`,
    'i',
  )

  if (!value) {
    return html.replace(
      new RegExp(`(<div cms="content-item")([^>]*)(>\\s*<div class="text-base">${labelRe})`, 'i'),
      `$1$2 hide$3`,
    )
  }

  return html.replace(
    blockRe,
    `<div cms="content-item"$1><div class="text-base">${label}</div><div class="spacer-tiny"></div><div class="text-sm">${escapeHtml(value)}</div></div>`,
  )
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

  // Metadata row + body
  out = fillContentItem(out, 'Date', post.date)
  out = fillContentItem(out, 'Category', post.category)
  out = fillContentItem(out, 'Reading time', post.reading)

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
  out = injectBlogCarousel(out, related)

  return out
}

export function renderMarketingIndexHtml(html: string, posts: BlogPost[]): string {
  return injectBlogCarousel(html, posts)
}

export function renderBlogListHtml(html: string, posts: BlogPost[]): string {
  let out = injectBlogCollection(html, posts)
  out = out.replace(/<div class="w-dyn-empty">[\s\S]*?<\/div>/gi, '')
  return out
}
