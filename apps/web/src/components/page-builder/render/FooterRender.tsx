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
          <LiveStoreFooter />
        )}
      </div>
    </footer>
  )
}
