import type { SupportedLocale } from '@/i18n/locale'
import { getMarketingHostname, isSplitDomainDeployment, normalizeSiteHostname } from '@/lib/site-urls'

const ONE_YEAR = 60 * 60 * 24 * 365

export function getSharedLocaleCookieDomain(): string | undefined {
  if (!isSplitDomainDeployment()) return undefined
  const bare = normalizeSiteHostname(getMarketingHostname())
  return `.${bare}`
}

export function localeCookieOptions() {
  const domain = getSharedLocaleCookieDomain()
  return {
    path: '/',
    maxAge: ONE_YEAR,
    sameSite: 'lax' as const,
    ...(domain ? { domain } : {}),
  }
}

export function currencyForLocale(locale: SupportedLocale): string {
  return locale === 'vi' ? 'VND' : 'USD'
}
