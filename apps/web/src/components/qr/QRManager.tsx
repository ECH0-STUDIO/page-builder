'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { Download, Copy, Check, QrCode, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { updateBusinessAction } from '@/app/actions/business'
import { QRPrintDesigner } from './QRPrintDesigner'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'
import {
  resolvePublicStoreUrl,
  type StorePublicUrlMeta,
} from '@/lib/site-urls'

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

function SimpleQRCard({ url, label, sublabel, filename }: {
  url: string; label: string; sublabel?: string; filename: string
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!url) return
    setDataUrl(null)
    QRCode.toDataURL(url, {
      width: 400, margin: 2,
      color: { dark: '#111111', light: '#ffffff' },
    }, (err, generated) => {
      if (!err) setDataUrl(generated)
    })
  }, [url])

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 flex flex-col items-center gap-4 w-full">
      <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100 relative p-2">
        {dataUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={dataUrl} alt="QR Code" className="w-full h-full object-contain mix-blend-multiply transition-opacity animate-in fade-in" />
        ) : (
          <QrCode className="size-10 text-gray-200 animate-pulse absolute" />
        )}
      </div>
      <div className="text-center">
        <p className="font-semibold text-sm text-gray-900">{label}</p>
        {sublabel && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{sublabel}</p>}
      </div>
      <div className="flex gap-2 w-full">
        <button
          onClick={copy}
          title={copied ? 'Copied!' : 'Copy link'}
          className="flex-1 flex items-center justify-center h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
        </button>
        <button
          onClick={() => downloadQR(url, filename)}
          title="Download PNG"
          className="flex-1 flex items-center justify-center h-9 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        >
          <Download className="size-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Table QRs Tab ────────────────────────────────────────────────────────────

function TableQRTab({
  businessId,
  paymentSettings,
  slug,
  storePub,
}: {
  businessId: string
  paymentSettings: Record<string, unknown>
  slug: string
  storePub?: StorePublicUrlMeta | null
}) {
  const [tableCount, setTableCount] = useState(10)
  const [kdsEnabled, setKdsEnabled] = useState(Boolean(paymentSettings?.kds_enabled ?? true))
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
              <br />
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: Math.min(tableCount, 100) }).map((_, i) => {
            const num = i + 1
            return (
              <SimpleQRCard
                key={num}
                url={resolvePublicStoreUrl(slug, storePub, `/order?table=${num}`)}
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

type Tab = 'design' | 'tables'

export function QRManager({
  businessId,
  paymentSettings,
  slug,
  businessName,
  businessLogoUrl,
  storePub,
}: {
  businessId: string
  paymentSettings: Record<string, unknown>
  slug: string
  businessName?: string
  businessLogoUrl?: string | null
  /** Prefer verified custom domain for encoded QR URLs */
  storePub?: StorePublicUrlMeta | null
}) {
  const [tab, setTab] = useState<Tab>('design')
  const pageUrl = resolvePublicStoreUrl(slug, storePub)
  const { t } = useTranslation()

  const tabs = [
    { id: 'design' as Tab, label: t('qr.tabBusiness'), icon: <Palette className="size-3.5" /> },
    { id: 'tables' as Tab, label: t('qr.tabTables'), icon: <Check className="size-3.5" /> },
  ]

  return (
    <div className="space-y-6">
      <div className="w-full overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-max">
          {tabs.map(tabItem => (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
                tab === tabItem.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {tabItem.icon}{tabItem.label}
            </button>
          ))}
        </div>
      </div>

      {storePub?.custom_domain_verified && storePub.custom_domain && (
        <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/40 px-3 py-2">
          QR codes point to your custom domain:{' '}
          <span className="font-mono text-foreground">{storePub.custom_domain}</span>
        </p>
      )}

      {tab === 'design' && (
        <QRPrintDesigner businessId={businessId} qrUrl={pageUrl} businessName={businessName} businessLogoUrl={businessLogoUrl || undefined} />
      )}
      {tab === 'tables' && (
        <TableQRTab
          businessId={businessId}
          paymentSettings={paymentSettings}
          slug={slug}
          storePub={storePub}
        />
      )}
    </div>
  )
}
