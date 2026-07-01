'use client'

import { useEffect } from 'react'
import type { WebflowPageData, WebflowScript } from '@/lib/marketing-webflow'

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
      document.body.appendChild(el)
      return
    }
    el.text = script.content ?? ''
    document.head.appendChild(el)
    resolve()
  })
}

function appendScriptElement(oldScript: HTMLScriptElement): Promise<void> {
  return new Promise((resolve) => {
    const script = document.createElement('script')
    for (const attr of Array.from(oldScript.attributes)) {
      script.setAttribute(attr.name, attr.value)
    }
    if (oldScript.src) {
      script.onload = () => resolve()
      script.onerror = () => resolve()
      script.src = oldScript.src
      oldScript.replaceWith(script)
      return
    }
    script.text = oldScript.textContent ?? ''
    oldScript.replaceWith(script)
    resolve()
  })
}

async function bootBodyScripts(root: HTMLElement) {
  const scripts = Array.from(root.querySelectorAll('script'))

  for (const oldScript of scripts) {
    if (!oldScript.src) continue
    await appendScriptElement(oldScript)
  }

  for (const oldScript of Array.from(root.querySelectorAll('script'))) {
    if (oldScript.src) continue
    await appendScriptElement(oldScript)
  }
}

export function WebflowScriptBoot({ page }: { page: WebflowPageData }) {
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
      if (cancelled) return

      const root = document.querySelector('.marketing-webflow')
      if (root instanceof HTMLElement) {
        await bootBodyScripts(root)
      }
    }

    boot()
    return () => {
      cancelled = true
    }
  }, [page])

  return null
}
