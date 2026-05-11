/**
 * scopeCSS — Prefix every CSS selector with a scope attribute selector.
 *
 * The user writes CSS with normal selectors, e.g.:
 *   h1 { color: red; }
 *   button.cta { border-radius: 8px; }
 *   section { background: #f0f0f0; }
 *
 * This function transforms it to:
 *   [data-block-id="xxx"] h1 { color: red; }
 *   [data-block-id="xxx"] button.cta { border-radius: 8px; }
 *   [data-block-id="xxx"] section { background: #f0f0f0; }
 *
 * Supports:
 *  - Regular rules (selector { properties })
 *  - @media queries (inner rules are scoped)
 *  - @supports (inner rules are scoped)
 *  - Comma-separated selectors
 *
 * Does NOT support:
 *  - @keyframes (name selectors would be wrongly prefixed — they are passed through as-is)
 *  - Deeply nested CSS (beyond one @rule level)
 */

export function scopeCSS(rawCSS: string, scopeSelector: string): string {
  if (!rawCSS || !rawCSS.trim()) return ''

  // Strip block comments
  const css = rawCSS.replace(/\/\*[\s\S]*?\*\//g, '')

  const output: string[] = []

  // Tokenise: walk char-by-char tracking brace depth
  let i = 0
  let buffer = ''
  let depth = 0
  let insideAtRule = false
  let atRuleHeader = ''

  function flushRule(selector: string, body: string) {
    const sel = selector.trim()
    if (!sel) return
    // Comma-split, prefix each, rejoin
    const prefixed = sel
      .split(',')
      .map(s => `${scopeSelector} ${s.trim()}`)
      .join(',\n')
    output.push(`${prefixed} {\n${body.trimEnd()}\n}`)
  }

  while (i < css.length) {
    const ch = css[i]

    if (ch === '{') {
      depth++

      if (depth === 1) {
        const tok = buffer.trim()
        buffer = ''

        if (tok.startsWith('@keyframes') || tok.startsWith('@font-face')) {
          // Pass through verbatim — we don't scope keyframe names
          insideAtRule = false
          atRuleHeader = tok
          // Collect the whole block verbatim
          let inner = ''
          let d = 1
          i++
          while (i < css.length && d > 0) {
            if (css[i] === '{') d++
            else if (css[i] === '}') d--
            if (d > 0) inner += css[i]
            i++
          }
          output.push(`${tok} {\n${inner}\n}`)
          depth = 0
          continue
        } else if (tok.startsWith('@')) {
          // @media, @supports etc — scope inner rules
          insideAtRule = true
          atRuleHeader = tok
        } else {
          // Regular rule selector
          insideAtRule = false
          atRuleHeader = ''
          // Collect body (one level deep)
          let body = ''
          let d = 1
          i++
          while (i < css.length && d > 0) {
            if (css[i] === '{') d++
            else if (css[i] === '}') d--
            if (d > 0) body += css[i]
            i++
          }
          flushRule(tok, body)
          depth = 0
          continue
        }
      } else if (depth === 2 && insideAtRule) {
        // Inside @media — this is an inner rule's selector
        const selector = buffer.trim()
        buffer = ''
        // Collect inner rule body
        let body = ''
        let d = 1
        i++
        while (i < css.length && d > 0) {
          if (css[i] === '{') d++
          else if (css[i] === '}') d--
          if (d > 0) body += css[i]
          i++
        }
        // We'll store these for when the @rule closes
        const prefixed = selector
          .split(',')
          .map(s => `${scopeSelector} ${s.trim()}`)
          .join(',\n')
        // Push under the current @rule buffer (via atRuleContent)
        buffer += `${prefixed} {\n${body.trimEnd()}\n}\n`
        depth-- // back to depth=1
        continue
      }
    } else if (ch === '}') {
      if (depth === 1 && insideAtRule) {
        // Close the @rule
        output.push(`${atRuleHeader} {\n${buffer}\n}`)
        buffer = ''
        atRuleHeader = ''
        insideAtRule = false
        depth = 0
        i++
        continue
      }
      depth = Math.max(0, depth - 1)
    } else {
      buffer += ch
    }

    i++
  }

  return output.join('\n\n')
}
