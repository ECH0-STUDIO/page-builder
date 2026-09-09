'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { useTranslationWithFallback } from '@/i18n/I18nProvider'

/**
 * Without this, any throw in a dashboard server component replaced the whole
 * app with Next's unstyled error screen and no way back.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useTranslationWithFallback()

  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex-1 min-h-[50vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          {t('errorBoundary.dashboardTitle')}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('errorBoundary.dashboardBody')}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {t('errorBoundary.retry')}
          </button>
          <Link
            href="/dashboard"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            {t('errorBoundary.backToDashboard')}
          </Link>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-muted-foreground/70">
            {t('errorBoundary.reference')}: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
