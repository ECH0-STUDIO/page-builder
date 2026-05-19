'use client'

import { useState, useRef, useEffect } from 'react'
import QRCode from 'qrcode'
import { Download, Copy, Check, QrCode, ExternalLink, Palette } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { updateBusinessAction } from '@/app/actions/business'
import { QRPrintDesigner } from './QRPrintDesigner'
import type { MenuCategory, MenuItem } from '@/app/actions/menu'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function downloadQR(url: string, filename: string) {
  const dataUrl = await QRCode.toDataURL(url, {
    width: 1000, margin: 2,
    color: { dark: '#111111', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  })
  const a = document.createElement('a')
  a.download = filename
  a.href = dataUrl
  a.click()
}

// ─── Simple QR Preview Card (Item QRs tab) ────────────────────────────────────

function SimpleQRCard({ url, label, sublabel, filename }: {
  url: string; label: string; sublabel?: string; filename: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rendered, setRendered] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!canvasRef.current || !url) return
    setRendered(false)
    QRCode.toCanvas(canvasRef.current, url, {
      width: 200, margin: 2,
      color: { dark: '#111111', light: '#ffffff' },
    }, () => setRendered(true))
  }, [url])

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-4 max-w-xs w-full">
      <div className="size-48 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100 relative">
        <canvas ref={canvasRef} className={`transition-opacity ${rendered ? 'opacity-100' : 'opacity-0'}`} />
        {!rendered && <QrCode className="size-10 text-gray-200 animate-pulse absolute" />}
      </div>
      <div className="text-center">
        <p className="font-semibold text-sm text-gray-900">{label}</p>
        {sublabel && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{sublabel}</p>}
      </div>
      <div className="flex gap-2 w-full">
        <button
          onClick={copy}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <button
          onClick={() => downloadQR(url, filename)}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
        >
          <Download className="size-3.5" />
          PNG
        </button>
      </div>
    </div>
  )
}

// ─── Item QRs Tab ─────────────────────────────────────────────────────────────

function ItemQRTab({ slug, categories, items }: {
  slug: string; categories: MenuCategory[]; items: MenuItem[]
}) {
  const [activeItemId, setActiveItemId] = useState<string | null>(items[0]?.id ?? null)
  const activeItem = items.find(i => i.id === activeItemId)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const { t } = useTranslation()

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <QrCode className="size-12 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-500">{t('qr.noItems')}</p>
        <Link href="/dashboard/menu" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
          {t('qr.noItemsLink')}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-6 py-6 min-h-96">
      <div className="w-full lg:w-64 shrink-0 space-y-1 overflow-y-auto max-h-[50vh] lg:max-h-[600px] pr-2">
        {categories.map(cat => {
          const catItems = items.filter(i => i.category_id === cat.id)
          if (catItems.length === 0) return null
          return (
            <div key={cat.id}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 py-2">{cat.name}</p>
              {catItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveItemId(item.id)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-3',
                    activeItemId === item.id ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  {item.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt="" className="size-8 rounded-lg object-cover shrink-0" />
                  )}
                  <span className="flex-1 min-w-0 truncate font-medium">{item.name}</span>
                </button>
              ))}
            </div>
          )
        })}
      </div>
      <div className="w-full lg:flex-1 flex items-start justify-center sticky top-0 lg:static z-10 bg-white/95 lg:bg-transparent backdrop-blur lg:backdrop-blur-none py-4 lg:py-0 rounded-2xl lg:rounded-none shadow-sm lg:shadow-none border border-gray-100 lg:border-transparent">
        {activeItem ? (
          <SimpleQRCard
            url={`${origin}/${slug}#item-${activeItem.id}`}
            label={activeItem.name}
            sublabel={t('qr.deepLink')}
            filename={`${activeItem.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`}
          />
        ) : (
          <p className="text-sm text-gray-400 mt-8">{t('qr.selectItem')}</p>
        )}
      </div>
    </div>
  )
}

// ─── Table QRs Tab ────────────────────────────────────────────────────────────

function TableQRTab({ businessId, paymentSettings, slug }: { businessId: string; paymentSettings: any; slug: string }) {
  const [tableCount, setTableCount] = useState(10)
  const [kdsEnabled, setKdsEnabled] = useState(paymentSettings?.kds_enabled ?? true)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const { t } = useTranslation()

  const handleToggle = async (checked: boolean) => {
    setKdsEnabled(checked)
    const newSettings = { ...paymentSettings, kds_enabled: checked }
    const res = await updateBusinessAction(businessId, { payment_settings: newSettings })
    if (!res.success) {
      toast.error(t('qr.kdsUpdateFailed'))
      setKdsEnabled(!checked)
    } else {
      toast.success(checked ? t('qr.kdsEnabled') : t('qr.kdsDisabled'))
    }
  }

  return (
    <div className="py-6 space-y-8">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl">
        <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-100">
          <div className="pr-8">
            <h3 className="font-bold text-gray-900 mb-1">{t('qr.kdsTitle')}</h3>
            <p className="text-sm text-gray-500">
              {t('qr.kdsDesc')} 
              <br/>
              <strong>Note:</strong> {t('qr.kdsNote')}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
            <input type="checkbox" className="sr-only peer" checked={kdsEnabled} onChange={e => handleToggle(e.target.checked)} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className={kdsEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}>
          <h3 className="font-bold text-gray-900 mb-1">{t('qr.batchTitle')}</h3>
          <p className="text-sm text-gray-500 mb-4">{t('qr.batchDesc')}</p>
          <div className="flex items-center gap-3">
            <input 
              type="number" 
              min="1" max="100" 
              value={tableCount} 
              onChange={e => setTableCount(parseInt(e.target.value) || 1)}
              className="w-24 h-10 px-3 rounded-lg border border-gray-200 font-bold"
            />
            <span className="text-gray-500 font-medium">{t('qr.tables')}</span>
          </div>
        </div>
      </div>

      {kdsEnabled && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: Math.min(tableCount, 100) }).map((_, i) => {
            const num = i + 1
            return (
              <SimpleQRCard
                key={num}
                url={`${origin}/${slug}?table=${num}`}
                label={`${t('qr.tableLabel')} ${num}`}
                sublabel={t('qr.autoAssigns')}
                filename={`table-${num}-qr.png`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main QRManager ───────────────────────────────────────────────────────────

type Tab = 'design' | 'items' | 'tables'

export function QRManager({ businessId, paymentSettings, slug, categories, items, businessName, businessLogoUrl }: {
  businessId: string
  paymentSettings: any
  slug: string
  categories: MenuCategory[]
  items: MenuItem[]
  businessName?: string
  businessLogoUrl?: string | null
}) {
  const [tab, setTab] = useState<Tab>('design')
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000'
  const pageUrl = `${origin}/${slug}`
  const { t } = useTranslation()

  const tabs = [
    { id: 'design' as Tab, label: t('qr.tabBusiness'), icon: <Palette className="size-3.5" /> },
    { id: 'tables' as Tab, label: t('qr.tabTables'),  icon: <Check className="size-3.5" /> },
    { id: 'items'  as Tab, label: t('qr.tabItems'),   icon: <QrCode  className="size-3.5" /> },
  ]

  return (
    <div className="space-y-6">
      <div className="w-full overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-max">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {t.icon}{t.label}
          </button>
        ))}
        <a href={`/${slug}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-gray-600 transition-colors ml-2">
          <ExternalLink className="size-3.5" />{t('qr.tabLive')}
        </a>
      </div>
      </div>

      {tab === 'design' && (
        <QRPrintDesigner qrUrl={pageUrl} businessName={businessName} businessLogoUrl={businessLogoUrl} />
      )}
      {tab === 'items' && (
        <ItemQRTab slug={slug} categories={categories} items={items} />
      )}
      {tab === 'tables' && (
        <TableQRTab businessId={businessId} paymentSettings={paymentSettings} slug={slug} />
      )}
    </div>
  )
}
