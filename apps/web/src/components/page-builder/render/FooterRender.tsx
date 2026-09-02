import { FooterConfig } from '../types'
import { LiveStoreFooter } from './LiveStoreFooter'
import { resolveContentText } from '@/i18n/editor-locale-utils'
import { toSupportedLocale, type SupportedLocale } from '@/i18n/locale'
import { footerSpacingFromSize, inferFooterSpacingSize } from '../spacing-presets'

export function FooterRender({
  config,
  businessName,
  logoUrl,
  inEditor = false,
  locale,
  primaryLocale = 'vi',
  editorLocaleMode = false,
}: {
  config: FooterConfig
  businessName: string
  logoUrl?: string | null
  inEditor?: boolean
  locale?: string
  primaryLocale?: SupportedLocale
  editorLocaleMode?: boolean
}) {
  const currentYear = new Date().getFullYear()
  const activeLocale = toSupportedLocale(locale)
  const copyright = resolveContentText(config.copyright_text, activeLocale, primaryLocale, { editorMode: editorLocaleMode })
  const bgImage = config.background_image?.trim()
  const spacing = footerSpacingFromSize(inferFooterSpacingSize(config))
  const showLogo = Boolean(config.show_logo && logoUrl)

  return (
    <footer
      className="w-full text-center text-sm"
      style={{
        backgroundColor: config.background_color,
        color: config.text_color,
        paddingTop: spacing.padding_top,
        paddingRight: spacing.padding_right,
        paddingBottom: spacing.padding_bottom,
        paddingLeft: spacing.padding_left,
        ...(bgImage
          ? {
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : {}),
      }}
    >
      <div className="max-w-4xl mx-auto space-y-2">
        {showLogo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl!}
            alt={businessName}
            className="mx-auto object-contain"
            style={{ maxHeight: 48, maxWidth: 160 }}
          />
        )}
        {config.show_business_name && (
          <p className="font-semibold text-lg">{businessName}</p>
        )}
        <p className="opacity-80">
          &copy; {currentYear} {copyright}
        </p>
        {!inEditor && (
          <LiveStoreFooter />
        )}
      </div>
    </footer>
  )
}
