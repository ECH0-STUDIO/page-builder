import type { SupportedLocale } from '@/i18n/locale'
import { prepareMarketingShellHtml } from '@/lib/marketing-page-shell'

type Props = {
  children: React.ReactNode
  locale: SupportedLocale
  pathname?: string
  /** Webflow export slug used for navbar/footer chrome (e.g. features). */
  shellSlug?: string
}

export function MarketingWebflowShell({
  children,
  locale,
  pathname = '/explore',
  shellSlug = 'features',
}: Props) {
  const { beforeMain, afterMain } = prepareMarketingShellHtml(shellSlug, locale, pathname)

  if (!beforeMain) {
    return <>{children}</>
  }

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: beforeMain }} suppressHydrationWarning />
      {children}
      <div dangerouslySetInnerHTML={{ __html: afterMain }} suppressHydrationWarning />
    </>
  )
}
