/**
 * When Webflow export has no blog.html, build one from index.html (blog section only).
 */

import fs from 'fs'
import path from 'path'

export function ensureBlogHtml(exportDir) {
  const blogPath = path.join(exportDir, 'blog.html')
  if (fs.existsSync(blogPath)) return false

  const indexPath = path.join(exportDir, 'index.html')
  if (!fs.existsSync(indexPath)) {
    console.warn('Cannot generate blog.html: index.html is missing')
    return false
  }

  let html = fs.readFileSync(indexPath, 'utf8')

  html = html.replace(
    /<main class="main-wrapper">\s*<section class="section_hero">[\s\S]*?(?=<section id="blog")/,
    '<main class="main-wrapper">\n      <div class="padding-section-medium"></div>\n      ',
  )

  html = html.replace(/href="[^"]*#blog"/gi, 'href="/blog"')

  fs.writeFileSync(blogPath, html)
  console.log(
    'Generated design/webflow-export/blog.html from index.html (replace with your Webflow blog.html when ready)',
  )
  return true
}
