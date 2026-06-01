'use client'

/**
 * PrintMenuPreview — live paper preview + print popup.
 */

import { useRef, useState } from 'react'
import { Printer, Minus, Plus, Search } from 'lucide-react'
import type { MenuCategory, MenuItem } from '@/app/actions/menu'
import { getFontStack, getGoogleFontLinkTag } from '@/lib/fonts'
import { useTranslation } from '@/i18n/I18nProvider'
import { safeToPng } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PrintSettings {
  // Layout
  columns: 1 | 2
  paper: 'a4' | 'a5'

  // Content visibility
  show_images: boolean
  show_prices: boolean
  show_description: boolean
  show_category_dividers: boolean
  show_header: boolean

  // Editable heading
  heading_text: string      // editable — defaults to business.name
  heading_subtext: string   // optional tagline

  // Style
  accent_color: string
  heading_font: string
  body_font: string

  // Background design
  page_bg_color: string
  page_bg_image: string | null       // base64 data URL
  page_bg_overlay_color: string      // overlay tint color (e.g. #000000)
  page_bg_overlay_opacity: number    // 0–85%
  header_text_color: string
  body_text_color: string
  item_card_bg: string
  item_card_radius: number
  selectedCategories: string[]
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  columns: 2,
  paper: 'a4',
  show_images: true,
  show_prices: true,
  show_description: true,
  show_category_dividers: true,
  show_header: true,
  heading_text: '',
  heading_subtext: '',
  accent_color: '#111111',
  heading_font: 'Playfair Display',
  body_font: 'Inter',
  page_bg_color: '#ffffff',
  page_bg_image: null,
  page_bg_overlay_color: '#000000',
  page_bg_overlay_opacity: 0,
  header_text_color: '#111111',
  body_text_color: '#111111',
  item_card_bg: 'transparent',
  item_card_radius: 0,
  selectedCategories: [],
}

// Paper dimensions in px at 96 dpi (used for the in-browser preview)
export const PAPER_PX = {
  a4: { w: 794, h: 1123, label: 'A4', marginY: 40, marginX: 48 },
  a5: { w: 559, h: 794,  label: 'A5', marginY: 32, marginX: 36 },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number | null) {
  if (price == null) return ''
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

// ─── Single menu item ─────────────────────────────────────────────────────────

function MenuCard({ item, settings }: { item: MenuItem; settings: PrintSettings }) {
  const hasCard = settings.item_card_bg !== 'transparent'
  return (
    <div style={{
      display: 'flex',
      gap: 10,
      padding: hasCard ? '10px' : '9px 0',
      borderBottom: hasCard ? 'none' : `1px solid ${settings.body_text_color}22`,
      marginBottom: hasCard ? 8 : 0,
      background: hasCard ? settings.item_card_bg : 'transparent',
      borderRadius: hasCard ? settings.item_card_radius : 0,
      breakInside: 'avoid',
      pageBreakInside: 'avoid',
    }}>
      {settings.show_images && item.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt={item.name}
          style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
          <p style={{ fontWeight: 600, fontSize: 13, margin: 0, lineHeight: 1.3, color: settings.body_text_color }}>
            {item.name}
          </p>
          {settings.show_prices && item.price != null && (
            <p style={{ fontWeight: 700, fontSize: 13, margin: 0, color: settings.accent_color, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {formatPrice(item.price)}
            </p>
          )}
        </div>
        {settings.show_description && item.description && (
          <p style={{ fontSize: 11, color: settings.body_text_color + '99', margin: '3px 0 0', lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as never }}>
            {item.description}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Content (shared between preview div and printed HTML) ────────────────────

interface MenuContentProps {
  business: { name: string; logo_url?: string | null }
  categories: MenuCategory[]
  items: MenuItem[]
  settings: PrintSettings
  onSave?: () => void
  isSaving?: boolean
}

export function MenuContent({ business, categories, items, settings }: MenuContentProps) {
  const headingFontStack = getFontStack(settings.heading_font)
  const bodyFontStack = getFontStack(settings.body_font)
  const headingText = settings.heading_text.trim() || business.name

  return (
    <div style={{ fontFamily: bodyFontStack, color: settings.body_text_color }}>
      {/* Header */}
      {settings.show_header && (
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          {business.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logo_url} alt="" style={{ height: 48, objectFit: 'contain', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
          )}
          <h1 style={{ fontFamily: headingFontStack, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: settings.header_text_color, margin: 0 }}>
            {headingText}
          </h1>
          {settings.heading_subtext && (
            <p style={{ fontSize: 13, color: settings.header_text_color + 'aa', margin: '4px 0 0', fontStyle: 'italic' }}>
              {settings.heading_subtext}
            </p>
          )}
          <div style={{ height: 1, background: settings.accent_color, marginTop: 12, opacity: 0.5 }} />
        </div>
      )}

      {/* Multi-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${settings.columns}, 1fr)`, gap: '0 24px', alignItems: 'start' }}>
        {settings.selectedCategories.map(catId => {
          const cat = categories.find(c => c.id === catId)
          if (!cat) return null
          const catItems = items.filter(i => i.category_id === cat.id)
          if (catItems.length === 0) return null
          return (
            <div key={cat.id} style={{ marginBottom: 20 }}>
              {settings.show_category_dividers && (
                <div style={{
                  breakInside: 'avoid', pageBreakInside: 'avoid',
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: settings.accent_color, borderBottom: `1px solid ${settings.accent_color}80`,
                  paddingBottom: 4, marginBottom: 8,
                }}>
                  {cat.name}
                </div>
              )}
              {catItems.map(item => (
                <MenuCard key={item.id} item={item} settings={settings} />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main preview + print ─────────────────────────────────────────────────────

export function PrintMenuPreview({ business, categories, items, settings, onSave, isSaving }: MenuContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const { t } = useTranslation()
  const paper = PAPER_PX[settings.paper]

  // Build background CSS for paper
  const pageBg = settings.page_bg_image
    ? `url(${settings.page_bg_image}) center/cover no-repeat`
    : settings.page_bg_color

  const fontLink = getGoogleFontLinkTag([settings.heading_font, settings.body_font])
  const headingFontStack = getFontStack(settings.heading_font)
  const bodyFontStack = getFontStack(settings.body_font)

  // Calculations for CSS column pagination
  const contentW = paper.w - paper.marginX * 2
  const contentH = paper.h - paper.marginY * 2
  const pageGap = 24
  const columnGap = paper.marginX * 2 + pageGap
  const [pagesCount, setPagesCount] = useState(1)

  // Auto-measure pages count for preview
  import('react').then(({ useEffect }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (!contentRef.current) return
      const observer = new ResizeObserver(() => {
        if (!contentRef.current) return
        const scrollWidth = contentRef.current.scrollWidth
        const count = Math.round((scrollWidth + columnGap) / (contentW + columnGap))
        setPagesCount(Math.max(1, count))
      })
      observer.observe(contentRef.current)
      return () => observer.disconnect()
    }, [paper.w, columnGap, contentW])
  })

  function handlePrint() {
    if (!contentRef.current) return

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const win = iframe.contentWindow
    if (!win) return

    const bgCss = settings.page_bg_image
      ? `background: url(${settings.page_bg_image}) center/cover no-repeat; -webkit-print-color-adjust: exact; print-color-adjust: exact;`
      : `background: ${settings.page_bg_color};`

    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>${settings.heading_text || business.name} — Menu</title>
      ${fontLink}
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        html, body { height: 100%; }
        body { font-family: ${bodyFontStack}; color: ${settings.body_text_color}; ${bgCss} -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        h1 { font-family: ${headingFontStack}; }
        @page { size: ${settings.paper.toUpperCase()}; margin: 14mm; }
        .content { max-width: 100%; }
        .grid { display: grid; grid-template-columns: repeat(${settings.columns}, 1fr); gap: 0 24px; align-items: start; }
        .cat-block { break-inside: avoid-column; page-break-inside: avoid; margin-bottom: 20px; }
        .cat-header { font-size: 10px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: ${settings.accent_color}; border-bottom: 1px solid ${settings.accent_color}80; padding-bottom: 4px; margin-bottom: 8px; }
        .item { display: flex; gap: 10px; padding: ${settings.item_card_bg !== 'transparent' ? '10px' : '9px 0'}; border-bottom: ${settings.item_card_bg !== 'transparent' ? 'none' : `1px solid ${settings.body_text_color}22`}; margin-bottom: ${settings.item_card_bg !== 'transparent' ? '8px' : '0'}; background: ${settings.item_card_bg}; border-radius: ${settings.item_card_bg !== 'transparent' ? settings.item_card_radius : 0}px; break-inside: avoid; }
        .item img { width:56px; height:56px; object-fit:cover; border-radius:6px; flex-shrink:0; }
        .item-body { flex:1; min-width:0; }
        .item-row { display:flex; justify-content:space-between; gap:8px; align-items:flex-start; }
        .item-name { font-weight:600; font-size:12px; line-height:1.3; color:${settings.body_text_color}; }
        .item-price { font-weight:700; font-size:12px; color:${settings.accent_color}; white-space:nowrap; flex-shrink:0; }
        .item-desc { font-size:10px; color:${settings.body_text_color}99; margin-top:2px; line-height:1.4; }
        .header { margin-bottom: 28px; text-align: center; }
        .header h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: ${settings.header_text_color}; }
        .header p { font-size: 13px; color: ${settings.header_text_color}aa; margin-top: 4px; font-style: italic; }
        .header-line { height: 1px; background: ${settings.accent_color}; margin-top: 12px; opacity: 0.5; }
        body::before { content:''; position:fixed; inset:0;
          background:${settings.page_bg_overlay_color};
          opacity:${(settings.page_bg_overlay_opacity / 100).toFixed(2)};
          pointer-events:none; z-index:0;
          -webkit-print-color-adjust:exact; print-color-adjust:exact; }
        body > * { position:relative; z-index:1; }
      </style>
    </head><body>
      <div class="content">${contentRef.current.innerHTML}</div>
    </body></html>`)
    win.document.close()

    setTimeout(() => {
      win.focus()
      win.print()
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 3000)
    }, 500)
  }

  async function handleDownloadPng() {
    if (!contentRef.current) return
    try {
      // Load fonts first
      const url = getGoogleFontLinkTag([settings.heading_font, settings.body_font])
      if (url) {
        const el = document.createElement('div')
        el.innerHTML = url
        const link = el.firstElementChild as HTMLLinkElement
        if (link && !document.querySelector(`link[href="${link.href}"]`)) {
          document.head.appendChild(link)
          await new Promise(r => setTimeout(r, 700))
        }
      }
      const paperEl = contentRef.current.parentElement!
      const dataUrl = await safeToPng(paperEl, { pixelRatio: 3, cacheBust: true })
      const a = document.createElement('a')
      a.download = `menu-${settings.paper}.png`
      a.href = dataUrl
      a.click()
    } catch (e) {
      console.error('PNG export failed', e)
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2 shrink-0">
        <div className="flex items-center gap-2">
          {onSave && (
            <button onClick={onSave} disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
              {isSaving ? t('printMenu.saved') : t('printMenu.saveChanges')}
            </button>
          )}
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors">
            <Printer className="size-4" />
            {t('printMenu.printPdf')}
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative min-h-0">
        {/* Scrollable paper preview */}
        <div className="absolute inset-0 overflow-auto bg-neutral-300 rounded-2xl p-6">
          <div className="mx-auto" style={{
            zoom: zoom,
            display: 'flex',
            gap: pageGap,
            width: 'max-content',
            position: 'relative'
          }}>
            {/* Page Backgrounds */}
            {Array.from({ length: pagesCount }).map((_, i) => (
              <div key={i} style={{
                width: paper.w,
                height: paper.h,
                background: pageBg,
                boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
                borderRadius: 4,
                flexShrink: 0,
                position: 'relative',
                overflow: 'hidden'
              }}>
                {settings.page_bg_overlay_opacity > 0 && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: settings.page_bg_overlay_color,
                    opacity: settings.page_bg_overlay_opacity / 100,
                  }} />
                )}
              </div>
            ))}

            {/* Content Container (flows across backgrounds using CSS columns) */}
            <div 
              ref={contentRef}
              style={{
                position: 'absolute',
                top: paper.marginY,
                left: paper.marginX,
                bottom: paper.marginY,
                height: contentH,
                columnWidth: contentW,
                columnGap: columnGap,
                columnFill: 'auto',
                zIndex: 1,
              }}
            >
              <MenuContent business={business} categories={categories} items={items} settings={settings} />
            </div>
          </div>
        </div>
        
        {/* Floating Zoom Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full border border-gray-200 shadow-xl p-1.5 z-20">
          <button 
            onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-gray-900"
            title="Zoom Out"
          >
            <Minus className="size-4" />
          </button>
          <div className="flex items-center justify-center w-14 gap-1 text-sm font-semibold text-gray-700">
            {Math.round(zoom * 100)}%
          </div>
          <button 
            onClick={() => setZoom(z => Math.min(2, z + 0.25))} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-gray-900"
            title="Zoom In"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
