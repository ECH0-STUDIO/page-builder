import { FooterConfig } from '../types'
import { LiveStoreFooter } from './LiveStoreFooter'
import { plainText } from '@/i18n/locale'

export function FooterRender({
  config,
  businessName,
  inEditor = false,
}: {
  config: FooterConfig
  businessName: string
  inEditor?: boolean
}) {
  const currentYear = new Date().getFullYear()
  const copyright = plainText(config.copyright_text)
  const bgImage = config.background_image?.trim()

  return (
    <footer
      className="w-full text-center text-sm"
      style={{
        backgroundColor: config.background_color,
        color: config.text_color,
        paddingTop: config.padding_top ?? 32,
        paddingRight: config.padding_right ?? 24,
        paddingBottom: config.padding_bottom ?? 32,
        paddingLeft: config.padding_left ?? 24,
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
