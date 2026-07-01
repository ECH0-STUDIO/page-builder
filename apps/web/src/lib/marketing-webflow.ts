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

const HTML_FILES: Record<string, string> = {
  index: 'index.html',
  home: 'index.html',
  'detail_blog': 'detail_blog.html',
  '404': '404.html',
  '401': '401.html',
}

export function getWebflowHtmlFile(slug: string): string | null {
  const file = HTML_FILES[slug] ?? `${slug}.html`
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

export function rewriteMarketingHtml(html: string): string {
  let out = html

  // Asset paths → /marketing/...
  out = out.replace(/((?:href|src)=["'])(?:\.\/)?css\//g, '$1/marketing/css/')
  out = out.replace(/((?:href|src)=["'])(?:\.\/)?js\//g, '$1/marketing/js/')
  out = out.replace(/((?:href|src)=["'])(?:\.\/)?images\//g, '$1/marketing/images/')

  // Internal page links
  out = out.replace(/href=["']index\.html(?:#[^"']*)?["']/gi, 'href="/"')
  out = out.replace(/href=["']([^"'#?]+\.html)(#[^"']*)?["']/gi, (_m, page: string, hash = '') => {
    const name = page.replace(/\.html$/i, '')
    if (name === 'index') return `href="/${hash}"`
    return `href="/${name}${hash}"`
  })

  // Webflow preview / external host anchor links → same-site anchors
  out = out.replace(/href=["']https?:\/\/[^/"']+\/(#[^"']+)["']/gi, 'href="/$1"')

  // Hide Temlis widget bundled in template exports
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

  // Head scripts (fonts, w-mod) run first; body scripts stay in DOM order for GSAP/Webflow
  const scripts = parseScripts(headHtml)

  return { title, description, bodyHtml, headHtml, scripts }
}
