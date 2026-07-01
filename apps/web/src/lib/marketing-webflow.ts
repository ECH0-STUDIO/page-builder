import fs from 'fs'
import path from 'path'

const MARKETING_PUBLIC = path.join(process.cwd(), 'public/marketing')

export type WebflowScript = {
  src?: string
  content?: string
  attrs: Record<string, string>
}

export type WebflowPageData = {
  title: string
  description: string
  bodyHtml: string
  headHtml: string
  scripts: WebflowScript[]
}

const RESERVED_SLUGS = new Set(['template', '401', '404'])

/** Slugs with a top-level .html file in public/marketing (e.g. features → features.html). */
export function listMarketingHtmlSlugs(): string[] {
  if (!fs.existsSync(MARKETING_PUBLIC)) return []
  return fs
    .readdirSync(MARKETING_PUBLIC)
    .filter((name) => name.endsWith('.html') && name !== 'index.html')
    .map((name) => name.replace(/\.html$/i, ''))
    .filter((slug) => !RESERVED_SLUGS.has(slug))
}

export function marketingPageExists(slug: string): boolean {
  if (slug === 'index' || slug === 'home') return fs.existsSync(path.join(MARKETING_PUBLIC, 'index.html'))
  return fs.existsSync(path.join(MARKETING_PUBLIC, `${slug}.html`))
}

export function getWebflowHtmlFile(slug: string): string | null {
  const file = slug === 'index' || slug === 'home' ? 'index.html' : `${slug}.html`
  const full = path.join(MARKETING_PUBLIC, file)
  if (!fs.existsSync(full)) return null
  return file
}

export function loadWebflowPage(slug: string): WebflowPageData | null {
  const file = getWebflowHtmlFile(slug)
  if (!file) return null
  const html = fs.readFileSync(path.join(MARKETING_PUBLIC, file), 'utf8')
  return parseWebflowHtml(html)
}

function encodeMarketingImagePath(imagePath: string): string {
  const clean = imagePath.replace(/^\.\/?images\//, '')
  return `/marketing/images/${clean.split('/').map(encodeURIComponent).join('/')}`
}

function rewriteSrcset(value: string): string {
  return value
    .split(',')
    .map((part) => {
      const trimmed = part.trim()
      const space = trimmed.indexOf(' ')
      const url = space === -1 ? trimmed : trimmed.slice(0, space)
      const descriptor = space === -1 ? '' : trimmed.slice(space + 1)
      if (url.startsWith('images/') || url.startsWith('./images/')) {
        const next = encodeMarketingImagePath(url)
        return descriptor ? `${next} ${descriptor}` : next
      }
      return part
    })
    .join(', ')
}

/** Webflow exports sometimes use hyphens where filenames contain spaces. */
function fixKnownImageFilenameTypos(html: string): string {
  return html.replace(/Frame-2147227617_1Frame-2147227617/g, 'Frame-2147227617_1Frame 2147227617')
}

export function rewriteMarketingHtml(html: string): string {
  let out = fixKnownImageFilenameTypos(html)
  const pageSlugs = new Set(listMarketingHtmlSlugs())

  // Asset paths → /marketing/...
  out = out.replace(/((?:href|src)=["'])(?:\.\/)?css\//g, '$1/marketing/css/')
  out = out.replace(/((?:href|src)=["'])(?:\.\/)?js\//g, '$1/marketing/js/')
  out = out.replace(
    /((?:href|src)=["'])(?:\.\/)?images\/([^"']+)["']/g,
    (_m, prefix: string, imgPath: string) => `${prefix}${encodeMarketingImagePath(imgPath)}"`,
  )
  out = out.replace(/srcset=["']([^"']+)["']/gi, (_m, value: string) => `srcset="${rewriteSrcset(value)}"`)

  // Internal page links: features.html → /features
  out = out.replace(/href=["']index\.html(?:#[^"']*)?["']/gi, 'href="/"')
  out = out.replace(/href=["']([^"'#?/][^"']*)\.html(#[^"']*)?["']/gi, (_m, page: string, hash = '') => {
    const slug = page.replace(/^\.\//, '').toLowerCase()
    if (slug === 'index') return `href="/${hash}"`
    return `href="/${slug}${hash}"`
  })

  // Webflow preview host: map section anchors to real routes when a page exists
  out = out.replace(
    /href=["']https?:\/\/[^/"']+\.webflow\.io\/#([a-z0-9-]+)["']/gi,
    (_m, section: string) => {
      if (pageSlugs.has(section)) return `href="/${section}"`
      return `href="/#${section}"`
    },
  )
  out = out.replace(
    /href=["']https?:\/\/[^/"']+\.webflow\.io\/([a-z0-9-]+)["']/gi,
    (_m, section: string) => `href="/${section}"`,
  )

  // Same-site hash links from other hosts (e.g. custom domain in export)
  out = out.replace(/href=["']https?:\/\/[^/"']+\/(#[^"']+)["']/gi, 'href="/$1"')

  // Remove empty Webflow CMS placeholder on homepage
  out = out.replace(/<div class="w-dyn-empty">\s*<div>No items found\.<\/div>\s*<\/div>/gi, '')

  // Remove Temlis widget bundled in template exports
  out = out.replace(/<div class="temlis_component">[\s\S]*?<\/div>\s*<\/div>\s*(?=<\/div>\s*<script)/i, '')

  return out
}

function extractMeta(html: string, name: string): string {
  const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i')
  const alt = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["']`, 'i')
  return html.match(re)?.[1] ?? html.match(alt)?.[1] ?? ''
}

function extractTag(html: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  return html.match(re)?.[1]?.trim() ?? ''
}

function parseScripts(html: string): WebflowScript[] {
  const scripts: WebflowScript[] = []
  const re = /<script([^>]*)>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    const attrsRaw = match[1]
    const content = match[2].trim()
    const attrs: Record<string, string> = {}
    const attrRe = /(\w[\w-]*)(?:=["']([^"']*)["'])?/g
    let attrMatch: RegExpExecArray | null
    while ((attrMatch = attrRe.exec(attrsRaw))) {
      attrs[attrMatch[1]] = attrMatch[2] ?? ''
    }
    scripts.push({
      src: attrs.src,
      content: content || undefined,
      attrs,
    })
  }
  return scripts
}

export function parseWebflowHtml(html: string): WebflowPageData {
  const rewritten = rewriteMarketingHtml(html)
  const title = extractTag(rewritten, 'title') || 'Eatery'
  const description = extractMeta(rewritten, 'description')

  const headMatch = rewritten.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
  const headHtml = headMatch?.[1] ?? ''

  const bodyMatch = rewritten.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const bodyHtml = bodyMatch?.[1] ?? rewritten

  const scripts = parseScripts(headHtml)

  return { title, description, bodyHtml, headHtml, scripts }
}
