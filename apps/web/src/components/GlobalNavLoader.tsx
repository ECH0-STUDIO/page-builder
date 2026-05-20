'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function GlobalNavLoader() {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Whenever the pathname or searchParams change, we know the navigation is complete.
    setIsLoading(false)
  }, [pathname, searchParams])

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLAnchorElement
      // Only intercept if it's a left click, no modifier keys, same origin, and doesn't have target="_blank"
      if (
        e.button === 0 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey &&
        target.origin === window.location.origin &&
        target.target !== '_blank'
      ) {
        // Only show loading if the path is actually different or we are navigating
        const currentUrl = pathname + window.location.search
        const targetUrl = target.pathname + target.search
        
        // Exclude hash links
        if (targetUrl === currentUrl && target.hash) return

        if (targetUrl !== currentUrl) {
          setIsLoading(true)
        }
      }
    }

    const attachListeners = () => {
      const links = document.querySelectorAll('a[href]')
      links.forEach((link) => {
        link.addEventListener('click', handleAnchorClick as EventListener)
      })
    }

    // Attach initially
    attachListeners()

    // Setup mutation observer to attach to dynamically added links
    const observer = new MutationObserver((mutations) => {
      let shouldReattach = false
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldReattach = true
          break
        }
      }
      if (shouldReattach) {
        attachListeners()
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      const links = document.querySelectorAll('a[href]')
      links.forEach((link) => {
        link.removeEventListener('click', handleAnchorClick as EventListener)
      })
      observer.disconnect()
    }
  }, [pathname])

  if (!isLoading) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="bg-black/90 text-white text-[13px] font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2 backdrop-blur-sm">
        <svg className="animate-spin size-3.5 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading...
      </div>
    </div>
  )
}
