'use client'

/**
 * Overview card: copy / open live landing and order page URLs.
 */

import { useState } from 'react'
import { CheckCircle2, Copy, ExternalLink, Globe } from 'lucide-react'
import { useTranslation } from '@/i18n/I18nProvider'
import { cn } from '@/lib/utils'

interface OverviewLiveLinksProps {
  landingUrl: string
  orderUrl: string
  landingPublished: boolean
  orderPublished: boolean
}

export function OverviewLiveLinks({
  landingUrl,
  orderUrl,
  landingPublished,
  orderPublished,
}: OverviewLiveLinksProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState<'landing' | 'order' | null>(null)

  function handleCopy(url: string, key: 'landing' | 'order') {
    navigator.clipboard.writeText(url)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  function Row({
    label,
    url,
    live,
    copyKey,
  }: {
    label: string
    url: string
    live: boolean
    copyKey: 'landing' | 'order'
  }) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">{label}</p>
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
              live ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground',
            )}
          >
            {live ? t('overview.liveLinks.live') : t('overview.liveLinks.draft')}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2.5 border border-border/60">
          <Globe className="size-4 text-muted-foreground shrink-0" />
          <span className="flex-1 text-sm text-foreground/80 truncate font-mono">{url}</span>
          <button
            type="button"
            onClick={() => handleCopy(url, copyKey)}
            className="shrink-0 p-1.5 rounded-lg hover:bg-background text-muted-foreground transition-colors"
            aria-label={t('overview.liveLinks.copy')}
          >
            {copied === copyKey
              ? <CheckCircle2 className="size-4 text-green-600" />
              : <Copy className="size-4" />}
          </button>
          {live ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-1.5 rounded-lg hover:bg-background text-muted-foreground transition-colors"
              aria-label={t('overview.liveLinks.open')}
            >
              <ExternalLink className="size-4" />
            </a>
          ) : (
            <span
              className="shrink-0 p-1.5 rounded-lg text-muted-foreground/40"
              title={t('overview.liveLinks.publishFirst')}
            >
              <ExternalLink className="size-4" />
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{t('overview.liveLinks.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('overview.liveLinks.description')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Row
          label={t('overview.liveLinks.landing')}
          url={landingUrl}
          live={landingPublished}
          copyKey="landing"
        />
        <Row
          label={t('overview.liveLinks.order')}
          url={orderUrl}
          live={orderPublished}
          copyKey="order"
        />
      </div>
    </section>
  )
}
