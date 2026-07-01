'use client'

import { useEffect, useRef } from 'react'
import type { WebflowPageData, WebflowScript } from '@/lib/marketing-webflow'

function runInlineScripts(container: HTMLElement) {
  const scripts = container.querySelectorAll('script')
  scripts.forEach((oldScript) => {
    const script = document.createElement('script')
    for (const attr of Array.from(oldScript.attributes)) {
      script.setAttribute(attr.name, attr.value)
    }
    script.text = oldScript.textContent ?? ''
    oldScript.replaceWith(script)
  })
}

function appendScript(script: WebflowScript): Promise<void> {
  return new Promise((resolve) => {
    const el = document.createElement('script')
    Object.entries(script.attrs).forEach(([key, value]) => {
      if (key !== 'src') el.setAttribute(key, value)
    })
    if (script.src) {
      el.src = script.src
      el.onload = () => resolve()
      el.onerror = () => resolve()
      document.head.appendChild(el)
      return
    }
    el.text = script.content ?? ''
    document.head.appendChild(el)
    resolve()
  })
}

export function WebflowPage({ page }: { page: WebflowPageData }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.classList.add('w-mod-js')
    if ('ontouchstart' in window) {
      document.documentElement.classList.add('w-mod-touch')
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function boot() {
      for (const script of page.scripts) {
        if (cancelled) return
        await appendScript(script)
      }
      if (!cancelled && rootRef.current) {
        runInlineScripts(rootRef.current)
      }
    }

    boot()
    return () => {
      cancelled = true
    }
  }, [page])

  return (
    <div
      ref={rootRef}
      className="marketing-webflow"
      dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
    />
  )
}
