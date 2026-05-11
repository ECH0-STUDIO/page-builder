import { FooterConfig } from '../types'

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
  
  return (
    <footer 
      className="w-full py-8 px-6 text-center text-sm"
      style={{ 
        backgroundColor: config.background_color, 
        color: config.text_color 
      }}
    >
      <div className="max-w-4xl mx-auto space-y-2">
        {config.show_business_name && (
          <p className="font-semibold text-lg">{businessName}</p>
        )}
        <p className="opacity-80">
          &copy; {currentYear} {config.copyright_text}
        </p>
        {!inEditor && (
          <p className="text-xs opacity-50 mt-4 pt-4 border-t border-current/10">
            Powered by Eatery
          </p>
        )}
      </div>
    </footer>
  )
}
