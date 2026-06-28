'use client'

import { useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Globe, Copy, ExternalLink, CheckCircle2, XCircle,
  BarChart2, Eye, TrendingUp, Palette, QrCode, ChevronRight,
  Download, Loader2, AlertCircle, Save
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { slugify, checkSlugAvailable } from '@/lib/business'
import { updateBusinessAction } from '@/app/actions/business'
import {
  togglePublishAction, getPageViewsAction, verifyDnsAction,
  connectCustomDomainAction, disconnectCustomDomainAction,
} from '@/app/actions/page-builder'
import type { DnsRecord } from '@/lib/vercel-domains'
import type { PublishingSettings, DayViewStat } from '@/app/actions/page-builder'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublishingClientProps {
  businessId: string
  publishing: PublishingSettings | null
  slug: string
  analytics: { total: number; periodTotal: number; daily: DayViewStat[] }
  baseUrl: string
  initialDomainSetup?: {
    domain: string | null
    verified: boolean
    dnsRecords: DnsRecord[]
  }
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

function MiniChart({ daily, period }: { daily: DayViewStat[]; period: 7 | 30 }) {
  const max = Math.max(...daily.map(d => d.count), 1)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="flex gap-1 h-32 w-full pt-6">
      {daily.map((d) => {
        const date = new Date(d.date + 'T00:00:00')
        const isToday = d.date === new Date().toISOString().slice(0, 10)
        const heightPct = Math.max((d.count / max) * 100, d.count > 0 ? 6 : 2)
        const label = period === 7
          ? days[date.getDay()]
          : date.getDate().toString()
        return (
          <div key={d.date} className="relative flex flex-col items-center gap-1.5 flex-1 h-full group">
            {/* Custom Tooltip */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-medium px-2.5 py-1 rounded-md pointer-events-none whitespace-nowrap z-10 shadow-sm flex flex-col items-center">
              {d.count} views
              {/* Tooltip triangle */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-gray-900" />
            </div>

            <div className="w-full flex-1 relative">
              <div className="absolute bottom-0 left-0 w-full rounded-t-sm transition-all group-hover:brightness-90"
                style={{
                  height: `${heightPct}%`,
                  background: isToday
                    ? 'linear-gradient(to top, #111, #555)'
                    : d.count > 0 ? '#d1d5db' : '#f3f4f6',
                  minHeight: 2,
                }}
              />
            </div>
            <div className="h-4 flex items-center justify-center shrink-0">
              {(period === 7 || date.getDate() % 5 === 1 || isToday) && (
                <span className={cn('text-[9px] font-medium', isToday ? 'text-gray-900 font-bold' : 'text-gray-400')}>
                  {label}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm p-6', className)}>
      {children}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function PublishingClient({
  businessId,
  publishing,
  slug: initialSlug,
  analytics: initialAnalytics,
  baseUrl,
  initialDomainSetup,
}: PublishingClientProps) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [isPublished, setIsPublished] = useState(publishing?.published ?? false)
  const [customDomain, setCustomDomain] = useState(publishing?.custom_domain ?? initialDomainSetup?.domain ?? '')
  const [domainVerified, setDomainVerified] = useState(
    initialDomainSetup?.verified ?? (publishing as { custom_domain_verified?: boolean } | null)?.custom_domain_verified ?? false
  )
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>(initialDomainSetup?.dnsRecords ?? [])
  const [savingDomain, setSavingDomain] = useState(false)
  const [verifyingDns, setVerifyingDns] = useState(false)
  const [copied, setCopied] = useState(false)
  const [period, setPeriod] = useState<7 | 30>(7)
  const [analytics, setAnalytics] = useState(initialAnalytics)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const { t } = useTranslation()

  // ── Slug state ──
  const [slug, setSlug] = useState(initialSlug)
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'same'>('same')
  const [savingSlug, setSavingSlug] = useState(false)

  // Sync state during render
  if (slug === initialSlug && slugStatus !== 'same') setSlugStatus('same')
  else if (slug !== initialSlug && slug.length < 2 && slugStatus !== 'idle') setSlugStatus('idle')

  useEffect(() => {
    if (slug === initialSlug || slug.length < 2) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlugStatus('checking')
    const timer = setTimeout(async () => {
      const available = await checkSlugAvailable(slug, businessId)
      setSlugStatus(available ? 'available' : 'taken')
    }, 400)
    return () => clearTimeout(timer)
  }, [slug, initialSlug, businessId])

  async function handleSaveSlug() {
    if (slug !== initialSlug && slugStatus !== 'available') return
    setSavingSlug(true)
    try {
      const res = await updateBusinessAction(businessId, { slug })
      if (res.success) toast.success(t('publishing.toastUrlUpdated'))
      else toast.error(res.error)
    } catch {
      toast.error(t('publishing.toastUrlFailed'))
    } finally {
      setSavingSlug(false)
    }
  }

  async function handleSaveDomain() {
    if (!customDomain.trim()) return
    setSavingDomain(true)
    try {
      const res = await connectCustomDomainAction(businessId, customDomain.trim())
      if (res.success) {
        setDnsRecords(res.data.dnsRecords)
        setDomainVerified(false)
        setCustomDomain(customDomain.trim().toLowerCase())
        toast.success(t('publishing.toastDomainUpdated'))
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error(t('publishing.toastDomainFailed'))
    } finally {
      setSavingDomain(false)
    }
  }

  async function handleRemoveDomain() {
    setSavingDomain(true)
    try {
      const res = await disconnectCustomDomainAction(businessId)
      if (res.success) {
        setCustomDomain('')
        setDnsRecords([])
        setDomainVerified(false)
        toast.success(t('publishing.toastDomainUpdated'))
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error(t('publishing.toastDomainFailed'))
    } finally {
      setSavingDomain(false)
    }
  }

  async function handleVerifyDns() {
    const domain = customDomain || publishing?.custom_domain
    if (!domain) return
    setVerifyingDns(true)
    const res = await verifyDnsAction(domain, businessId)
    setVerifyingDns(false)
    if (res.success) {
      setDomainVerified(true)
      setDnsRecords([])
      toast.success(t('publishing.dnsVerified'))
    } else {
      toast.error(res.error)
    }
  }

  const publicUrl = `${baseUrl}/${initialSlug}`

  // ── Period toggle ─────────────────────────────────────────────────────────

  async function switchPeriod(p: 7 | 30) {
    if (p === period || loadingAnalytics) return
    setPeriod(p)
    setLoadingAnalytics(true)
    try {
      const data = await getPageViewsAction(businessId, p)
      setAnalytics(data)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  // ── CSV download ──────────────────────────────────────────────────────────

  function handleDownloadCsv() {
    const rows = [['date', 'views'], ...analytics.daily.map(d => [d.date, d.count.toString()])]
    const csv = rows.map(r => r.join(',')).join('\n')
    // UTF-8 BOM ensures correct encoding in Excel / Numbers
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `analytics-${period}d.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Publish toggle ────────────────────────────────────────────────────────

  function handleToggle() {
    const next = !isPublished
    setIsPublished(next)
    startTransition(async () => {
      const res = await togglePublishAction(businessId, next)
      if (!res.success) { setIsPublished(!next); toast.error(res.error) }
      else {
        toast.success(next ? 'Page is now live 🎉' : 'Page set to draft')
        queryClient.invalidateQueries({ queryKey: ['pageData', businessId] })
      }
    })
  }

  // ── Copy URL ──────────────────────────────────────────────────────────────

  function handleCopy() {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">

      {/* ── Page URL ── */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Globe className="size-4 text-gray-600" />
          <h2 className="font-semibold text-gray-900">{t('publishing.pageUrl')}</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pub-slug">
              {t('publishing.customSlug')}
              {slugStatus === 'checking' && (
                <span className="ml-2 text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" /> Checking…
                </span>
              )}
              {slugStatus === 'available' && (
                <span className="ml-2 text-xs text-green-600 dark:text-green-400 inline-flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Available
                </span>
              )}
              {slugStatus === 'taken' && (
                <span className="ml-2 text-xs text-destructive inline-flex items-center gap-1">
                  <AlertCircle className="size-3" /> Taken
                </span>
              )}
            </Label>
            <div className="flex items-stretch max-w-md">
              <span className="h-10 px-3 bg-muted border border-r-0 border-input rounded-l-md text-sm text-muted-foreground shrink-0 flex items-center whitespace-nowrap">
                {baseUrl.replace(/^https?:\/\//, '')}/
              </span>
              <Input
                id="pub-slug"
                className="rounded-l-none"
                value={slug}
                onChange={e => { setSlug(slugify(e.target.value)) }}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('publishing.slugHint')}
            </p>
          </div>
          <div className="flex justify-end max-w-md">
            <Button
              onClick={handleSaveSlug}
              disabled={savingSlug || (slug !== initialSlug && slugStatus !== 'available') || slug === initialSlug}
              className="w-full sm:w-auto"
            >
              {savingSlug ? (
                <><Loader2 className="size-4 animate-spin mr-2" /> {t('publishing.saving')}</>
              ) : (
                <><Save className="size-4 mr-2" /> {t('publishing.saveUrl')}</>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Live Status ── */}
      <Card>
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className={cn('size-2.5 rounded-full', isPublished ? 'bg-green-500 animate-pulse' : 'bg-gray-300')} />
              <h2 className="font-semibold text-gray-900">
                {isPublished ? t('publishing.pageIsLive') : t('publishing.pageIsDraft')}
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              {isPublished
                ? t('publishing.visitHint')
                : 'Publish to make your page accessible to customers.'}
            </p>
          </div>
          <button
            type="button" onClick={handleToggle} disabled={isPending}
            className={cn('relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-60',
              isPublished ? 'bg-gray-900' : 'bg-gray-200')}
          >
            <span className={cn('inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
              isPublished ? 'translate-x-6' : 'translate-x-1')} />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
          <Globe className="size-4 text-gray-400 shrink-0" />
          <span className="flex-1 text-sm text-gray-700 truncate font-mono">{publicUrl}</span>
          <button onClick={handleCopy} className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors">
            {copied ? <CheckCircle2 className="size-4 text-green-600" /> : <Copy className="size-4" />}
          </button>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer"
            className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors">
            <ExternalLink className="size-4" />
          </a>
        </div>
      </Card>

      {/* ── Custom Domain ── */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Globe className="size-4 text-gray-600" />
          <h2 className="font-semibold text-gray-900">{t('publishing.customDomain')}</h2>
          <span className="text-[10px] font-bold tracking-widest text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full uppercase ml-1">{t('publishing.creditMo')}</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t('publishing.domainLabel')}</label>
            <div className="flex gap-2">
              <input type="text" value={customDomain} onChange={e => setCustomDomain(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''))}
                placeholder="Enter custom domain"
                className="flex-1 h-10 px-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 font-mono" />
              <Button onClick={handleSaveDomain} disabled={savingDomain || !customDomain.trim() || (customDomain === publishing?.custom_domain && dnsRecords.length > 0)} className="shrink-0 h-10">
                {savingDomain ? <Loader2 className="size-4 animate-spin" /> : t('publishing.save')}
              </Button>
            </div>
          </div>

          {customDomain && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-4 space-y-3">
              {domainVerified ? (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span className="text-sm font-medium">{t('publishing.domainConnected')}</span>
                  <a
                    href={`https://${customDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-xs underline"
                  >
                    https://{customDomain}
                  </a>
                </div>
              ) : (
                <>
                  <h3 className="font-semibold text-blue-900 text-sm">{t('publishing.dnsTitle')}</h3>
                  <p className="text-xs text-blue-800">{t('publishing.dnsDesc')}</p>

                  <div className="space-y-2">
                    {(dnsRecords.length > 0 ? dnsRecords : [{ type: 'CNAME', name: '@', value: t('publishing.dnsTarget') }]).map((record, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg border border-blue-100 text-sm font-mono text-gray-800 shadow-sm flex flex-col md:flex-row md:items-center gap-2 md:gap-4 overflow-x-auto">
                        <div className="flex items-center gap-2 min-w-fit"><span className="text-gray-400 select-none text-xs">Type:</span> {record.type}</div>
                        <div className="flex items-center gap-2 min-w-fit"><span className="text-gray-400 select-none text-xs">Name:</span> {record.name}</div>
                        <div className="flex items-center gap-2 min-w-fit"><span className="text-gray-400 select-none text-xs">Value:</span> {record.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                    <p className="text-xs text-blue-700/80 italic">{t('publishing.dnsNote')}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="ghost" onClick={handleRemoveDomain} disabled={savingDomain} className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
                        {t('publishing.cancelDomain')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleVerifyDns} disabled={verifyingDns} className="h-8 text-xs bg-white text-blue-700 border-blue-200 hover:bg-blue-50">
                        {verifyingDns ? <Loader2 className="size-3 animate-spin mr-1.5" /> : <Globe className="size-3 mr-1.5" />}
                        {t('publishing.verifyConnection')}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            <strong>{t('publishing.billingNotePrefix')}</strong> {t('publishing.billingNoteText')} <em>{t('publishing.billingNoteTextAfter')}</em> {t('publishing.billingNoteTextEnd')}
          </p>
        </div>
      </Card>

      {/* ── Analytics ── */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BarChart2 className="size-4 text-gray-600" />
            <h2 className="font-semibold text-gray-900">{t('publishing.analytics')}</h2>
          </div>
          {/* Period toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {([7, 30] as const).map(p => (
              <button key={p} onClick={() => switchPeriod(p)}
                className={cn('px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
                {p}d
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-5 bg-blue-50/50 text-blue-800 text-xs px-3 py-2 rounded-lg border border-blue-100 flex items-start gap-2">
          <AlertCircle className="size-4 shrink-0 mt-0.5 text-blue-500" />
          <p>
            <strong>{t('publishing.usageCostPrefix')}</strong> {t('publishing.usageCostText')} <strong>{t('publishing.usageCostBold')}</strong>{t('publishing.usageCostEnd')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Eye className="size-3.5" />
              <span className="text-xs font-medium uppercase tracking-wide">{t('publishing.totalViews')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{analytics.total.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <TrendingUp className="size-3.5" />
              <span className="text-xs font-medium uppercase tracking-wide">{t('publishing.lastNDays').replace('{{n}}', String(period))}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{analytics.periodTotal.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              {loadingAnalytics ? t('publishing.loading') : t('publishing.lastNDays').replace('{{n}}', String(period))}
            </p>
            <button onClick={handleDownloadCsv}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
              <Download className="size-3" /> CSV
            </button>
          </div>
          <MiniChart daily={analytics.daily} period={period} />
        </div>
      </Card>

      {/* SEO, favicon, analytics tags → Page Builder → Global Settings (Chủ đề) */}
      <Card className="bg-gray-50 border-dashed">
        <p className="text-sm text-gray-600">
          {t('publishing.seoMovedHint')}
        </p>
      </Card>

      {/* ── Quick Actions ── */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">{t('publishing.quickActions')}</h2>
        <div className="space-y-2">
          {[
            { href: '/dashboard/pages', icon: Palette, label: t('publishing.editPageBuilder'), desc: t('publishing.editPageBuilderSeoDesc') },
            { href: '/dashboard/qr', icon: QrCode, label: t('sidebar.qrCodes'), desc: t('publishing.qrCodesDesc') },
          ].map(item => (
            <a key={item.href} href={item.href}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-colors group">
              <div className="size-9 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <item.icon className="size-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-400 truncate">{item.desc}</p>
              </div>
              <ChevronRight className="size-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
            </a>
          ))}
        </div>
      </Card>

      {/* Status footer */}
      <div className="flex items-center justify-center gap-2 py-2">
        {isPublished
          ? <><CheckCircle2 className="size-4 text-green-500" /><span className="text-xs text-green-600 font-medium">{t('publishing.pageIsLiveStatus')}</span></>
          : <><XCircle className="size-4 text-gray-400" /><span className="text-xs text-gray-400">{t('publishing.pageIsDraftStatus')}</span></>
        }
      </div>
    </div>
  )
}
