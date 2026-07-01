/**
 * ContactRender — shared between editor canvas and live page.
 * Uses config.background_color + config.text_color for theming.
 * Shows a VietQR payment card when paymentSettings are configured.
 */

import type { ContactConfig } from '../types'

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" fill="none" {...props}>
      <path d="M18 36C27.9411 36 36 27.9411 36 18C36 8.05887 27.9411 0 18 0C8.05887 0 0 8.05887 0 18C0 26.9856 6.5816 34.4277 15.1875 35.7801V23.2031H10.6172V18H15.1875V14.0344C15.1875 9.525 17.8692 7.03125 21.9902 7.03125C23.9592 7.03125 26.0156 7.38281 26.0156 7.38281V11.8125H23.7483C21.5168 11.8125 20.8125 13.1979 20.8125 14.6191V18H25.8047L25.0062 23.2031H20.8125V35.7801C29.4184 34.4277 36 26.9856 36 18Z" fill="#1877F2"/>
      <path d="M25.0062 23.2031L25.8047 18H20.8125V14.6191C20.8125 13.1979 21.5168 11.8125 23.7483 11.8125H26.0156V7.38281C26.0156 7.38281 23.9592 7.03125 21.9902 7.03125C17.8692 7.03125 15.1875 9.525 15.1875 14.0344V18H10.6172V23.2031H15.1875V35.7801C16.1118 35.9255 17.0494 36 18 36C18.9506 36 19.8882 35.9255 20.8125 35.7801V23.2031H25.0062Z" fill="white"/>
    </svg>
  )
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" fill="none" {...props}>
      <defs>
        <linearGradient id="ig-grad" x1="6.5" y1="36" x2="29" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFC107" />
          <stop offset="0.5" stopColor="#F44336" />
          <stop offset="1" stopColor="#9C27B0" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="10" fill="url(#ig-grad)"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M18 9.5c-2.17 0-2.44.01-3.29.04-.86.03-1.45.14-1.97.3-.53.16-.98.38-1.43.83-.45.45-.67.9-.83 1.43-.16.52-.27 1.11-.3 1.97-.03.85-.04 1.12-.04 3.29s.01 2.44.04 3.29c.03.86.14 1.45.3 1.97.16.53.38.98.83 1.43.45.45.9.67 1.43.83.52.16 1.11.27 1.97.3.85.03 1.12.04 3.29.04s2.44-.01 3.29-.04c.86-.03 1.45-.14 1.97-.3.53-.16.98-.38 1.43-.83.45-.45.67-.9.83-1.43.16-.52.27-1.11.3-1.97.03-.85.04-1.12.04-3.29s-.01-2.44-.04-3.29c-.03-.86-.14-1.45-.3-1.97-.16-.53-.38-.98-.83-1.43-.45-.45-.9-.67-1.43-.83-.52-.16-1.11-.27-1.97-.3-.85-.03-1.12-.04-3.29-.04zm0 1.98c2.13 0 2.39.01 3.23.04.78.03 1.2.15 1.48.25.37.14.64.31.92.59.28.28.45.55.59.92.1.28.22.7.25 1.48.03.84.04 1.1.04 3.23s-.01 2.39-.04 3.23c-.03.78-.15 1.2-.25 1.48a2.45 2.45 0 01-.59.92 2.45 2.45 0 01-.92.59c-.28.1-.7.22-1.48.25-.84.03-1.1.04-3.23.04s-2.39-.01-3.23-.04c-.78-.03-1.2-.15-1.48-.25a2.45 2.45 0 01-.92-.59 2.45 2.45 0 01-.59-.92c-.1-.28-.22-.7-.25-1.48-.03-.84-.04-1.1-.04-3.23s.01-2.39.04-3.23c.03-.78.15-1.2.25-1.48.14-.37.31-.64.59-.92.28-.28.55-.45.92-.59.28-.1.7-.22 1.48-.25.84-.03 1.1-.04 3.23-.04zM18 14.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm0 5.78a2.28 2.28 0 110-4.56 2.28 2.28 0 010 4.56zm5.67-6.39a.82.82 0 11-1.64 0 .82.82 0 011.64 0z" fill="white"/>
    </svg>
  )
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" fill="none" {...props}>
      <rect width="36" height="36" rx="10" fill="#FF0000" />
      <path d="M25.5 18l-12-7v14l12-7z" fill="white" />
    </svg>
  )
}

function TiktokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" fill="none" {...props}>
      <rect width="36" height="36" rx="10" fill="#010101" />
      <path
        d="M22.2 10v3.1a4.6 4.6 0 0 0 2.9-.9v3.4a7.8 7.8 0 0 1-2.9.6v6.6a6.4 6.4 0 1 1-4.6-6.1v3.7a2.5 2.5 0 1 0 1.8 2.4V10h2.8z"
        fill="#25F4EE"
        transform="translate(-0.55 -0.55)"
      />
      <path
        d="M22.2 10v3.1a4.6 4.6 0 0 0 2.9-.9v3.4a7.8 7.8 0 0 1-2.9.6v6.6a6.4 6.4 0 1 1-4.6-6.1v3.7a2.5 2.5 0 1 0 1.8 2.4V10h2.8z"
        fill="#EE1D52"
        transform="translate(0.55 0.55)"
      />
      <path
        d="M22.2 10v3.1a4.6 4.6 0 0 0 2.9-.9v3.4a7.8 7.8 0 0 1-2.9.6v6.6a6.4 6.4 0 1 1-4.6-6.1v3.7a2.5 2.5 0 1 0 1.8 2.4V10h2.8z"
        fill="white"
      />
    </svg>
  )
}

function ZaloIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" fill="none" {...props}>
      <rect width="36" height="36" rx="10" fill="#0068FF" />
      <path
        d="M10 11.5h16c1.1 0 2 .9 2 2v7.2c0 1.1-.9 2-2 2h-8.4l-3.6 3.2v-3.2H10c-1.1 0-2-.9-2-2v-7.2c0-1.1.9-2 2-2z"
        fill="white"
      />
      <text
        x="18"
        y="18.8"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#0068FF"
        fontSize="7"
        fontWeight="700"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        Zalo
      </text>
    </svg>
  )
}

const SOCIAL_PLATFORMS = [
  { key: 'facebook', label: 'Facebook', color: '#1877F2', icon: FacebookIcon },
  { key: 'instagram', label: 'Instagram', color: '#E1306C', icon: InstagramIcon },
  { key: 'zalo', label: 'Zalo', color: '#0068FF', icon: ZaloIcon },
  { key: 'tiktok', label: 'TikTok', color: '#010101', icon: TiktokIcon },
  { key: 'youtube', label: 'YouTube', color: '#FF0000', icon: YoutubeIcon },
]

const DAYS_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}

const MAP_HEIGHT: Record<string, string> = {
  small: '200px', medium: '320px', large: '460px',
}

type HoursEntry = { day: string; open: boolean; from: string; to: string }

interface ContactRenderProps {
  config: ContactConfig
  business: {
    name?: string
    address?: string | null
    city?: string | null
    phone?: string | null
    email?: string | null
    opening_hours?: unknown
    social_links?: unknown
  }
}

export function ContactRender({ config, business }: ContactRenderProps) {
  const socials = (business.social_links ?? {}) as Record<string, string>
  const hours = (business.opening_hours ?? []) as HoursEntry[]
  const addressParts = [business.address, business.city].filter(Boolean)
  const fullAddress = addressParts.join(', ')
  const mapSrc = fullAddress
    ? `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`
    : null

  const shownSocials = SOCIAL_PLATFORMS.filter(
    s => config.socials_shown.includes(s.key) && socials[s.key]
  )

  const textColor = config.text_color ?? '#111111'
  const labelColor = textColor + 'aa'



  const mapWidthFlex = config.layout === 'map_left' ? '1 1 300px' : '1 1 100%'
  const contentWidthFlex = (config.layout === 'map_left' && config.show_map) ? '1 1 300px' : '1 1 100%'

  return (
    <section>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '48px', alignItems: 'start' }}>

        {/* Map */}
        {config.show_map && mapSrc && (
          <div style={{ flex: mapWidthFlex, height: MAP_HEIGHT[config.map_height] ?? '320px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <iframe src={mapSrc} width="100%" height="100%" style={{ border: 0 }} loading="lazy" title="Business location map" />
          </div>
        )}
        {config.show_map && !mapSrc && (
          <div style={{ flex: mapWidthFlex, height: MAP_HEIGHT[config.map_height] ?? '320px', borderRadius: '16px', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '14px' }}>
            Map will appear once an address is set in Business Profile
          </div>
        )}
        
        {/* Structured Content Layout */}
        <div style={{ flex: contentWidthFlex, display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          {/* Top Info Grid (Address + Phone/Email) */}
          {(config.show_address || config.show_phone || config.show_email) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px' }}>
              {config.show_address && fullAddress && (
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: labelColor, textTransform: 'uppercase', margin: '0 0 8px' }}>Address</p>
                  <p style={{ fontSize: '16px', fontWeight: 500, color: textColor, lineHeight: 1.6, margin: 0 }}>{fullAddress}</p>
                </div>
              )}
              
              {(config.show_phone || config.show_email) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {config.show_phone && business.phone && (
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: labelColor, textTransform: 'uppercase', margin: '0 0 8px' }}>Phone</p>
                      <a href={`tel:${business.phone}`} style={{ fontSize: '18px', fontWeight: 600, color: textColor, textDecoration: 'none' }}>{business.phone}</a>
                    </div>
                  )}
                  {config.show_email && business.email && (
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: labelColor, textTransform: 'uppercase', margin: '0 0 8px' }}>Email</p>
                      <a href={`mailto:${business.email}`} style={{ fontSize: '16px', fontWeight: 500, color: textColor, textDecoration: 'none', wordBreak: 'break-all' }}>{business.email}</a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Secondary Grid (Hours + Socials) */}
          {(config.show_hours || shownSocials.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px' }}>
              {config.show_hours && hours.length > 0 && (
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: labelColor, textTransform: 'uppercase', margin: '0 0 16px' }}>Opening Hours</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {hours.map((h, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', maxWidth: '300px' }}>
                        <span style={{ fontWeight: 600, color: textColor }}>{DAYS_SHORT[h.day] ?? h.day}</span>
                        <span style={{ color: h.open ? textColor + 'cc' : labelColor, fontWeight: 500 }}>
                          {h.open ? `${h.from} – ${h.to}` : 'Closed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {shownSocials.length > 0 && (
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: labelColor, textTransform: 'uppercase', margin: '0 0 16px' }}>Connect</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                    {shownSocials.map(s => {
                      const Icon = s.icon
                      return (
                        <a key={s.key} href={socials[s.key]} target="_blank" rel="noopener noreferrer"
                          className="transition-transform duration-200 hover:scale-110"
                          style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            width: '40px', height: '40px', flexShrink: 0,
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))'
                          }}
                        >
                          <Icon style={{ width: '36px', height: '36px', display: 'block' }} />
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}


        </div>
      </div>
    </section>
  )
}
