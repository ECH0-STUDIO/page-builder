'use client'

/**
 * PrintMenuPreview — live paper preview + print popup.
 */

import { useRef, useState, useEffect } from 'react'
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

type LayoutItem = { type: 'cat-header'; id: string } | { type: 'item'; id: string }
type LayoutColumn = { items: LayoutItem[] }
type LayoutPage = { columns: LayoutColumn[] }

export function PrintMenuPreview({ business, categories, items, settings, onSave, isSaving }: MenuContentProps) {
  const [zoom, setZoom] = useState(1)
  const { t } = useTranslation()
  const paper = PAPER_PX[settings.paper]

  const pageBg = settings.page_bg_image
    ? `url(${settings.page_bg_image}) center/cover no-repeat`
    : settings.page_bg_color

  const fontLink = getGoogleFontLinkTag([settings.heading_font, settings.body_font])
  const headingFontStack = getFontStack(settings.heading_font)
  const bodyFontStack = getFontStack(settings.body_font)

  // Layout parameters
  const contentW = paper.w - paper.marginX * 2
  const contentH = paper.h - paper.marginY * 2
  const columnGap = 24
  const columnW = settings.columns === 1 
    ? contentW 
    : (contentW - columnGap) / 2

  // Layout Engine State
  const [layoutPages, setLayoutPages] = useState<LayoutPage[]>([])
  const [isMeasuring, setIsMeasuring] = useState(true)

  // Refs for measurement
  const measureContainerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!measureContainerRef.current) return
    const container = measureContainerRef.current
    
    // Read heights
    const mainHeaderEl = container.querySelector('[data-measure="main-header"]') as HTMLElement
    const mainHeaderH = mainHeaderEl ? mainHeaderEl.offsetHeight + 28 : 0 // 28 is the marginBottom in MenuContent

    const heights = new Map<string, number>()
    const elements = container.querySelectorAll('[data-measure-id]')
    elements.forEach(el => {
      const id = el.getAttribute('data-measure-id')!
      heights.set(id, (el as HTMLElement).offsetHeight)
    })

    // Packing algorithm
    const pages: LayoutPage[] = []
    let currentColumnIndex = 0
    let currentPageIndex = 0
    let currentHeight = 0
    let availableHeight = contentH - (settings.show_header ? mainHeaderH : 0)

    const advanceColumn = () => {
      currentColumnIndex++
      if (currentColumnIndex >= settings.columns) {
        currentColumnIndex = 0
        currentPageIndex++
        availableHeight = contentH
      }
      currentHeight = 0
    }

    const ensureCurrentColumn = () => {
      if (!pages[currentPageIndex]) pages[currentPageIndex] = { columns: [] }
      if (!pages[currentPageIndex].columns[currentColumnIndex]) {
        pages[currentPageIndex].columns[currentColumnIndex] = { items: [] }
      }
    }

    for (const catId of settings.selectedCategories) {
      const cat = categories.find(c => c.id === catId)
      if (!cat) continue
      const catItems = items.filter(i => i.category_id === cat.id)
      if (catItems.length === 0) continue

      const catHeaderId = `cat-${cat.id}`
      const firstItemId = `item-${catItems[0].id}`
      const headerH = settings.show_category_dividers ? (heights.get(catHeaderId) || 0) + 20 : 0 // +20 for bottom margin
      const firstItemH = heights.get(firstItemId) || 0

      ensureCurrentColumn()
      
      // Orphan control: Header + first item must fit, or advance column
      if (currentHeight > 0 && currentHeight + headerH + firstItemH > availableHeight) {
        advanceColumn()
        ensureCurrentColumn()
      }

      if (settings.show_category_dividers) {
        pages[currentPageIndex].columns[currentColumnIndex].items.push({ type: 'cat-header', id: cat.id })
        currentHeight += headerH
      }

      for (const item of catItems) {
        const itemId = `item-${item.id}`
        const itemH = heights.get(itemId) || 0

        if (currentHeight > 0 && currentHeight + itemH > availableHeight) {
          advanceColumn()
          ensureCurrentColumn()
        }

        pages[currentPageIndex].columns[currentColumnIndex].items.push({ type: 'item', id: item.id })
        currentHeight += itemH
      }
    }

    if (pages.length === 0) {
      pages.push({ columns: [{ items: [] }] })
    }

    setLayoutPages(pages)
    setIsMeasuring(false)
  }, [settings, categories, items, contentH])


  function handlePrint() {
    if (isMeasuring || layoutPages.length === 0) return

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

    // Generate HTML for each page
    const pagesHtml = layoutPages.map((page, pageIdx) => {
      const isFirstPage = pageIdx === 0
      
      const columnsHtml = page.columns.map(col => {
        const colItemsHtml = col.items.map(layoutItem => {
          if (layoutItem.type === 'cat-header') {
            const cat = categories.find(c => c.id === layoutItem.id)!
            return `<div class="cat-header">${cat.name}</div>`
          } else {
            const item = items.find(i => i.id === layoutItem.id)!
            return `
              <div class="item">
                ${settings.show_images && item.image_url ? `<img src="${item.image_url}" alt="">` : ''}
                <div class="item-body">
                  <div class="item-row">
                    <p class="item-name">${item.name}</p>
                    ${settings.show_prices && item.price != null ? `<p class="item-price">${formatPrice(item.price)}</p>` : ''}
                  </div>
                  ${settings.show_description && item.description ? `<p class="item-desc">${item.description}</p>` : ''}
                </div>
              </div>`
          }
        }).join('')
        return `<div class="column">${colItemsHtml}</div>`
      }).join('')

      const headerHtml = (isFirstPage && settings.show_header) ? `
        <div class="header">
          ${business.logo_url ? `<img src="${business.logo_url}" alt="">` : ''}
          <h1>${settings.heading_text.trim() || business.name}</h1>
          ${settings.heading_subtext ? `<p>${settings.heading_subtext}</p>` : ''}
          <div class="header-line"></div>
        </div>
      ` : ''

      return `
        <div class="page">
          ${headerHtml}
          <div class="columns-grid">${columnsHtml}</div>
        </div>
      `
    }).join('')

    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>${settings.heading_text || business.name} — Menu</title>
      ${fontLink}
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        html, body { height: 100%; }
        body { font-family: ${bodyFontStack}; color: ${settings.body_text_color}; ${bgCss} -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        h1 { font-family: ${headingFontStack}; }
        @page { size: ${settings.paper.toUpperCase()}; margin: 0; }
        
        .page { 
          width: ${paper.w}px; 
          height: ${paper.h}px; 
          padding: ${paper.marginY}px ${paper.marginX}px;
          page-break-after: always;
          position: relative;
          overflow: hidden;
        }
        
        .columns-grid { display: grid; grid-template-columns: repeat(${settings.columns}, 1fr); gap: 0 ${columnGap}px; align-items: start; }
        .column { display: flex; flex-direction: column; }
        
        .cat-header { font-size: 10px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: ${settings.accent_color}; border-bottom: 1px solid ${settings.accent_color}80; padding-bottom: 4px; margin-bottom: 20px; margin-top: 8px; }
        
        .item { display: flex; gap: 10px; padding: ${settings.item_card_bg !== 'transparent' ? '10px' : '9px 0'}; border-bottom: ${settings.item_card_bg !== 'transparent' ? 'none' : `1px solid ${settings.body_text_color}22`}; margin-bottom: ${settings.item_card_bg !== 'transparent' ? '8px' : '0'}; background: ${settings.item_card_bg}; border-radius: ${settings.item_card_bg !== 'transparent' ? settings.item_card_radius : 0}px; }
        .item img { width:56px; height:56px; object-fit:cover; border-radius:6px; flex-shrink:0; }
        .item-body { flex:1; min-width:0; }
        .item-row { display:flex; justify-content:space-between; gap:8px; align-items:flex-start; }
        .item-name { font-weight:600; font-size:13px; line-height:1.3; color:${settings.body_text_color}; margin: 0; }
        .item-price { font-weight:700; font-size:13px; color:${settings.accent_color}; white-space:nowrap; flex-shrink:0; margin: 0; }
        .item-desc { font-size:11px; color:${settings.body_text_color}99; margin: 3px 0 0; line-height:1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        
        .header { margin-bottom: 28px; text-align: center; }
        .header img { height: 48px; object-fit: contain; margin-bottom: 8px; display: block; margin: 0 auto 8px; }
        .header h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: ${settings.header_text_color}; margin: 0; }
        .header p { font-size: 13px; color: ${settings.header_text_color}aa; margin: 4px 0 0; font-style: italic; }
        .header-line { height: 1px; background: ${settings.accent_color}; margin-top: 12px; opacity: 0.5; }
        
        body::before { content:''; position:fixed; inset:0;
          background:${settings.page_bg_overlay_color};
          opacity:${(settings.page_bg_overlay_opacity / 100).toFixed(2)};
          pointer-events:none; z-index:0;
          -webkit-print-color-adjust:exact; print-color-adjust:exact; }
        body > * { position:relative; z-index:1; }
      </style>
    </head><body>
      ${pagesHtml}
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

  const headingText = settings.heading_text.trim() || business.name

  return (
    <div className="flex flex-col gap-4 h-full" style={{ fontFamily: bodyFontStack, color: settings.body_text_color }}>
      
      {/* Hidden Measurement Layer */}
      <div 
        ref={measureContainerRef}
        style={{ 
          position: 'absolute', top: -9999, left: -9999, visibility: 'hidden', pointerEvents: 'none',
          width: columnW // ensure elements wrap exactly as they would in a single column
        }}
      >
        {/* Measure Header */}
        <div data-measure="main-header" style={{ width: contentW, textAlign: 'center' }}>
          {business.logo_url && <img src={business.logo_url} alt="" style={{ height: 48, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />}
          <h1 style={{ fontFamily: headingFontStack, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            {headingText}
          </h1>
          {settings.heading_subtext && <p style={{ fontSize: 13, margin: '4px 0 0' }}>{settings.heading_subtext}</p>}
          <div style={{ height: 1, marginTop: 12 }} />
        </div>

        {/* Measure Categories & Items */}
        {settings.selectedCategories.map(catId => {
          const cat = categories.find(c => c.id === catId)
          if (!cat) return null
          const catItems = items.filter(i => i.category_id === cat.id)
          if (catItems.length === 0) return null

          return (
            <div key={cat.id}>
              {settings.show_category_dividers && (
                <div data-measure-id={`cat-${cat.id}`} style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
                  paddingBottom: 4, marginBottom: 8, marginTop: 8
                }}>
                  {cat.name}
                </div>
              )}
              {catItems.map(item => (
                <div data-measure-id={`item-${item.id}`} key={item.id}>
                  <MenuCard item={item} settings={settings} />
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2 shrink-0">
        <div className="flex items-center gap-2">
          {onSave && (
            <button onClick={onSave} disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
              {isSaving ? t('printMenu.saved') : t('printMenu.saveChanges')}
            </button>
          )}
          <button onClick={handlePrint} disabled={isMeasuring}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">
            <Printer className="size-4" />
            {t('printMenu.printPdf')}
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative min-h-0">
        <div className="absolute inset-0 overflow-auto bg-neutral-300 rounded-2xl p-6">
          <div className="mx-auto" style={{
            zoom: zoom,
            display: 'flex',
            gap: 24,
            width: 'max-content',
            position: 'relative'
          }}>
            {layoutPages.map((page, pageIdx) => {
              const isFirstPage = pageIdx === 0
              return (
                <div key={pageIdx} style={{
                  width: paper.w,
                  height: paper.h,
                  background: pageBg,
                  boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
                  borderRadius: 4,
                  flexShrink: 0,
                  position: 'relative',
                  overflow: 'hidden',
                  padding: `${paper.marginY}px ${paper.marginX}px`
                }}>
                  {/* Overlay */}
                  {settings.page_bg_overlay_opacity > 0 && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: settings.page_bg_overlay_color,
                      opacity: settings.page_bg_overlay_opacity / 100,
                      pointerEvents: 'none',
                      zIndex: 0
                    }} />
                  )}

                  {/* Page Content */}
                  <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {isFirstPage && settings.show_header && (
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

                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${settings.columns}, 1fr)`, gap: `0 ${columnGap}px`, alignItems: 'start' }}>
                      {page.columns.map((col, colIdx) => (
                        <div key={colIdx} style={{ display: 'flex', flexDirection: 'column' }}>
                          {col.items.map((layoutItem, itemIdx) => {
                            if (layoutItem.type === 'cat-header') {
                              const cat = categories.find(c => c.id === layoutItem.id)!
                              return (
                                <div key={`cat-${cat.id}-${itemIdx}`} style={{
                                  fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
                                  color: settings.accent_color, borderBottom: `1px solid ${settings.accent_color}80`,
                                  paddingBottom: 4, marginBottom: 20, marginTop: 8
                                }}>
                                  {cat.name}
                                </div>
                              )
                            } else {
                              const item = items.find(i => i.id === layoutItem.id)!
                              return (
                                <MenuCard key={`item-${item.id}-${itemIdx}`} item={item} settings={settings} />
                              )
                            }
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
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

