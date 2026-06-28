import { FooterConfig } from '../types'
import { LiveStoreFooter } from './LiveStoreFooter'
import { pickLocale, toSupportedLocale, type SupportedLocale } from '@/i18n/locale'

export function FooterRender({
  config,
  businessName,
  inEditor = false,
  locale,
}: {
  config: FooterConfig
  businessName: string
  inEditor?: boolean
  /** Active visitor locale — only used on live store for language switcher */
  locale?: 'vi' | 'en'
}) {
  const currentYear = new Date().getFullYear()
  const activeLocale = toSupportedLocale(locale)
  const copyright = pickLocale(config.copyright_text, activeLocale)

  return (
    <footer
      className="w-full py-8 px-6 text-center text-sm"
      style={{
        backgroundColor: config.background_color,
        color: config.text_color,
      }}
    >
      <div className="max-w-4xl mx-auto space-y-2">
        {config.show_business_name && (
          <p className="font-semibold text-lg">{businessName}</p>
        )}
        <p className="opacity-80">
          &copy; {currentYear} {copyright}
        </p>
        {!inEditor && (
          <LiveStoreFooter locale={locale} />
        )}
      </div>
    </footer>
  )
}
