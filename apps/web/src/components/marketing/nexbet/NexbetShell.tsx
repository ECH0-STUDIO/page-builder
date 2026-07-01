import type { SupportedLocale } from '@/i18n/locale'
import { NexbetNav } from './NexbetNav'
import { NexbetFooter } from './NexbetFooter'

export function NexbetShell({
  locale,
  children,
}: {
  locale: SupportedLocale
  children: React.ReactNode
}) {
  return (
    <div className="page-wrapper">
      <NexbetNav locale={locale} />
      <main className="main-wrapper">{children}</main>
      <NexbetFooter locale={locale} />
    </div>
  )
}
