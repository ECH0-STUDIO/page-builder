#!/usr/bin/env node
/**
 * List Vietnamese text nodes in synced marketing HTML (for filling marketing-i18n-data.ts).
 * Run after: pnpm import:eatery-export
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const marketingDir = path.join(__dirname, '../apps/web/public/marketing')
const VI_CHAR_RE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i

const all = new Set()

for (const file of fs.readdirSync(marketingDir).filter((f) => f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(marketingDir, file), 'utf8')
  for (const m of html.matchAll(/>([^<]{2,240})</g)) {
    const t = m[1].replace(/&nbsp;/g, ' ').trim()
    if (t && VI_CHAR_RE.test(t)) all.add(t)
  }
}

console.log(`Found ${all.size} Vietnamese string(s):\n`)
for (const s of [...all].sort((a, b) => b.length - a.length)) {
  console.log(JSON.stringify(s))
}
