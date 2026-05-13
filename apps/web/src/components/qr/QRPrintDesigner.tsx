'use client'

/**
 * QRPrintDesigner — visual designer for print-ready QR table stands.
 * Split layout: live card preview (left) + controls panel (right).
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import { Download, Printer, ImageIcon, Upload, Trash2, RefreshCw } from 'lucide-react'
import { QRCardPreview, DEFAULT_DESIGN, SIZE_PRESETS } from './QRCardPreview'
import type { QRDesign, QRStyle, SizePreset } from './QRCardPreview'
import { FontPicker } from '@/components/shared/FontPicker'
import { getGoogleFontLinkTag } from '@/lib/fonts'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'

// ─── Constants ────────────────────────────────────────────────────────────────

const QR_STYLES: { value: QRStyle; label: string; icon: string }[] = [
  { value: 'square',        label: 'Classic',  icon: '▪' },
  { value: 'rounded',       label: 'Rounded',  icon: '▫' },
  { value: 'dots',          label: 'Dots',     icon: '•' },
  { value: 'extra-rounded', label: 'Smooth',   icon: '◉' },
]

const BG_DIRECTIONS = [
  { value: 'to bottom',       label: '↓' },
  { value: 'to right',        label: '→' },
  { value: 'to bottom right', label: '↘' },
  { value: 'to top right',    label: '↗' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Small primitives ─────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">{children}</p>
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="size-7 rounded-md border border-gray-200 cursor-pointer p-0.5" />
        <span className="text-[11px] font-mono text-gray-400 w-16">{value}</span>
      </div>
    </div>
  )
}

function Divider() {
  return <div style={{ height: '0.5px', background: 'rgba(209,213,219,0.6)' }} />
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface QRPrintDesignerProps {
  qrUrl?: string
  qrImageSrc?: string
  businessName?: string
  businessLogoUrl?: string | null
}

export function QRPrintDesigner({ qrUrl, qrImageSrc, businessName, businessLogoUrl }: QRPrintDesignerProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const previewAreaRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.75)
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [design, setDesign] = useState<QRDesign>({ ...DEFAULT_DESIGN, headline: businessName ?? '' })
  const { t } = useTranslation()

  function set<K extends keyof QRDesign>(key: K, val: QRDesign[K]) {
    setDesign(prev => ({ ...prev, [key]: val }))
  }

  // Pre-load business logo
  useEffect(() => {
    if (!businessLogoUrl || design.logo_data) return
    fetch(businessLogoUrl)
      .then(r => r.blob())
      .then(blob => fileToDataUrl(new File([blob], 'logo')))
      .then(dataUrl => set('logo_data', dataUrl))
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessLogoUrl])

  // Compute preview scale
  const computeScale = useCallback(() => {
    if (!previewAreaRef.current) return
    const el = previewAreaRef.current
    const availW = el.clientWidth - 48
    const availH = el.clientHeight - 140
    const preset = SIZE_PRESETS[design.size]
    const s = Math.min(availW / preset.w, availH / preset.h, 1)
    setScale(Math.max(0.28, parseFloat(s.toFixed(3))))
  }, [design.size])

  useEffect(() => {
    computeScale()
    const obs = new ResizeObserver(computeScale)
    if (previewAreaRef.current) obs.observe(previewAreaRef.current)
    return () => obs.disconnect()
  }, [computeScale])

  async function loadFonts() {
    const fontLink = getGoogleFontLinkTag([design.heading_font, design.body_font])
    if (fontLink) {
      const el = document.createElement('div')
      el.innerHTML = fontLink
      const link = el.firstElementChild as HTMLLinkElement
      if (link && !document.querySelector(`link[href="${link.href}"]`)) {
        document.head.appendChild(link)
        await new Promise(r => setTimeout(r, 700))
      }
    }
  }

  // Load fonts then export as PNG
  async function handleDownload() {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      await loadFonts()
      const { toPng } = await import('html-to-image')
      
      // html-to-image internally logs a SecurityError when it hits cross-origin stylesheets,
      // which Next.js intercepts and shows as a fatal error. We suppress it here.
      const origError = console.error
      console.error = (...args) => {
        if (args.some(a => a?.toString().includes('cssRules') || a?.message?.includes('cssRules'))) return
        origError(...args)
      }
      
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true })
      console.error = origError
      
      const a = document.createElement('a')
      a.download = `qr-stand-${design.size}.png`
      a.href = dataUrl
      a.click()
    } catch (e) {
      console.error('Export failed', e)
    } finally {
      setDownloading(false)
    }
  }

  async function handlePrint() {
    if (!cardRef.current) return
    setPrinting(true)
    try {
      await loadFonts()
      const { toPng } = await import('html-to-image')

      const origError = console.error
      console.error = (...args) => {
        if (args.some(a => a?.toString().includes('cssRules') || a?.message?.includes('cssRules'))) return
        origError(...args)
      }
      
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true })
      console.error = origError

      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      document.body.appendChild(iframe)

      const win = iframe.contentWindow
      if (!win) {
        setPrinting(false)
        return
      }

      win.document.write(`<html><head><title>QR Print</title>
        <style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{display:flex;justify-content:center;align-items:center;min-height:100vh}
          @media print{body{padding:0}}
          img { max-width: 100%; height: auto; }
        </style>
        </head><body><img src="${dataUrl}" /></body></html>`)
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
    } catch (e) {
      console.error('Print failed', e)
    } finally {
      setPrinting(false)
    }
  }

  async function handleUpload(type: 'logo' | 'bg', file: File) {
    const dataUrl = await fileToDataUrl(file)
    if (type === 'logo') set('logo_data', dataUrl)
    else set('bg_image_data', dataUrl)
  }

  const preset = SIZE_PRESETS[design.size]
  const isCompact = design.size === 'square'

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[620px]">

      {/* ── LEFT: Preview ── */}
      <div ref={previewAreaRef}
        className="flex-1 flex flex-col items-center bg-[#f4f4f4] rounded-2xl border border-gray-200 overflow-hidden p-5">
        {/* Size tabs */}
        <div className="flex flex-wrap gap-1 mb-5 bg-white rounded-xl p-1 border border-gray-100 shadow-sm">
          {(Object.entries(SIZE_PRESETS) as [SizePreset, typeof SIZE_PRESETS[SizePreset]][]).map(([key, p]) => (
            <button key={key} type="button" onClick={() => set('size', key)}
              className={cn('px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                design.size === key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
              )}>
              {p.label} <span className="opacity-50">{p.desc}</span>
            </button>
          ))}
        </div>

        {/* Scaled card preview */}
        <div className="flex-1 flex items-center justify-center w-full">
          <div style={{ width: preset.w * scale, height: preset.h * scale, position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, transformOrigin: 'top left', transform: `scale(${scale})` }}>
              <QRCardPreview ref={cardRef} design={design} qrUrl={qrUrl} qrImageSrc={qrImageSrc} />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 w-full justify-center">
          <button onClick={handlePrint} disabled={printing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">
            <Printer className="size-4" />
            {printing ? t('qr.designer.exporting') : t('qr.designer.print')}
          </button>
          <button onClick={handleDownload} disabled={downloading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
            <Download className="size-4" />
            {downloading ? t('qr.designer.exporting') : t('qr.designer.download')}
          </button>
        </div>
      </div>

      {/* ── RIGHT: Controls ── */}
      <div className="shrink-0 overflow-y-auto space-y-5 pb-8" style={{ width: 268 }}>

        {/* Background */}
        <div>
          <SectionHeader>{t('qr.designer.background')}</SectionHeader>
          <div className="space-y-3">
            <div className="flex gap-1">
              {(['solid', 'gradient'] as const).map(v => (
                <button key={v} type="button" onClick={() => set('bg_type', v)}
                  className={cn('flex-1 py-1.5 text-xs rounded-lg border transition-colors capitalize',
                    design.bg_type === v ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  )}>
                  {v === 'solid' ? t('qr.designer.solid') : t('qr.designer.gradient')}
                </button>
              ))}
            </div>
            {design.bg_image_data ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 text-xs text-gray-500">{t('qr.designer.imageSet')}</div>
                <button onClick={() => set('bg_image_data', null)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500 hover:text-gray-700 transition-colors">
                <ImageIcon className="size-3.5" />{t('qr.designer.uploadBg')}
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload('bg', e.target.files[0])} />
              </label>
            )}
            <ColorRow label={t('qr.designer.color')} value={design.bg_color} onChange={v => set('bg_color', v)} />
            {design.bg_type === 'gradient' && (
              <>
                <ColorRow label={t('qr.designer.color2')} value={design.bg_color2} onChange={v => set('bg_color2', v)} />
                <div className="flex gap-1">
                  {BG_DIRECTIONS.map(d => (
                    <button key={d.value} type="button" onClick={() => set('bg_direction', d.value)}
                      className={cn('flex-1 py-1 text-sm rounded border transition-colors',
                        design.bg_direction === d.value ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:border-gray-400'
                      )}>{d.label}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <Divider />

        {/* Logo */}
        <div>
          <SectionHeader>{t('qr.designer.logo')}</SectionHeader>
          {design.logo_data ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={design.logo_data} alt="" className="size-10 rounded-lg object-contain border border-gray-200 shrink-0" />
              <span className="flex-1 text-xs text-gray-400">{t('qr.designer.logoSize')}</span>
              <button onClick={() => set('logo_data', null)} className="text-gray-400 hover:text-red-500 transition-colors shrink-0">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500 hover:text-gray-700 border border-dashed border-gray-300 rounded-xl py-3 px-4 hover:border-gray-400 transition-colors">
              <Upload className="size-3.5" />{t('qr.designer.uploadLogo')}
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload('logo', e.target.files[0])} />
            </label>
          )}
        </div>

        <Divider />

        {/* QR Style */}
        {qrUrl && (
          <>
            <div>
              <SectionHeader>{t('qr.designer.qrStyle')}</SectionHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-1.5">
                  {QR_STYLES.map(s => (
                    <button key={s.value} type="button" onClick={() => set('qr_style', s.value)}
                      className={cn('flex flex-col items-center gap-1 py-2 rounded-xl border text-xs transition-colors',
                        design.qr_style === s.value ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      )}>
                      <span className="text-base leading-none">{s.icon}</span>
                      <span className="text-[10px]">{s.label}</span>
                    </button>
                  ))}
                </div>
                <ColorRow label={t('qr.designer.qrColor')} value={design.qr_color} onChange={v => set('qr_color', v)} />
              </div>
            </div>
            <Divider />
          </>
        )}

        {/* Text */}
        <div>
          <SectionHeader>{t('qr.designer.text')}</SectionHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-600">{t('qr.designer.headline')}</label>
              <input type="text" value={design.headline} onChange={e => set('headline', e.target.value)}
                placeholder="e.g. The Best Café"
                className="w-full h-8 text-sm px-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400" />
            </div>
            {!isCompact && (
              <div className="space-y-1">
                <label className="text-xs text-gray-600">{t('qr.designer.subtext')}</label>
                <input type="text" value={design.subtext} onChange={e => set('subtext', e.target.value)}
                  placeholder="Scan to view our menu"
                  className="w-full h-8 text-sm px-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400" />
              </div>
            )}
            {isCompact && (
              <p className="text-[11px] text-gray-400 italic">{t('qr.designer.subtextHidden')}</p>
            )}
            <ColorRow label={t('qr.designer.textColor')} value={design.text_color} onChange={v => set('text_color', v)} />
            <FontPicker label={t('qr.designer.headingFont')} value={design.heading_font} onChange={v => set('heading_font', v)} />
            <FontPicker label={t('qr.designer.bodyFont')} value={design.body_font} onChange={v => set('body_font', v)} />
          </div>
        </div>

        <Divider />

        {/* Layout */}
        <div>
          <SectionHeader>{t('qr.designer.layout')}</SectionHeader>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-600">{t('qr.designer.padding')} <span className="text-gray-400">({t('qr.designer.paddingHint')})</span></span>
                <span className="text-xs text-gray-400">{design.padding}px</span>
              </div>
              <input type="range" min={20} max={80} step={4} value={design.padding}
                onChange={e => set('padding', +e.target.value)} className="w-full accent-gray-900" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-600">{t('qr.designer.cornerRadius')}</span>
                <span className="text-xs text-gray-400">{design.corner_radius}px</span>
              </div>
              <input type="range" min={0} max={40} step={4} value={design.corner_radius}
                onChange={e => set('corner_radius', +e.target.value)} className="w-full accent-gray-900" />
            </div>
          </div>
        </div>

        <Divider />

        <button type="button" onClick={() => setDesign({ ...DEFAULT_DESIGN, headline: businessName ?? '' })}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw className="size-3.5" />{t('qr.designer.resetDefaults')}
        </button>

      </div>
    </div>
  )
}
