'use client'

/**
 * NavbarRender — shared between editor canvas and live page.
 *
 * Fixes:
 *  - logo_type='none': links center-aligned
 *  - sticky: uses position:sticky top:0 z-[9999] — must NOT be inside overflow:hidden parent
 *  - anchor links: href uses block-{id} format, smooth scroll via CSS
 *  - burger menu collapses on mobile (≤640px)
 */

import { useState } from 'react'
import Image from 'next/image'
import type { NavbarConfig, NavLink } from '../types'
import { resolveNavHref, navLinkOpensNewTab } from '../nav-link-utils'
import { pickLocale, toSupportedLocale, type SupportedLocale } from '@/i18n/locale'

interface NavbarRenderProps {
  config: NavbarConfig
  businessName?: string
  logoUrl?: string
  /** If true (editor canvas) disable pointer events on links */
  inEditor?: boolean
  isMobilePreview?: boolean
  locale?: string
}

export function NavbarRender({ config, businessName = 'Brand', logoUrl, inEditor, isMobilePreview, locale }: NavbarRenderProps) {
  const activeLocale = toSupportedLocale(locale)
  const [open, setOpen] = useState(false)

  const isTransparent = config.background_color === 'transparent'
  const bg = isTransparent ? 'rgba(255,255,255,0.85)' : config.background_color
  const hasLinks = config.links && config.links.length > 0

  const containerStyle: React.CSSProperties = {
    // Sticky must be on the element itself. z-index high enough to sit above all page content.
    position: config.sticky ? 'sticky' : 'relative',
    top: 0,
    zIndex: 9999,
    backgroundColor: bg,
    backdropFilter: isTransparent ? 'blur(12px)' : undefined,
    WebkitBackdropFilter: isTransparent ? 'blur(12px)' : undefined,
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    // Ensure sticky works even inside overflow:auto containers
    willChange: 'transform',
  }

  const linkStyle: React.CSSProperties = {
    color: config.text_color,
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    letterSpacing: '-0.01em',
    transition: 'opacity 0.15s',
    pointerEvents: inEditor ? 'none' : 'auto',
  }

  function handleLinkClick(href: string) {
    if (inEditor) return
    const el = document.getElementById(href)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (href.startsWith('block-')) {
      const fallback = document.getElementById(href)
      fallback?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  function getHref(link: { href: string; anchor: boolean }) {
    return resolveNavHref(link)
  }

  function linkTarget(link: NavLink) {
    return navLinkOpensNewTab(link) ? '_blank' : undefined
  }

  return (
    <nav style={containerStyle} id="page-navbar">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        {/* Main bar */}
        <div style={{
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: hasLinks ? 'space-between' : 'center',
          gap: '24px',
        }}>

          {/* Logo / brand */}
          <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (!inEditor) {
                  window.location.reload()
                }
              }}
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', cursor: inEditor ? 'default' : 'pointer' }}
            >
              {config.logo_type === 'logo_image' && logoUrl ? (
                <div style={{ position: 'relative', height: '36px', width: '120px' }}>
                  <Image src={logoUrl} alt={businessName} fill style={{ objectFit: 'contain', objectPosition: hasLinks ? 'left center' : 'center' }} sizes="120px" />
                </div>
              ) : (
                <span style={{ fontWeight: 800, fontSize: '18px', color: config.text_color, letterSpacing: '-0.02em' }}>
                  {businessName}
                </span>
              )}
            </a>
          </div>

          {/* Desktop links */}
          {hasLinks && (
            <div
              className="nav-desktop-links"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '28px',
                marginLeft: 'auto',
              }}
            >
            {config.links.map((link, i) => (
              <a
                key={i}
                href={getHref(link)}
                target={linkTarget(link)}
                rel={navLinkOpensNewTab(link) ? 'noopener noreferrer' : undefined}
                style={{ ...linkStyle, opacity: 0.85 }}
                onClick={e => {
                  if (link.anchor && !inEditor) {
                    e.preventDefault()
                    handleLinkClick(link.href)
                  }
                }}
                onMouseEnter={e => !inEditor && (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => !inEditor && (e.currentTarget.style.opacity = '0.85')}
              >
                {pickLocale(link.label, activeLocale)}
              </a>
            ))}
          </div>
          )}

          {/* Burger button — mobile only via CSS */}
          {hasLinks && (
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              aria-label="Toggle navigation menu"
              className="nav-burger-btn"
              style={{
                color: config.text_color,
                background: 'none',
                border: 'none',
                cursor: inEditor ? 'default' : 'pointer',
                padding: '4px',
                display: 'none',
                pointerEvents: inEditor ? 'none' : 'auto',
              }}
            >
              {open ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Mobile dropdown */}
        {open && config.links.length > 0 && (
          <div
            className="nav-mobile-panel"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: bg,
              backdropFilter: isTransparent ? 'blur(12px)' : undefined,
              WebkitBackdropFilter: isTransparent ? 'blur(12px)' : undefined,
              borderTop: '1px solid rgba(0,0,0,0.06)',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              padding: '0 24px 12px 24px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
              display: 'none', // overridden by responsive CSS below
            }}
          >
            {config.links.map((link, i) => (
              <a
                key={i}
                href={getHref(link)}
                target={linkTarget(link)}
                rel={navLinkOpensNewTab(link) ? 'noopener noreferrer' : undefined}
                onClick={e => {
                  if (link.anchor && !inEditor) {
                    e.preventDefault()
                    handleLinkClick(link.href)
                  }
                  setOpen(false)
                }}
                style={{
                  ...linkStyle,
                  display: 'block',
                  padding: '12px 0',
                  opacity: 1,
                  borderBottom: i < config.links.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                }}
              >
                {pickLocale(link.label, activeLocale)}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 640px) {
          .nav-desktop-links { display: none !important; }
          .nav-burger-btn    { display: flex !important; }
          .nav-mobile-panel  { display: block !important; }
        }
        ${isMobilePreview ? `
          .nav-desktop-links { display: none !important; }
          .nav-burger-btn    { display: flex !important; }
          .nav-mobile-panel  { display: block !important; }
        ` : ''}
      `}</style>
    </nav>
  )
}
